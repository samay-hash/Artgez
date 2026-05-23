import Database, { type Database as SQLiteDatabase } from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = process.env.DB_PATH || './artop.db';
const dbPath = path.resolve(process.cwd(), DB_PATH);

export const db: SQLiteDatabase = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── SCHEMA ───────────────────────────────────────────────────────────────────

export function initializeDatabase(): void {
    db.exec(`
        -- Sketches: user-saved canvas drawings
        CREATE TABLE IF NOT EXISTS sketches (
            id          TEXT    PRIMARY KEY,
            session_id  TEXT    NOT NULL,
            name        TEXT    NOT NULL DEFAULT 'Untitled',
            image_data  TEXT    NOT NULL,
            pencil_id   TEXT    NOT NULL,
            pencil_label TEXT   NOT NULL,
            paper_id    TEXT    NOT NULL,
            paper_label TEXT    NOT NULL,
            file_size   INTEGER NOT NULL DEFAULT 0,
            created_at  INTEGER NOT NULL,
            updated_at  INTEGER NOT NULL
        );

        -- Analytics: track user interactions for business insights
        CREATE TABLE IF NOT EXISTS events (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type  TEXT    NOT NULL,
            item_id     TEXT,
            session_id  TEXT,
            metadata    TEXT,
            timestamp   INTEGER NOT NULL
        );

        -- AI cache: cache Gemini responses to save API calls
        CREATE TABLE IF NOT EXISTS ai_cache (
            cache_key   TEXT    PRIMARY KEY,
            response    TEXT    NOT NULL,
            created_at  INTEGER NOT NULL,
            expires_at  INTEGER NOT NULL
        );

        -- Users
        CREATE TABLE IF NOT EXISTS users (
            id          TEXT    PRIMARY KEY,
            email       TEXT    UNIQUE,
            password_hash TEXT,
            display_name TEXT,
            provider    TEXT    DEFAULT 'local',
            provider_id TEXT,
            plan        TEXT    NOT NULL DEFAULT 'free',
            created_at  INTEGER NOT NULL
        );

        -- Museum Exhibitions
        CREATE TABLE IF NOT EXISTS exhibitions (
            id          TEXT    PRIMARY KEY,
            session_id  TEXT    NOT NULL,
            sketch_id   TEXT    NOT NULL,
            name        TEXT    NOT NULL,
            image_data  TEXT    NOT NULL,
            frame_type  TEXT    NOT NULL DEFAULT 'gold',
            pencil_used TEXT    NOT NULL,
            paper_used  TEXT    NOT NULL,
            likes       INTEGER NOT NULL DEFAULT 0,
            created_at  INTEGER NOT NULL
        );

        -- Cooperative multiplayer drawing rooms
        CREATE TABLE IF NOT EXISTS co_rooms (
            id          TEXT    PRIMARY KEY,
            created_at  INTEGER NOT NULL
        );

        -- Cooperative canvas line strokes coordinates history
        CREATE TABLE IF NOT EXISTS room_strokes (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id     TEXT    NOT NULL,
            session_id  TEXT    NOT NULL,
            stroke_data TEXT    NOT NULL,
            color       TEXT    NOT NULL,
            size        REAL    NOT NULL,
            opacity     REAL    NOT NULL,
            timestamp   INTEGER NOT NULL
        );

        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_sketches_session ON sketches(session_id);
        CREATE INDEX IF NOT EXISTS idx_sketches_created ON sketches(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
        CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_exhibitions_created ON exhibitions(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_strokes_room ON room_strokes(room_id, timestamp);
    `);

    console.log('✅ Database initialized:', dbPath);
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export function logEvent(
    eventType: string,
    sessionId: string,
    itemId?: string,
    metadata?: Record<string, unknown>
): void {
    try {
        db.prepare(`
            INSERT INTO events (event_type, item_id, session_id, metadata, timestamp)
            VALUES (?, ?, ?, ?, ?)
        `).run(
            eventType,
            itemId ?? null,
            sessionId,
            metadata ? JSON.stringify(metadata) : null,
            Date.now()
        );
    } catch (err) {
        console.error('Failed to log event:', err);
    }
}

export function getCachedAI(key: string): string | null {
    const row = db.prepare(
        `SELECT response FROM ai_cache WHERE cache_key = ? AND expires_at > ?`
    ).get(key, Date.now()) as { response: string } | undefined;
    return row?.response ?? null;
}

export function setCachedAI(key: string, response: string, ttlMs = 24 * 60 * 60 * 1000): void {
    db.prepare(`
        INSERT OR REPLACE INTO ai_cache (cache_key, response, created_at, expires_at)
        VALUES (?, ?, ?, ?)
    `).run(key, response, Date.now(), Date.now() + ttlMs);
}
