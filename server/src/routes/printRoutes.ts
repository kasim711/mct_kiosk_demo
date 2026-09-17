import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { PrintService } from '../services/printService';

const router = Router();

// Get formatted receipt for any order
router.get('/order/:id', async (req: Request, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true, payment: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const payload = await PrintService.processOrderReceipt(order);
    res.json(payload);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Generate test receipt
router.post('/test', async (req: Request, res: Response) => {
  try {
    const payload = await PrintService.generateTestReceipt();
    res.json(payload);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
