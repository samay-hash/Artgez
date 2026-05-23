import { Router, Request, Response } from 'express';
import { logEvent, db } from '../db/database';

const router = Router();

/**
 * POST /api/events
 * Logs user session events to the SQLite database
 */
router.post('/', (req: Request, res: Response) => {
    const { eventType, itemId, metadata } = req.body;
    const sessionId = req.headers['x-session-id'] as string || 'anonymous';

    if (!eventType) {
        res.status(400).json({ success: false, error: 'eventType is required' });
        return;
    }

    try {
        logEvent(eventType, sessionId, itemId || undefined, metadata || undefined);
        res.json({ success: true });
    } catch (err) {
        console.error('Failed to log event:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

/**
 * GET /api/events/funnel
 * Aggregates logs to compute Mixpanel-style metrics and returns recent logs
 */
router.get('/funnel', (req: Request, res: Response) => {
    try {
        // 1. Core funnel counts (Unique Sessions as active users)
        const totalSessionsRow = db.prepare(`
            SELECT COUNT(DISTINCT session_id) as count FROM events
        `).get() as { count: number };
        const totalSessions = totalSessionsRow?.count || 0;

        // Count specific events
        const getCount = (type: string) => {
            const row = db.prepare(`
                SELECT COUNT(*) as count FROM events WHERE event_type = ?
            `).get(type) as { count: number };
            return row?.count || 0;
        };

        const tryLabCount = getCount('PENCIL_TRY');
        
        // Any AI Assist event
        const aiRow = db.prepare(`
            SELECT COUNT(*) as count FROM events 
            WHERE event_type IN ('ai_style_detect', 'ai_recommend', 'AI_SCAN_MATCH', 'AI_STYLE_DETECT')
        `).get() as { count: number };
        const aiAssistCount = aiRow?.count || 0;

        const checkoutClickCount = getCount('CHECKOUT_CLICK');
        const checkoutSuccessCount = getCount('CHECKOUT_SUCCESS');

        // 2. Financial Metrics: Sum prices from CHECKOUT_SUCCESS event metadata
        const successEvents = db.prepare(`
            SELECT metadata FROM events WHERE event_type = 'CHECKOUT_SUCCESS'
        `).all() as { metadata: string | null }[];

        let totalRevenue = 0;
        successEvents.forEach(e => {
            if (e.metadata) {
                try {
                    const meta = JSON.parse(e.metadata);
                    const priceStr = meta.price || '₹0';
                    const numericPrice = parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
                    if (!isNaN(numericPrice)) {
                        totalRevenue += numericPrice;
                    }
                } catch (err) {
                    // ignore malformed metadata
                }
            }
        });

        // 3. Live activity logs (recent 15 events)
        const recentLogs = db.prepare(`
            SELECT * FROM events ORDER BY timestamp DESC LIMIT 15
        `).all() as { id: number; event_type: string; item_id: string | null; session_id: string | null; metadata: string | null; timestamp: number }[];

        const formattedLogs = recentLogs.map(l => {
            let metaObj = {};
            if (l.metadata) {
                try {
                    metaObj = JSON.parse(l.metadata);
                } catch {
                    // fallback
                }
            }
            return {
                id: l.id,
                eventType: l.event_type,
                itemId: l.item_id,
                sessionId: l.session_id,
                metadata: metaObj,
                timeString: new Date(l.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                dateString: new Date(l.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            };
        });

        res.json({
            success: true,
            data: {
                metrics: {
                    totalSessions: Math.max(totalSessions, 1), // prevent division by zero
                    tryLabCount,
                    aiAssistCount,
                    checkoutClickCount,
                    checkoutSuccessCount,
                    totalRevenue,
                    conversionRate: totalSessions > 0 ? ((checkoutSuccessCount / totalSessions) * 100).toFixed(1) : '0.0',
                    checkoutConversionRate: checkoutClickCount > 0 ? ((checkoutSuccessCount / checkoutClickCount) * 100).toFixed(1) : '0.0',
                },
                logs: formattedLogs
            }
        });
    } catch (err) {
        console.error('Failed to compute funnel:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

export default router;
