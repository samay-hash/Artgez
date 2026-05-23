'use client';

import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = 'ac4712c68de709ad8ccdfb56d0dc3cb6'; // Mixpanel Public Project Token

if (typeof window !== 'undefined' && MIXPANEL_TOKEN) {
    try {
        mixpanel.init(MIXPANEL_TOKEN, {
            debug: process.env.NODE_ENV === 'development',
            track_pageview: true,
            persistence: 'localStorage'
        });
    } catch (err) {
        console.warn('Failed to initialize real Mixpanel Client:', err);
    }
}

/**
 * 📊 Artgez Analytics Tracker (Mixpanel Funnel Simulator)
 * Tracks user events on both the frontend developer console, the real Mixpanel dashboard, and persists them to the backend SQLite DB.
 */
export function logEvent(
    eventType: string,
    itemId?: string | null,
    metadata?: Record<string, any>
) {
    if (typeof window === 'undefined') return;

    const sessionId = localStorage.getItem('artgez-session-id') || 'anonymous';
    const timestamp = Date.now();

    // 1. Stylish Developer Console Telemetry
    console.log(
        `%c📊 [Mixpanel Funnel Event]`,
        'background: #7c3aed; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
        eventType,
        {
            itemId,
            sessionId,
            timestamp: new Date(timestamp).toLocaleTimeString(),
            ...metadata
        }
    );

    // 2. Dispatch to Real Mixpanel (if token is provided)
    if (MIXPANEL_TOKEN) {
        try {
            mixpanel.track(eventType, {
                distinct_id: sessionId,
                itemId: itemId || null,
                ...metadata
            });
        } catch (err) {
            console.warn('Real Mixpanel tracking failed:', err);
        }
    }

    // 3. Dispatch to Backend for SQLite Relational persistence
    fetch('/api/events', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-session-id': sessionId,
        },
        body: JSON.stringify({
            eventType,
            itemId: itemId || null,
            metadata: metadata || {}
        })
    }).catch(err => {
        console.warn('SQLite analytics logging failed:', err);
    });
}
