import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { OrderService } from '../services/orderService';
import { PrintService } from '../services/printService';

const router = Router();

// 1. Get Public Menu for Kiosks
router.get('/menu', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        products: {
          where: { isAvailable: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            modifierGroups: {
              include: {
                group: {
                  include: {
                    options: {
                      where: { isAvailable: true },
                      orderBy: { sortOrder: 'asc' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get Public Restaurant Settings
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const settings = await prisma.restaurantSettings.findUnique({
      where: { id: 'default_settings' },
    });

    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    // Return safe public settings
    res.json({
      restaurantNameEn: settings.restaurantNameEn,
      restaurantNameAr: settings.restaurantNameAr,
      addressEn: settings.addressEn,
      addressAr: settings.addressAr,
      phone: settings.phone,
      currencyCode: settings.currencyCode,
      currencySymbolAr: settings.currencySymbolAr,
      isTaxEnabled: settings.isTaxEnabled,
      taxRatePercent: settings.taxRatePercent,
      isTaxIncludedInPrice: settings.isTaxIncludedInPrice,
      receiptHeaderEn: settings.receiptHeaderEn,
      receiptHeaderAr: settings.receiptHeaderAr,
      receiptFooterEn: settings.receiptFooterEn,
      receiptFooterAr: settings.receiptFooterAr,
      defaultLanguage: settings.defaultLanguage,
      idleTimeoutSeconds: settings.idleTimeoutSeconds,
      printerWidth: settings.printerWidth,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Create Order from Kiosk (Secure Server-Side Calculation & Atomic Sequence)
router.post('/orders', async (req: Request, res: Response) => {
  try {
    const { kioskId, orderType, tableNumber, customerLanguage, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain items' });
    }

    if (orderType === 'DINE_IN' && !tableNumber) {
      // Dine-in orders require a table number
      return res.status(400).json({ error: 'Table number is required for Dine-in orders' });
    }

    // Process order creation inside atomic transaction with server pricing
    const order = await OrderService.createOrder({
      kioskId: kioskId || 'Kiosk-1',
      orderType: orderType || 'DINE_IN',
      tableNumber,
      customerLanguage: customerLanguage || 'en',
      items,
    });

    // Generate thermal receipt payload (and attempt hardware print if configured)
    const receiptPayload = await PrintService.processOrderReceipt(order);

    res.status(201).json({
      order,
      receipt: receiptPayload,
      message: 'Order created successfully. Please take receipt to the counter to complete payment.',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 4. Check Order Status
router.get('/orders/:id', async (req: Request, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true, payment: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
