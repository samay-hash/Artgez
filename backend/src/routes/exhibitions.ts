import { Router, Request, Response } from 'express';
import { db, logEvent } from '../db/database';

const router = Router();

/**
 * GET /api/exhibitions
 * Returns all framed sketches published in the virtual exhibition hall
 */
router.get('/', (req: Request, res: Response) => {
    try {
        const rows = db.prepare(`
            SELECT * FROM exhibitions ORDER BY created_at DESC
        `).all() as any[];

        res.json({
            success: true,
            data: rows.map(r => ({
                id: r.id,
                sessionId: r.session_id,
                sketchId: r.sketch_id,
                name: r.name,
                imageData: r.image_data,
                frameType: r.frame_type,
                pencilUsed: r.pencil_used,
                paperUsed: r.paper_used,
                likes: r.likes,
                createdAt: new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
            }))
        });
    } catch (err) {
        console.error('Failed to get exhibitions:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

/**
 * POST /api/exhibitions
 * Publishes a sketch to the virtual gallery wall with custom framing selection
 */
router.post('/', (req: Request, res: Response) => {
    const { sketchId, name, imageData, frameType, pencilUsed, paperUsed } = req.body;
    const sessionId = req.headers['x-session-id'] as string || 'anonymous';

    if (!sketchId || !imageData || !pencilUsed || !paperUsed) {
        res.status(400).json({ success: false, error: 'Missing required framing details' });
        return;
    }

    const id = `ex_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
    const frame = frameType || 'gold';

    try {
        db.prepare(`
            INSERT INTO exhibitions (id, session_id, sketch_id, name, image_data, frame_type, pencil_used, paper_used, likes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
        `).run(
            id,
            sessionId,
            sketchId,
            name || 'Untitled',
            imageData,
            frame,
            pencilUsed,
            paperUsed,
            Date.now()
        );

        logEvent('EXHIBIT_POST', sessionId, id, { frameType: frame, name });
        res.json({ success: true, id });
    } catch (err) {
        console.error('Failed to post exhibition:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

/**
 * POST /api/exhibitions/:id/like
 * Increments the like telemetry count for a framed piece of artwork
 */
router.post('/:id/like', (req: Request, res: Response) => {
    const { id } = req.params;
    const sessionId = req.headers['x-session-id'] as string || 'anonymous';

    try {
        const row = db.prepare(`SELECT * FROM exhibitions WHERE id = ?`).get(id) as any;
        if (!row) {
            res.status(404).json({ success: false, error: 'Exhibited art not found' });
            return;
        }

        db.prepare(`
            UPDATE exhibitions SET likes = likes + 1 WHERE id = ?
        `).run(id);

        logEvent('EXHIBIT_LIKE', sessionId, id, { artName: row.name });
        res.json({ success: true, likes: row.likes + 1 });
    } catch (err) {
        console.error('Failed to like artwork:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

/**
 * DELETE /api/exhibitions/:id
 * Deletes a framed piece of artwork from the virtual gallery wall
 */
router.delete('/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const sessionId = req.headers['x-session-id'] as string || 'anonymous';

    try {
        const row = db.prepare(`SELECT * FROM exhibitions WHERE id = ?`).get(id) as any;
        if (!row) {
            res.status(404).json({ success: false, error: 'Exhibited art not found' });
            return;
        }

        // Check permission: Must be the creator (matching session_id) OR an admin session
        const isCreator = row.session_id === sessionId;
        const isAdmin = sessionId.toLowerCase().includes('admin') || sessionId === 'admin';

        if (!isCreator && !isAdmin) {
            res.status(403).json({ success: false, error: 'Forbidden: You do not have permission to delete this artwork' });
            return;
        }

        db.prepare(`DELETE FROM exhibitions WHERE id = ?`).run(id);

        logEvent('EXHIBIT_DELETE', sessionId, id, { artName: row.name });
        res.json({ success: true, message: 'Artwork deleted successfully' });
    } catch (err) {
        console.error('Failed to delete artwork:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

export default router;
