import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { PrintService } from '../services/printService';
import { emitSettingsUpdated } from '../services/socketService';

const router = Router();

// Protect admin routes
router.use(authenticateToken);
router.use(requireRole(['ADMIN', 'MANAGER']));

// ==========================================
// 1. DASHBOARD OVERVIEW & ANALYTICS
// ==========================================
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayOrders = await prisma.order.findMany({
      where: { createdAt: { gte: todayStart } },
      include: { payment: true },
    });

    const todayOrdersCount = todayOrders.length;
    const pendingPaymentsCount = todayOrders.filter((o) => o.status === 'PENDING_PAYMENT').length;
    const paidOrders = todayOrders.filter((o) => ['PAID', 'PREPARING', 'READY', 'COMPLETED'].includes(o.status));
    const paidOrdersCount = paidOrders.length;
    const cancelledCount = todayOrders.filter((o) => o.status === 'CANCELLED').length;

    // Total sales in baisa from paid/completed orders
    const todaySalesBaisa = paidOrders.reduce((sum, o) => sum + o.totalBaisa, 0);
    const aovBaisa = paidOrdersCount > 0 ? Math.round(todaySalesBaisa / paidOrdersCount) : 0;

    // Hourly orders distribution
    const hourlyOrders = Array(24).fill(0);
    const hourlySales = Array(24).fill(0);

    for (const order of paidOrders) {
      const hour = new Date(order.createdAt).getHours();
      hourlyOrders[hour] += 1;
      hourlySales[hour] += order.totalBaisa / 1000;
    }

    res.json({
      summary: {
        todaySalesOmr: (todaySalesBaisa / 1000).toFixed(3),
        todayOrdersCount,
        pendingPaymentsCount,
        paidOrdersCount,
        cancelledCount,
        averageOrderValueOmr: (aovBaisa / 1000).toFixed(3),
      },
      hourlyChart: {
        hours: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        orders: hourlyOrders,
        salesOmr: hourlySales,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. PRODUCTS MANAGEMENT (CRUD)
// ==========================================
router.get('/products', async (req: AuthRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        category: true,
        modifierGroups: {
          include: {
            group: {
              include: { options: true },
            },
          },
        },
      },
    });

    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products', async (req: AuthRequest, res: Response) => {
  try {
    const {
      categoryId,
      nameEn,
      nameAr,
      descEn,
      descAr,
      priceBaisa,
      imageUrl,
      modifierGroupIds,
    } = req.body;

    if (!categoryId || !nameEn || !nameAr || priceBaisa === undefined) {
      return res.status(400).json({ error: 'Missing required product fields' });
    }

    const created = await prisma.product.create({
      data: {
        categoryId,
        nameEn,
        nameAr,
        descEn,
        descAr,
        priceBaisa: parseInt(priceBaisa, 10),
        imageUrl,
      },
    });

    if (modifierGroupIds && Array.isArray(modifierGroupIds)) {
      for (const gId of modifierGroupIds) {
        await prisma.productModifierGroup.create({
          data: {
            productId: created.id,
            groupId: gId,
          },
        });
      }
    }

    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/products/:id', async (req: AuthRequest, res: Response) => {
  try {
    const {
      categoryId,
      nameEn,
      nameAr,
      descEn,
      descAr,
      priceBaisa,
      imageUrl,
      isAvailable,
      modifierGroupIds,
    } = req.body;

    const updateData: any = {};
    if (categoryId) updateData.categoryId = categoryId;
    if (nameEn) updateData.nameEn = nameEn;
    if (nameAr) updateData.nameAr = nameAr;
    if (descEn !== undefined) updateData.descEn = descEn;
    if (descAr !== undefined) updateData.descAr = descAr;
    if (priceBaisa !== undefined) updateData.priceBaisa = parseInt(priceBaisa, 10);
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (isAvailable !== undefined) updateData.isAvailable = Boolean(isAvailable);

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: updateData,
    });

    if (modifierGroupIds && Array.isArray(modifierGroupIds)) {
      await prisma.productModifierGroup.deleteMany({
        where: { productId: updated.id },
      });
      for (const gId of modifierGroupIds) {
        await prisma.productModifierGroup.create({
          data: { productId: updated.id, groupId: gId },
        });
      }
    }

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/products/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.product.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 3. CATEGORIES MANAGEMENT (CRUD)
// ==========================================
router.get('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    });
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const { nameEn, nameAr, icon, sortOrder } = req.body;
    if (!nameEn || !nameAr) {
      return res.status(400).json({ error: 'Both English and Arabic category names required' });
    }

    const created = await prisma.category.create({
      data: {
        nameEn,
        nameAr,
        icon,
        sortOrder: sortOrder ? parseInt(sortOrder, 10) : 0,
      },
    });

    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/categories/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { nameEn, nameAr, icon, sortOrder, isActive } = req.body;
    const updated = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        nameEn,
        nameAr,
        icon,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder, 10) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/categories/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.category.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true, message: 'Category deleted' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 4. MODIFIERS MANAGEMENT
// ==========================================
router.get('/modifiers', async (req: AuthRequest, res: Response) => {
  try {
    const groups = await prisma.modifierGroup.findMany({
      include: {
        options: { orderBy: { sortOrder: 'asc' } },
      },
    });
    res.json(groups);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/modifiers/groups', async (req: AuthRequest, res: Response) => {
  try {
    const { nameEn, nameAr, minSelect, maxSelect, isRequired } = req.body;
    const created = await prisma.modifierGroup.create({
      data: {
        nameEn,
        nameAr,
        minSelect: minSelect ? parseInt(minSelect, 10) : 0,
        maxSelect: maxSelect ? parseInt(maxSelect, 10) : 1,
        isRequired: Boolean(isRequired),
      },
    });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/modifiers/options', async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, nameEn, nameAr, priceDeltaBaisa } = req.body;
    const created = await prisma.modifierOption.create({
      data: {
        groupId,
        nameEn,
        nameAr,
        priceDeltaBaisa: priceDeltaBaisa ? parseInt(priceDeltaBaisa, 10) : 0,
      },
    });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 5. ALL ORDERS & AUDIT LOGS
// ==========================================
router.get('/orders', async (req: AuthRequest, res: Response) => {
  try {
    const { status, dateFrom, dateTo } = req.query;

    const where: any = {};
    if (status) where.status = String(status);
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(String(dateFrom));
      if (dateTo) where.createdAt.lte = new Date(String(dateTo));
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
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

router.get('/audit-logs', async (req: AuthRequest, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. REPORTS & SALES INSIGHTS
// ==========================================
router.get('/reports', async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['PAID', 'PREPARING', 'READY', 'COMPLETED'] },
      },
      include: {
        items: true,
        payment: true,
      },
    });

    const totalRevenueBaisa = orders.reduce((sum, o) => sum + o.totalBaisa, 0);

    // Payment method breakdown
    const paymentBreakdown: Record<string, number> = { CASH: 0, CARD: 0, OTHER: 0 };
    for (const o of orders) {
      const method = o.payment?.paymentMethod || 'OTHER';
      paymentBreakdown[method] = (paymentBreakdown[method] || 0) + o.totalBaisa;
    }

    // Top selling items
    const itemMap: Record<string, { nameEn: string; nameAr: string; qty: number; revenueBaisa: number }> = {};
    for (const o of orders) {
      for (const item of o.items) {
        const key = item.productNameEn;
        if (!itemMap[key]) {
          itemMap[key] = {
            nameEn: item.productNameEn,
            nameAr: item.productNameAr,
            qty: 0,
            revenueBaisa: 0,
          };
        }
        itemMap[key].qty += item.quantity;
        itemMap[key].revenueBaisa += item.totalPriceBaisa;
      }
    }

    const topSelling = Object.values(itemMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10)
      .map((item) => ({
        nameEn: item.nameEn,
        nameAr: item.nameAr,
        quantity: item.qty,
        revenueOmr: (item.revenueBaisa / 1000).toFixed(3),
      }));

    res.json({
      totalRevenueOmr: (totalRevenueBaisa / 1000).toFixed(3),
      totalPaidOrders: orders.length,
      paymentBreakdown: {
        cashOmr: ((paymentBreakdown.CASH || 0) / 1000).toFixed(3),
        cardOmr: ((paymentBreakdown.CARD || 0) / 1000).toFixed(3),
        otherOmr: ((paymentBreakdown.OTHER || 0) / 1000).toFixed(3),
      },
      topSelling,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. RESTAURANT & TAX / PRINTER SETTINGS
// ==========================================
router.get('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.restaurantSettings.findUnique({
      where: { id: 'default_settings' },
    });
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const updated = await prisma.restaurantSettings.update({
      where: { id: 'default_settings' },
      data: req.body,
    });

    emitSettingsUpdated(updated);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        userName: req.user?.name,
        action: 'SETTINGS_UPDATED',
        entity: 'RestaurantSettings',
        details: `Restaurant and tax settings updated by ${req.user?.name}.`,
      },
    });

    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Test Print Route
router.post('/printer/test', async (req: AuthRequest, res: Response) => {
  try {
    const result = await PrintService.generateTestReceipt();
    res.json({
      success: true,
      result,
      message: 'Test print processed successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
