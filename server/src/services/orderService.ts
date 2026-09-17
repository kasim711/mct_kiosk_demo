import { prisma } from '../prisma';
import { emitOrderCreated, emitOrderPaid, emitOrderStatusChanged, emitOrderCancelled } from './socketService';

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
  modifierOptionIds?: string[];
  specialNotes?: string;
}

export interface CreateOrderInput {
  kioskId?: string;
  orderType: 'DINE_IN' | 'TAKEAWAY';
  tableNumber?: string;
  customerLanguage?: 'en' | 'ar';
  items: CreateOrderItemInput[];
}

export interface MarkAsPaidInput {
  orderId: string;
  paymentMethod: 'CASH' | 'CARD' | 'OTHER';
  receivedBaisa?: number; // For cash
  cashierId?: string;
  cashierName?: string;
  notes?: string;
}

export class OrderService {
  /**
   * Creates an order with strict server-side pricing and atomic sequential order numbering.
   */
  static async createOrder(input: CreateOrderInput) {
    if (!input.items || input.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    // Run atomically inside a transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      // 1. Get restaurant settings for tax calculations
      const settings = await tx.restaurantSettings.findUnique({
        where: { id: 'default_settings' },
      });

      const isTaxEnabled = settings?.isTaxEnabled ?? true;
      const taxRatePercent = settings?.taxRatePercent ?? 5.0;
      const isTaxIncludedInPrice = settings?.isTaxIncludedInPrice ?? true;

      // 2. Fetch and validate all products from database (Zero client price trust)
      const productIds = input.items.map((i) => i.productId);
      const dbProducts = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      const productMap = new Map(dbProducts.map((p) => [p.id, p]));

      // 3. Fetch all modifier options from database
      const allOptionIds: string[] = [];
      for (const item of input.items) {
        if (item.modifierOptionIds && item.modifierOptionIds.length > 0) {
          allOptionIds.push(...item.modifierOptionIds);
        }
      }

      const dbOptions = await tx.modifierOption.findMany({
        where: { id: { in: allOptionIds } },
      });
      const optionMap = new Map(dbOptions.map((o) => [o.id, o]));

      // 4. Calculate exact item prices and prepare snapshots
      let calculatedSubtotalBaisa = 0;
      const preparedOrderItems: any[] = [];

      for (const itemInput of input.items) {
        const product = productMap.get(itemInput.productId);
        if (!product) {
          throw new Error(`Product not found or unavailable: ${itemInput.productId}`);
        }
        if (!product.isAvailable) {
          throw new Error(`Product is currently unavailable: ${product.nameEn}`);
        }

        const quantity = Math.max(1, Math.floor(itemInput.quantity || 1));
        const unitPriceBaisa = product.priceBaisa;

        // Modifiers
        let modifiersPriceBaisa = 0;
        const selectedModifiersSnapshot: any[] = [];

        if (itemInput.modifierOptionIds && itemInput.modifierOptionIds.length > 0) {
          for (const optId of itemInput.modifierOptionIds) {
            const opt = optionMap.get(optId);
            if (opt && opt.isAvailable) {
              modifiersPriceBaisa += opt.priceDeltaBaisa;
              selectedModifiersSnapshot.push({
                id: opt.id,
                nameEn: opt.nameEn,
                nameAr: opt.nameAr,
                priceDeltaBaisa: opt.priceDeltaBaisa,
              });
            }
          }
        }

        const itemTotalBaisa = (unitPriceBaisa + modifiersPriceBaisa) * quantity;
        calculatedSubtotalBaisa += itemTotalBaisa;

        preparedOrderItems.push({
          productId: product.id,
          productNameEn: product.nameEn, // Snapshot
          productNameAr: product.nameAr, // Snapshot
          unitPriceBaisa,               // Snapshot
          quantity,
          modifiersPriceBaisa,           // Snapshot
          totalPriceBaisa: itemTotalBaisa, // Snapshot
          selectedModifiersJson: JSON.stringify(selectedModifiersSnapshot),
          specialNotes: itemInput.specialNotes?.trim() || null,
        });
      }

      // 5. Calculate VAT / Tax exactly in Baisa (integer thousandths)
      let taxBaisa = 0;
      let totalBaisa = 0;
      let subtotalBaisa = calculatedSubtotalBaisa;

      if (isTaxEnabled && taxRatePercent > 0) {
        if (isTaxIncludedInPrice) {
          // Prices include tax: Tax = Subtotal * (Rate / (100 + Rate))
          taxBaisa = Math.round(subtotalBaisa * (taxRatePercent / (100 + taxRatePercent)));
          totalBaisa = subtotalBaisa;
        } else {
          // Tax is added on top
          taxBaisa = Math.round(subtotalBaisa * (taxRatePercent / 100));
          totalBaisa = subtotalBaisa + taxBaisa;
        }
      } else {
        totalBaisa = subtotalBaisa;
      }

      // 6. Atomic order sequence increment (Safe across restarts and concurrent kiosk orders)
      const sequence = await tx.orderSequence.upsert({
        where: { id: 'order_sequence' },
        create: { id: 'order_sequence', prefix: '#', nextNumber: 1002 },
        update: { nextNumber: { increment: 1 } },
      });

      // The order number assigned is (nextNumber - 1) before the increment
      const assignedOrderNumber = sequence.nextNumber - 1;
      const displayOrderNumber = `${sequence.prefix}${assignedOrderNumber}`;

      // 7. Create the Order with its snapshot items
      const created = await tx.order.create({
        data: {
          orderNumber: assignedOrderNumber,
          displayOrderNumber,
          kioskId: input.kioskId || 'Kiosk-1',
          orderType: input.orderType || 'DINE_IN',
          tableNumber: input.orderType === 'DINE_IN' ? input.tableNumber?.trim() || null : null,
          status: 'PENDING_PAYMENT', // MUST START AS PENDING PAYMENT
          subtotalBaisa,
          taxBaisa,
          totalBaisa,
          customerLanguage: input.customerLanguage || 'en',
          items: {
            create: preparedOrderItems,
          },
        },
        include: {
          items: true,
        },
      });

      return created;
    });

