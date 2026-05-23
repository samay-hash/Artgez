import { Router, Request, Response } from 'express';
import { db, logEvent } from '../db/database';

const router = Router();

/**
 * POST /api/rooms
 * Creates a cooperative drawing room code (e.g. ROOM_3A8D)
 */
router.post('/', (req: Request, res: Response) => {
    const sessionId = req.headers['x-session-id'] as string || 'anonymous';
    const roomId = `ROOM_${Math.random().toString(36).substring(2, 6).toUpperCase()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    try {
        db.prepare(`
            INSERT INTO co_rooms (id, created_at)
            VALUES (?, ?)
        `).run(roomId, Date.now());

        logEvent('ROOM_CREATE', sessionId, roomId);
        res.json({ success: true, roomId });
    } catch (err) {
        console.error('Failed to create room:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

/**
 * GET /api/rooms/:id/strokes
 * Fetches all strokes drawn in the room since a specific timestamp
 */
router.get('/:id/strokes', (req: Request, res: Response) => {
    const roomId = req.params.id;
    const since = parseInt(req.query.since as string, 10) || 0;

    try {
        // Verify room exists
        const room = db.prepare(`SELECT * FROM co_rooms WHERE id = ?`).get(roomId);
        if (!room) {
            res.status(404).json({ success: false, error: 'Co-draw room not found' });
            return;
        }

        const rows = db.prepare(`
            SELECT * FROM room_strokes 
            WHERE room_id = ? AND timestamp > ? 
            ORDER BY timestamp ASC
        `).all(roomId, since) as any[];

        res.json({
            success: true,
            strokes: rows.map(r => ({
                id: r.id,
                sessionId: r.session_id,
                strokeData: JSON.parse(r.stroke_data),
                color: r.color,
                size: r.size,
                opacity: r.opacity,
                timestamp: r.timestamp
            }))
        });
    } catch (err) {
        console.error('Failed to fetch strokes:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

/**
 * POST /api/rooms/:id/strokes
 * Saves a new drawing stroke coordinates coordinate path
 */
router.post('/:id/strokes', (req: Request, res: Response) => {
    const roomId = req.params.id;
    const { strokeData, color, size, opacity } = req.body;
    const sessionId = req.headers['x-session-id'] as string || 'anonymous';

    if (!strokeData || !color || size === undefined || opacity === undefined) {
        res.status(400).json({ success: false, error: 'Missing required stroke data' });
        return;
    }

    try {
        // Verify room exists
        const room = db.prepare(`SELECT * FROM co_rooms WHERE id = ?`).get(roomId);
        if (!room) {
            res.status(404).json({ success: false, error: 'Co-draw room not found' });
            return;
        }

        const timestamp = Date.now();
        db.prepare(`
            INSERT INTO room_strokes (room_id, session_id, stroke_data, color, size, opacity, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            roomId,
            sessionId,
            JSON.stringify(strokeData),
            color,
            size,
            opacity,
            timestamp
        );

        res.json({ success: true, timestamp });
    } catch (err) {
        console.error('Failed to push stroke:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

export default router;
