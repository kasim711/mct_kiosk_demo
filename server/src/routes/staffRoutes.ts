import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { OrderService } from '../services/orderService';
import { PrintService } from '../services/printService';

const router = Router();

// Protect all staff routes
router.use(authenticateToken);
router.use(requireRole(['ADMIN', 'MANAGER', 'CASHIER']));

// 1. Get Live Orders for Cashier POS
router.get('/orders', async (req: AuthRequest, res: Response) => {
  try {
    const { status, kioskId, search } = req.query;

    const whereClause: any = {};

    if (status) {
      whereClause.status = String(status);
    }

    if (kioskId) {
      whereClause.kioskId = String(kioskId);
    }

    if (search) {
      const searchNum = parseInt(String(search).replace(/[^0-9]/g, ''), 10);
      if (!isNaN(searchNum)) {
        whereClause.orderNumber = searchNum;
      }
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        items: true,
        payment: true,
      },
    });

    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Mark Order as PAID (Cashier Counter Settlement)
router.post('/orders/:id/pay', async (req: AuthRequest, res: Response) => {
  try {
    const { paymentMethod, receivedBaisa, notes } = req.body;

    if (!paymentMethod || !['CASH', 'CARD', 'OTHER'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Valid payment method required (CASH, CARD, OTHER)' });
    }

    const result = await OrderService.markAsPaid({
      orderId: req.params.id,
      paymentMethod,
      receivedBaisa: receivedBaisa ? parseInt(receivedBaisa, 10) : undefined,
      cashierId: req.user?.id,
      cashierName: req.user?.name,
      notes,
    });

    // Optionally generate a paid receipt
    const receiptPayload = await PrintService.processOrderReceipt(result.order);

    res.json({
      success: true,
      order: result.order,
      payment: result.payment,
      receipt: receiptPayload,
      message: `Order #${result.order.orderNumber} successfully marked as PAID.`,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 3. Cancel / Void Order (Requires Mandatory Reason)
router.post('/orders/:id/cancel', async (req: AuthRequest, res: Response) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Cancellation reason is required' });
    }

    const order = await OrderService.cancelOrder(
      req.params.id,
      reason,
      req.user?.id,
      req.user?.name
    );

    res.json({
      success: true,
      order,
      message: `Order #${order.orderNumber} has been cancelled.`,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 4. Reprint Receipt
router.post('/orders/:id/reprint', async (req: AuthRequest, res: Response) => {
  try {
    const order = await OrderService.recordReprint(
      req.params.id,
      req.user?.id,
      req.user?.name
    );

    const receiptPayload = await PrintService.processOrderReceipt(order, { isReprint: true });

    res.json({
      success: true,
      order,
      receipt: receiptPayload,
      message: `Receipt for Order #${order.orderNumber} reprinted.`,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
