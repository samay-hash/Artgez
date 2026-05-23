import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Simple SHA-256 hash for passwords (in production, use bcrypt/argon2)
function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken(user: any) {
    return jwt.sign(
        { id: user.id, email: user.email, display_name: user.display_name },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// ─── Validation Schemas ───────────────────────────────────────────────────────

const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    displayName: z.string().min(2),
});

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

const OAuthSchema = z.object({
    provider: z.enum(['google', 'twitter']),
    providerId: z.string(),
    email: z.string().email(),
    displayName: z.string(),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 */
router.post('/register', (req: Request, res: Response) => {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ success: false, errors: parsed.error.issues });
        return;
    }

    const { email, password, displayName } = parsed.data;

    try {
        // Check if user exists
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existingUser) {
            res.status(409).json({ success: false, error: 'Email already registered' });
            return;
        }

        const userId = `usr_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
        const hashedPassword = hashPassword(password);

        db.prepare(`
            INSERT INTO users (id, email, password_hash, display_name, provider, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(userId, email, hashedPassword, displayName, 'local', Date.now());

        const user = { id: userId, email, display_name: displayName };
        const token = generateToken(user);

        res.json({ success: true, token, user });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * POST /api/auth/login
 */
router.post('/login', (req: Request, res: Response) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ success: false, errors: parsed.error.issues });
        return;
    }

    const { email, password } = parsed.data;
    const hashedPassword = hashPassword(password);

    try {
        const user = db.prepare('SELECT id, email, display_name FROM users WHERE email = ? AND password_hash = ?').get(email, hashedPassword) as any;
        
        if (!user) {
            res.status(401).json({ success: false, error: 'Invalid email or password' });
            return;
        }

        const token = generateToken(user);
        res.json({ success: true, token, user });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * POST /api/auth/oauth
 * Simulates OAuth login/registration flow
 */
router.post('/oauth', (req: Request, res: Response) => {
    const parsed = OAuthSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ success: false, errors: parsed.error.issues });
        return;
    }

    const { provider, providerId, email, displayName } = parsed.data;

    try {
        // Try to find existing user by email
        let user = db.prepare('SELECT id, email, display_name, provider FROM users WHERE email = ?').get(email) as any;

        if (!user) {
            // Create new OAuth user
            const userId = `usr_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
            db.prepare(`
                INSERT INTO users (id, email, display_name, provider, provider_id, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(userId, email, displayName, provider, providerId, Date.now());

            user = { id: userId, email, display_name: displayName, provider };
        } else {
            // Update provider details if they logged in with email before but now use OAuth
            if (user.provider === 'local') {
                db.prepare(`UPDATE users SET provider = ?, provider_id = ? WHERE id = ?`).run(provider, providerId, user.id);
            }
        }

        const token = generateToken(user);
        res.json({ success: true, token, user });
    } catch (err) {
        console.error('OAuth error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
