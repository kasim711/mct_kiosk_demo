import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { OrderService } from '../services/orderService';

const router = Router();

// Protect kitchen routes
router.use(authenticateToken);
router.use(requireRole(['ADMIN', 'MANAGER', 'KITCHEN', 'CASHIER']));

// 1. Get Active Kitchen Tickets (ONLY PAID, PREPARING, or READY orders)
router.get('/tickets', async (req: AuthRequest, res: Response) => {
  try {
    const tickets = await prisma.order.findMany({
      where: {
        status: { in: ['PAID', 'PREPARING', 'READY'] },
      },
      orderBy: { createdAt: 'asc' }, // FIFO: oldest order first
      include: {
        items: true,
      },
    });

    res.json(tickets);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Start Preparing Ticket
router.post('/tickets/:id/start-prep', async (req: AuthRequest, res: Response) => {
  try {
    const updated = await OrderService.updateOrderStatus(
      req.params.id,
      'PREPARING',
      req.user?.id,
      req.user?.name
    );

    res.json({
      success: true,
      order: updated,
      message: `Order #${updated.orderNumber} is now PREPARING.`,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 3. Mark Ticket as READY for pickup
router.post('/tickets/:id/ready', async (req: AuthRequest, res: Response) => {
  try {
    const updated = await OrderService.updateOrderStatus(
      req.params.id,
      'READY',
      req.user?.id,
      req.user?.name
    );

    res.json({
      success: true,
      order: updated,
      message: `Order #${updated.orderNumber} is READY for pickup.`,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 4. Mark Ticket as COMPLETED (Handed to customer)
router.post('/tickets/:id/complete', async (req: AuthRequest, res: Response) => {
  try {
    const updated = await OrderService.updateOrderStatus(
      req.params.id,
      'COMPLETED',
      req.user?.id,
      req.user?.name
    );

    res.json({
      success: true,
      order: updated,
      message: `Order #${updated.orderNumber} has been COMPLETED.`,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
