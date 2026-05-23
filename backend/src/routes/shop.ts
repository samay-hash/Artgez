import { Router, Request, Response } from 'express';
import { db, logEvent } from '../db/database';
import { SHOP_DATA } from '../db/seed';

const router = Router();

// GET /api/shop — all items (with optional filter)
router.get('/', (req: Request, res: Response) => {
    const { type, brand, maxPrice, q } = req.query;

    let data = [...SHOP_DATA];

    if (type && type !== 'All') {
        data = data.filter(item => item.type === type);
    }
    if (brand) {
        data = data.filter(item => item.brand.toLowerCase().includes((brand as string).toLowerCase()));
    }
    if (maxPrice) {
        data = data.filter(item => item.price <= parseInt(maxPrice as string));
    }
    if (q) {
        const query = (q as string).toLowerCase();
        data = data.filter(item =>
            item.name.toLowerCase().includes(query) ||
            item.brand.toLowerCase().includes(query) ||
            item.desc.toLowerCase().includes(query)
        );
    }

    res.json({
        success: true,
        data,
        count: data.length,
        filters: { type, brand, maxPrice, q },
    });
});

// GET /api/shop/best-sellers
router.get('/best-sellers', (_req: Request, res: Response) => {
    const bestSellers = SHOP_DATA.filter(item => item.isBestSeller);
    res.json({ success: true, data: bestSellers });
});

// GET /api/shop/:id
router.get('/:id', (req: Request, res: Response) => {
    const item = SHOP_DATA.find(i => i.id === req.params.id);
    if (!item) {
        res.status(404).json({ success: false, error: 'Item not found' });
        return;
    }
    res.json({ success: true, data: item });
});

// POST /api/shop/:id/affiliate-click — track affiliate link click (revenue analytics)
router.post('/:id/affiliate-click', (req: Request, res: Response) => {
    const sessionId = req.headers['x-session-id'] as string || 'anonymous';
    const item = SHOP_DATA.find(i => i.id === req.params.id);

    if (!item) {
        res.status(404).json({ success: false, error: 'Item not found' });
        return;
    }

    logEvent('affiliate_click', sessionId, req.params.id, {
        itemName: item.name,
        brand: item.brand,
        price: item.price,
    });

    res.json({ success: true, affiliateUrl: item.affiliateUrl });
});

// POST /api/shop/:id/try-in-lab — track "Try in Lab" events
router.post('/:id/try-in-lab', (req: Request, res: Response) => {
    const sessionId = req.headers['x-session-id'] as string || 'anonymous';
    const item = SHOP_DATA.find(i => i.id === req.params.id);

    if (!item) {
        res.status(404).json({ success: false, error: 'Item not found' });
        return;
    }

    logEvent('try_in_lab', sessionId, req.params.id, {
        itemName: item.name,
        pencilId: item.pencilId,
    });

    res.json({
        success: true,
        pencilId: item.pencilId,
        message: item.pencilId ? 'Pencil loaded in lab' : 'No pencil associated',
    });
});

// POST /api/shop/checkout — execute a mock Razorpay payment checkout
router.post('/checkout', (req: Request, res: Response) => {
    const sessionId = req.headers['x-session-id'] as string || 'anonymous';
    const { itemId, itemName, amount, customerName, customerEmail, customerPhone, paymentMethod, address, city, pinCode } = req.body;

    const txId = `pay_MOCK_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;

    // Log checkout in database
    logEvent('checkout_success', sessionId, itemId, {
        itemName,
        amount,
        customerName,
        customerEmail,
        customerPhone,
        paymentMethod,
        address,
        city,
        pinCode,
        transactionId: txId
    });

    res.json({
        success: true,
        transactionId: txId,
        message: 'Mock payment authorized and logged successfully'
    });
});

// GET /api/shop/analytics/summary — business analytics (events summary)
router.get('/analytics/summary', (_req: Request, res: Response) => {
    const summary = db.prepare(`
        SELECT
            event_type,
            COUNT(*) as count,
            item_id
        FROM events
        WHERE timestamp > ?
        GROUP BY event_type, item_id
        ORDER BY count DESC
        LIMIT 20
    `).all(Date.now() - 7 * 24 * 60 * 60 * 1000); // last 7 days

    res.json({ success: true, data: summary, period: 'last_7_days' });
});

export default router;