    // Notify staff & admin real-time
    emitOrderCreated(newOrder);

    return newOrder;
  }

  /**
   * Cashier collects payment at counter and marks order as PAID
   */
  static async markAsPaid(input: MarkAsPaidInput) {
    const { orderId, paymentMethod, receivedBaisa, cashierId, cashierName, notes } = input;

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, payment: true },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== 'PENDING_PAYMENT') {
        throw new Error(`Order cannot be paid; current status is ${order.status}`);
      }

      let changeBaisa = 0;
      let finalReceivedBaisa: number | null = null;

      if (paymentMethod === 'CASH') {
        if (receivedBaisa === undefined || receivedBaisa === null) {
          throw new Error('Cash payment requires received amount');
        }
        if (receivedBaisa < order.totalBaisa) {
          throw new Error(
            `Received amount (${(receivedBaisa / 1000).toFixed(3)} OMR) is less than order total (${(
              order.totalBaisa / 1000
            ).toFixed(3)} OMR)`
          );
        }
        finalReceivedBaisa = receivedBaisa;
        changeBaisa = receivedBaisa - order.totalBaisa;
      }

      // Update Order Status to PAID
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
        include: { items: true },
      });

      // Create Payment record
      const payment = await tx.payment.create({
        data: {
          orderId,
          amountBaisa: order.totalBaisa,
          paymentMethod,
          receivedBaisa: finalReceivedBaisa,
          changeBaisa: paymentMethod === 'CASH' ? changeBaisa : null,
          cashierId: cashierId || null,
          cashierName: cashierName || 'Cashier Counter',
          notes: notes || null,
        },
      });

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          userId: cashierId || null,
          userName: cashierName || 'Cashier',
          action: 'PAYMENT_COLLECTED',
          entity: 'Order',
          entityId: orderId,
          details: `Order #${order.orderNumber} marked PAID via ${paymentMethod}. Total: ${(
            order.totalBaisa / 1000
          ).toFixed(3)} OMR. Received: ${
            finalReceivedBaisa !== null ? (finalReceivedBaisa / 1000).toFixed(3) : 'N/A'
          } OMR, Change: ${(changeBaisa / 1000).toFixed(3)} OMR.`,
        },
      });

      return { order: updatedOrder, payment };
    });

    // Notify Staff, Admin, and Kitchen (KDS receives order only after it is PAID!)
    emitOrderPaid(result.order, result.payment);

    return result;
  }

  /**
   * Kitchen or Staff updates order status (PREPARING, READY, COMPLETED)
   */
  static async updateOrderStatus(orderId: string, newStatus: string, staffId?: string, staffName?: string) {
    const validStatuses = ['PREPARING', 'READY', 'COMPLETED'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status transition: ${newStatus}`);
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new Error('Order not found');
    }

    // Rules: Can only prepare after PAID
    if (newStatus === 'PREPARING' && order.status !== 'PAID') {
      throw new Error('Cannot prepare an unpaid order. Payment must be collected first.');
    }

    const updateData: any = {
      status: newStatus,
    };
    if (newStatus === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: { items: true, payment: true },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: staffId || null,
        userName: staffName || 'Kitchen/Staff',
        action: `STATUS_CHANGED_TO_${newStatus}`,
        entity: 'Order',
        entityId: orderId,
        details: `Order #${order.orderNumber} status changed from ${order.status} to ${newStatus}.`,
      },
    });

    emitOrderStatusChanged(updatedOrder);

    return updatedOrder;
  }

  /**
   * Cashier / Staff cancels an order with mandatory reason
   */
  static async cancelOrder(orderId: string, reason: string, staffId?: string, staffName?: string) {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Cancellation reason is required');
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'COMPLETED') {
      throw new Error('Cannot cancel an already completed order');
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cancelReason: reason.trim(),
        cancelledByStaffId: staffId || null,
      },
      include: { items: true, payment: true },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: staffId || null,
        userName: staffName || 'Staff',
        action: 'ORDER_CANCELLED',
        entity: 'Order',
        entityId: orderId,
        details: `Order #${order.orderNumber} cancelled. Reason: ${reason.trim()}`,
      },
    });

    emitOrderCancelled(updatedOrder);

    return updatedOrder;
  }

  /**
   * Reprint receipt: increments print count and logs audit
   */
  static async recordReprint(orderId: string, staffId?: string, staffName?: string) {
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        printCount: { increment: 1 },
        lastPrintedAt: new Date(),
      },
      include: { items: true, payment: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: staffId || null,
        userName: staffName || 'Staff',
        action: 'RECEIPT_REPRINTED',
        entity: 'Order',
        entityId: orderId,
        details: `Order #${updated.orderNumber} receipt reprinted (Print count: ${updated.printCount}).`,
      },
    });

    return updated;
  }
}
