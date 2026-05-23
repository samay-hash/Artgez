import { Router, Request, Response, NextFunction } from 'express';
import { db, logEvent } from '../db/database';

const router = Router();
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'artgez-admin-2026';

// ─── Admin Auth Middleware ─────────────────────────────────────────────────────
function requireAdmin(req: Request, res: Response, next: NextFunction): void {
    const secret = req.headers['x-admin-secret'] as string;
    if (!secret || secret !== ADMIN_SECRET) {
        res.status(403).json({ success: false, error: 'Forbidden: Invalid admin key' });
        return;
    }
    next();
}

// Apply to all admin routes
router.use(requireAdmin);

// ─── GET /api/admin/stats — Dashboard overview ───────────────────────────────
router.get('/stats', (_req: Request, res: Response) => {
    try {
        const totalSketches = (db.prepare('SELECT COUNT(*) as count FROM sketches').get() as any).count;
        const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
        const totalEvents = (db.prepare('SELECT COUNT(*) as count FROM events').get() as any).count;
        const totalExhibitions = (db.prepare('SELECT COUNT(*) as count FROM exhibitions').get() as any).count;
        const uniqueSessions = (db.prepare('SELECT COUNT(DISTINCT session_id) as count FROM sketches').get() as any).count;

        // Recent activity (last 24h)
        const dayAgo = Date.now() - 86400000;
        const recentSketches = (db.prepare('SELECT COUNT(*) as count FROM sketches WHERE created_at > ?').get(dayAgo) as any).count;
        const recentEvents = (db.prepare('SELECT COUNT(*) as count FROM events WHERE timestamp > ?').get(dayAgo) as any).count;

        res.json({
            success: true,
            data: {
                totalSketches,
                totalUsers,
                totalEvents,
                totalExhibitions,
                uniqueSessions,
                recentSketches,
                recentEvents,
            },
        });
    } catch (err) {
        console.error('Admin stats error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ─── GET /api/admin/sketches — List ALL sketches ──────────────────────────────
router.get('/sketches', (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const offset = (page - 1) * limit;

        const total = (db.prepare('SELECT COUNT(*) as count FROM sketches').get() as any).count;
        const sketches = db.prepare(`
            SELECT id, session_id, name, pencil_id, pencil_label, paper_id, paper_label,
                   file_size, created_at, updated_at, image_data
            FROM sketches
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `).all(limit, offset);

        res.json({
            success: true,
            data: sketches,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (err) {
        console.error('Admin sketches error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ─── DELETE /api/admin/sketches/:id — Force delete ANY sketch ─────────────────
router.delete('/sketches/:id', (req: Request, res: Response) => {
    try {
        const result = db.prepare('DELETE FROM sketches WHERE id = ?').run(req.params.id);
        if (result.changes === 0) {
            res.status(404).json({ success: false, error: 'Sketch not found' });
            return;
        }
        logEvent('admin_delete_sketch', 'admin', req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error('Admin delete error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ─── GET /api/admin/users — List ALL users ────────────────────────────────────
router.get('/users', (_req: Request, res: Response) => {
    try {
        const users = db.prepare(`
            SELECT id, email, display_name, provider, plan, created_at
            FROM users
            ORDER BY created_at DESC
        `).all();

        res.json({ success: true, data: users });
    } catch (err) {
        console.error('Admin users error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ─── GET /api/admin/events — Recent events feed ──────────────────────────────
router.get('/events', (req: Request, res: Response) => {
    try {
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
        const events = db.prepare(`
            SELECT id, event_type, item_id, session_id, metadata, timestamp
            FROM events
            ORDER BY timestamp DESC
            LIMIT ?
        `).all(limit);

        res.json({ success: true, data: events });
    } catch (err) {
        console.error('Admin events error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
