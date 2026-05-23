import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { db, logEvent } from '../db/database';

const router = Router();

// ─── Validation Schemas ────────────────────────────────────────────────────────

const SaveSketchSchema = z.object({
    name: z.string().min(1).max(100).default('Untitled'),
    imageData: z.string().min(100),   // base64 PNG
    pencilId: z.string(),
    pencilLabel: z.string(),
    paperId: z.string(),
    paperLabel: z.string(),
    sessionId: z.string().optional(),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/sketches?session=xxx — list sketches for session
router.get('/', (req: Request, res: Response) => {
    const sessionId = (req.query.session as string) || req.headers['x-session-id'] as string;
    if (!sessionId) {
        res.status(400).json({ success: false, error: 'Session ID required' });
        return;
    }

    const sketches = db.prepare(`
        SELECT id, name, pencil_id, pencil_label, paper_id, paper_label,
               file_size, created_at, updated_at, image_data
        FROM sketches
        WHERE session_id = ?
        ORDER BY created_at DESC
        LIMIT 50
    `).all(sessionId);

    res.json({ success: true, data: sketches, count: (sketches as unknown[]).length });
});

// GET /api/sketches/:id — get single sketch with full image data
router.get('/:id', (req: Request, res: Response) => {
    const sessionId = (req.query.session as string) || req.headers['x-session-id'] as string;
    const sketch = db.prepare(
        `SELECT * FROM sketches WHERE id = ? AND session_id = ?`
    ).get(req.params.id, sessionId);

    if (!sketch) {
        res.status(404).json({ success: false, error: 'Sketch not found' });
        return;
    }
    res.json({ success: true, data: sketch });
});

// POST /api/sketches — save a sketch
router.post('/', (req: Request, res: Response) => {
    const parsed = SaveSketchSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ success: false, errors: parsed.error.issues });
        return;
    }

    const { name, imageData, pencilId, pencilLabel, paperId, paperLabel, sessionId } = parsed.data;
    const sid = sessionId || (req.headers['x-session-id'] as string) || uuidv4();
    const id = uuidv4();
    const now = Date.now();
    const fileSize = Math.ceil(imageData.length * 0.75); // approximate bytes from base64

    db.prepare(`
        INSERT INTO sketches (id, session_id, name, image_data, pencil_id, pencil_label,
                              paper_id, paper_label, file_size, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, sid, name, imageData, pencilId, pencilLabel, paperId, paperLabel, fileSize, now, now);

    logEvent('save_sketch', sid, id, { pencilId, paperId });

    res.status(201).json({
        success: true,
        data: { id, sessionId: sid, name, pencilLabel, paperLabel, createdAt: now },
    });
});

// PATCH /api/sketches/:id — rename a sketch
router.patch('/:id', (req: Request, res: Response) => {
    const sessionId = req.headers['x-session-id'] as string;
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
        res.status(400).json({ success: false, error: 'Name is required' });
        return;
    }

    const result = db.prepare(
        `UPDATE sketches SET name = ?, updated_at = ? WHERE id = ? AND session_id = ?`
    ).run(name.slice(0, 100), Date.now(), req.params.id, sessionId);

    if (result.changes === 0) {
        res.status(404).json({ success: false, error: 'Sketch not found' });
        return;
    }
    res.json({ success: true, message: 'Sketch renamed' });
});

// DELETE /api/sketches/:id
router.delete('/:id', (req: Request, res: Response) => {
    const sessionId = (req.query.session as string) || req.headers['x-session-id'] as string;
    const result = db.prepare(
        `DELETE FROM sketches WHERE id = ? AND session_id = ?`
    ).run(req.params.id, sessionId);

    if (result.changes === 0) {
        res.status(404).json({ success: false, error: 'Sketch not found or unauthorized' });
        return;
    }

    logEvent('delete_sketch', sessionId, req.params.id);
    res.json({ success: true, message: 'Sketch deleted' });
});

// GET /api/sketches/:id/download — returns sketch with full image data for download
router.get('/:id/download', (req: Request, res: Response) => {
    const sessionId = (req.query.session as string) || req.headers['x-session-id'] as string;
    const sketch = db.prepare(
        `SELECT name, image_data FROM sketches WHERE id = ? AND session_id = ?`
    ).get(req.params.id, sessionId) as { name: string; image_data: string } | undefined;

    if (!sketch) {
        res.status(404).json({ success: false, error: 'Sketch not found' });
        return;
    }

    logEvent('download_sketch', sessionId, req.params.id);
    res.json({ success: true, name: sketch.name, imageData: sketch.image_data });
});

export default router;
