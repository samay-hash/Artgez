import { Router, Request, Response } from 'express';
import { PENCILS_DATA, PAPERS_DATA } from '../db/seed';

const router = Router();

// GET /api/pencils — all pencils
router.get('/', (_req: Request, res: Response) => {
    res.json({
        success: true,
        data: PENCILS_DATA,
        count: PENCILS_DATA.length,
    });
});

// GET /api/pencils/:id — single pencil
router.get('/:id', (req: Request, res: Response) => {
    const pencil = PENCILS_DATA.find(p => p.id === req.params.id);
    if (!pencil) {
        res.status(404).json({ success: false, error: 'Pencil not found' });
        return;
    }
    res.json({ success: true, data: pencil });
});

// GET /api/pencils/category/:category
router.get('/category/:category', (req: Request, res: Response) => {
    const filtered = PENCILS_DATA.filter(p => p.category === req.params.category);
    res.json({ success: true, data: filtered, count: filtered.length });
});

// GET /api/papers
router.get('/papers/all', (_req: Request, res: Response) => {
    res.json({ success: true, data: PAPERS_DATA, count: PAPERS_DATA.length });
});

// GET /api/papers/:id
router.get('/papers/:id', (req: Request, res: Response) => {
    const paper = PAPERS_DATA.find(p => p.id === req.params.id);
    if (!paper) {
        res.status(404).json({ success: false, error: 'Paper not found' });
        return;
    }
    res.json({ success: true, data: paper });
});

export default router;
