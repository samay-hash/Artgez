import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db/database';

// Routes
import pencilsRouter from './routes/pencils';
import sketchesRouter from './routes/sketches';
import shopRouter from './routes/shop';
import aiRouter from './routes/ai';
import eventsRouter from './routes/events';
import exhibitionsRouter from './routes/exhibitions';
import roomsRouter from './routes/rooms';
import authRouter from './routes/auth';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
    origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id'],
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));  // large limit for base64 sketch images
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
    app.use((req, _res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
        next();
    });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/pencils', pencilsRouter);
app.use('/api/sketches', sketchesRouter);
app.use('/api/shop', shopRouter);
app.use('/api/ai', aiRouter);
app.use('/api/events', eventsRouter);
app.use('/api/exhibitions', exhibitionsRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/auth', authRouter);

// Health check
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'Artgez API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// API info
app.get('/api', (_req, res) => {
    res.json({
        service: 'Artgez Backend API',
        version: '1.0.0',
        endpoints: {
            pencils: {
                'GET /api/pencils': 'All pencils',
                'GET /api/pencils/:id': 'Single pencil',
                'GET /api/pencils/papers/all': 'All papers',
            },
            sketches: {
                'GET /api/sketches?session=ID': 'List sketches',
                'POST /api/sketches': 'Save sketch',
                'DELETE /api/sketches/:id': 'Delete sketch',
                'GET /api/sketches/:id/download': 'Download sketch',
            },
            shop: {
                'GET /api/shop': 'All items (filter: type, brand, maxPrice, q)',
                'GET /api/shop/best-sellers': 'Best sellers',
                'POST /api/shop/:id/affiliate-click': 'Track affiliate click',
                'POST /api/shop/:id/try-in-lab': 'Track try-in-lab',
            },
            ai: {
                'POST /api/ai/style-detect': 'Analyze sketch style (Gemini Vision)',
                'POST /api/ai/recommend': 'Budget-based supply recommendations',
                'POST /api/ai/compatibility': 'Pencil + paper compatibility check',
                'GET /api/ai/pencil-insight/:id': 'AI insight about a pencil',
                'POST /api/ai/quick-tip': 'Contextual drawing tip',
            },
        },
    });
});

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    });
});

// ─── Start ────────────────────────────────────────────────────────────────────

async function start() {
    try {
        initializeDatabase();

        app.listen(PORT, () => {
            console.log('');
            console.log('🎨 Artgez Backend API');
            console.log('─────────────────────────────────────');
            console.log(`🚀 Server:   http://localhost:${PORT}`);
            console.log(`📖 API Docs: http://localhost:${PORT}/api`);
            console.log(`🏥 Health:   http://localhost:${PORT}/health`);
            console.log(`🤖 Gemini:   ${process.env.GEMINI_API_KEY ? '✅ Connected' : '❌ Missing API Key'}`);
            console.log('─────────────────────────────────────');
            console.log('');
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

start();
