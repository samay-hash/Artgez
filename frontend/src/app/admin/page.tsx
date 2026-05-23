'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trash2, Eye, EyeOff, Users, Image, Activity, Shield, RefreshCw, ChevronLeft, ChevronRight, Lock, Unlock, Download, BarChart3 } from 'lucide-react';
import Link from 'next/link';

type AdminSketch = {
    id: string;
    session_id: string;
    name: string;
    pencil_label: string;
    paper_label: string;
    file_size: number;
    created_at: number;
    image_data: string;
};

type AdminStats = {
    totalSketches: number;
    totalUsers: number;
    totalEvents: number;
    totalExhibitions: number;
    uniqueSessions: number;
    recentSketches: number;
    recentEvents: number;
};

type AdminUser = {
    id: string;
    email: string;
    display_name: string;
    provider: string;
    plan: string;
    created_at: number;
};

export default function AdminPanel() {
    const [adminSecret, setAdminSecret] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authError, setAuthError] = useState('');
    const [activeView, setActiveView] = useState<'stats' | 'sketches' | 'users' | 'events'>('stats');
    
    // Data
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [sketches, setSketches] = useState<AdminSketch[]>([]);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(false);
    const [expandedSketch, setExpandedSketch] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // ── Fetch Helpers ──────────────────────────────────────────────────────────
    const adminFetch = useCallback(async (endpoint: string, opts?: RequestInit) => {
        const res = await fetch(endpoint, {
            ...opts,
            headers: {
                'Content-Type': 'application/json',
                'x-admin-secret': adminSecret,
                ...(opts?.headers || {}),
            },
        });
        if (res.status === 403) {
            setIsAuthenticated(false);
            setAuthError('Session expired or invalid key');
            return null;
        }
        return res.json();
    }, [adminSecret]);

    const fetchStats = useCallback(async () => {
        const data = await adminFetch('/api/admin/stats');
        if (data?.success) setStats(data.data);
    }, [adminFetch]);

    const fetchSketches = useCallback(async (page = 1) => {
        setLoading(true);
        const data = await adminFetch(`/api/admin/sketches?page=${page}&limit=12`);
        if (data?.success) {
            setSketches(data.data);
            setPagination(data.pagination);
        }
        setLoading(false);
    }, [adminFetch]);

    const fetchUsers = useCallback(async () => {
        const data = await adminFetch('/api/admin/users');
        if (data?.success) setUsers(data.data);
    }, [adminFetch]);

    const fetchEvents = useCallback(async () => {
        const data = await adminFetch('/api/admin/events?limit=100');
        if (data?.success) setEvents(data.data);
    }, [adminFetch]);

    // ── Admin Login ─────────────────────────────────────────────────────────────
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');
        setLoading(true);
        try {
            const res = await fetch('/api/admin/stats', {
                headers: { 'x-admin-secret': adminSecret },
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setIsAuthenticated(true);
                    setStats(data.data);
                    localStorage.setItem('artgez_admin_key', adminSecret);
                }
            } else {
                setAuthError('Invalid admin secret key');
            }
        } catch {
            setAuthError('Backend not reachable');
        }
        setLoading(false);
    };

    // Restore saved admin key
    useEffect(() => {
        const saved = localStorage.getItem('artgez_admin_key');
        if (saved) {
            setAdminSecret(saved);
            // Auto-verify
            fetch('/api/admin/stats', { headers: { 'x-admin-secret': saved } })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setIsAuthenticated(true);
                        setStats(data.data);
                    }
                })
                .catch(() => {});
        }
    }, []);

    // Load data when view changes
    useEffect(() => {
        if (!isAuthenticated) return;
        if (activeView === 'stats') fetchStats();
        if (activeView === 'sketches') fetchSketches(1);
        if (activeView === 'users') fetchUsers();
        if (activeView === 'events') fetchEvents();
    }, [isAuthenticated, activeView, fetchStats, fetchSketches, fetchUsers, fetchEvents]);

    // ── Delete Sketch (Admin) ──────────────────────────────────────────────────
    const handleAdminDelete = async (id: string) => {
        const data = await adminFetch(`/api/admin/sketches/${id}`, { method: 'DELETE' });
        if (data?.success) {
            setSketches(prev => prev.filter(s => s.id !== id));
            setDeleteConfirm(null);
            if (stats) setStats({ ...stats, totalSketches: stats.totalSketches - 1 });
        }
    };

    // ── Login Screen ──────────────────────────────────────────────────────────
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 mb-4 shadow-lg shadow-amber-500/20">
                            <Shield size={28} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Artgez Admin</h1>
                        <p className="text-sm text-gray-500 mt-1">Owner Control Panel</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="relative">
                            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="password"
                                value={adminSecret}
                                onChange={(e) => setAdminSecret(e.target.value)}
                                placeholder="Admin Secret Key"
                                className="w-full bg-gray-800/80 border-2 border-gray-700 rounded-xl px-11 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm font-medium"
                                required
                            />
                        </div>
                        {authError && (
                            <motion.p 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }}
                                className="text-red-400 text-xs text-center font-semibold"
                            >
                                ⚠️ {authError}
                            </motion.p>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black py-3.5 rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 text-sm uppercase tracking-wider"
                        >
                            {loading ? 'Verifying...' : 'Enter Admin Panel'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link href="/" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                            ← Back to Artgez
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ── Authenticated Admin Panel ──────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Header */}
            <header className="border-b border-gray-800 bg-gray-950/90 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-bold">
                            <ArrowLeft size={14} /> Artgez
                        </Link>
                        <span className="text-gray-700">|</span>
                        <div className="flex items-center gap-2">
                            <Shield size={14} className="text-amber-500" />
                            <span className="text-sm font-black text-white">Admin Panel</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                localStorage.removeItem('artgez_admin_key');
                                setIsAuthenticated(false);
                                setAdminSecret('');
                            }}
                            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors font-bold"
                        >
                            <Unlock size={12} /> Sign Out
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                {/* Navigation Tabs */}
                <div className="flex gap-1 mb-6 bg-gray-900 rounded-xl p-1 w-fit">
                    {[
                        { id: 'stats' as const, label: 'Overview', icon: <BarChart3 size={14} /> },
                        { id: 'sketches' as const, label: 'All Sketches', icon: <Image size={14} /> },
                        { id: 'users' as const, label: 'Users', icon: <Users size={14} /> },
                        { id: 'events' as const, label: 'Activity Log', icon: <Activity size={14} /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveView(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                activeView === tab.id
                                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                                    : 'text-gray-500 hover:text-white hover:bg-gray-800'
                            }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── STATS VIEW ────────────────────────────────────────────── */}
                {activeView === 'stats' && stats && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: 'Total Sketches', value: stats.totalSketches, icon: '🎨', color: 'from-blue-500/20 to-blue-600/10' },
                                { label: 'Registered Users', value: stats.totalUsers, icon: '👥', color: 'from-emerald-500/20 to-emerald-600/10' },
                                { label: 'Unique Sessions', value: stats.uniqueSessions, icon: '🔑', color: 'from-purple-500/20 to-purple-600/10' },
                                { label: 'Exhibitions', value: stats.totalExhibitions, icon: '🖼️', color: 'from-amber-500/20 to-amber-600/10' },
                            ].map(stat => (
                                <div key={stat.label} className={`bg-gradient-to-br ${stat.color} border border-gray-800 rounded-xl p-5`}>
                                    <span className="text-2xl">{stat.icon}</span>
                                    <p className="text-3xl font-black mt-2">{stat.value}</p>
                                    <p className="text-xs text-gray-500 mt-1 font-semibold">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { label: 'Sketches (24h)', value: stats.recentSketches, icon: '📈' },
                                { label: 'Events (24h)', value: stats.recentEvents, icon: '⚡' },
                                { label: 'Total Events', value: stats.totalEvents, icon: '📊' },
                            ].map(stat => (
                                <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
                                    <span className="text-xl">{stat.icon}</span>
                                    <div>
                                        <p className="text-xl font-black">{stat.value}</p>
                                        <p className="text-xs text-gray-500 font-semibold">{stat.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── SKETCHES VIEW ─────────────────────────────────────────── */}
                {activeView === 'sketches' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500 font-semibold">{pagination.total} total sketches</p>
                            <button 
                                onClick={() => fetchSketches(pagination.page)} 
                                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-amber-400 transition-colors font-bold"
                            >
                                <RefreshCw size={12} /> Refresh
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                <AnimatePresence mode="popLayout">
                                    {sketches.map(sketch => (
                                        <motion.div
                                            key={sketch.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.85 }}
                                            className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden group hover:border-gray-600 transition-all"
                                        >
                                            {/* Thumbnail */}
                                            <div className="relative aspect-video bg-gray-800 overflow-hidden">
                                                {expandedSketch === sketch.id ? (
                                                    <img src={sketch.image_data} alt={sketch.name} className="w-full h-full object-contain bg-white" />
                                                ) : (
                                                    <img src={sketch.image_data} alt={sketch.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                )}
                                                {/* Actions overlay */}
                                                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button
                                                        onClick={() => setExpandedSketch(expandedSketch === sketch.id ? null : sketch.id)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-black hover:bg-white transition-all"
                                                        title="Toggle view"
                                                    >
                                                        {expandedSketch === sketch.id ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const a = document.createElement('a');
                                                            a.href = sketch.image_data;
                                                            a.download = `${sketch.name}.png`;
                                                            a.click();
                                                        }}
                                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-black hover:bg-white transition-all"
                                                        title="Download"
                                                    >
                                                        <Download size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(sketch.id)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/90 text-white hover:bg-red-500 transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="p-3 space-y-1.5">
                                                <p className="text-sm font-bold truncate">{sketch.name}</p>
                                                <div className="flex items-center justify-between text-[10px] text-gray-500">
                                                    <span>{sketch.pencil_label} • {sketch.paper_label}</span>
                                                    <span>{(sketch.file_size / 1024).toFixed(0)} KB</span>
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] text-gray-600">
                                                    <span className="font-mono truncate max-w-[120px]" title={sketch.session_id}>
                                                        {sketch.session_id.substring(0, 16)}...
                                                    </span>
                                                    <span>{new Date(sketch.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                                </div>
                                            </div>

                                            {/* Delete confirmation */}
                                            <AnimatePresence>
                                                {deleteConfirm === sketch.id && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="border-t border-gray-800 bg-red-500/10 px-3 py-2 flex items-center justify-between"
                                                    >
                                                        <span className="text-xs text-red-400 font-bold">Delete forever?</span>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setDeleteConfirm(null)}
                                                                className="text-xs text-gray-500 hover:text-white font-bold px-2 py-1"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={() => handleAdminDelete(sketch.id)}
                                                                className="text-xs bg-red-500 text-white font-bold px-3 py-1 rounded hover:bg-red-400 transition-colors"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-center gap-3 pt-4">
                                <button
                                    onClick={() => fetchSketches(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-900 text-xs font-bold disabled:opacity-30 hover:bg-gray-800 transition-colors"
                                >
                                    <ChevronLeft size={14} /> Prev
                                </button>
                                <span className="text-xs text-gray-500 font-semibold">
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => fetchSketches(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.totalPages}
                                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-900 text-xs font-bold disabled:opacity-30 hover:bg-gray-800 transition-colors"
                                >
                                    Next <ChevronRight size={14} />
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ── USERS VIEW ────────────────────────────────────────────── */}
                {activeView === 'users' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {users.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                                <Users size={40} className="mb-3 opacity-40" />
                                <p className="text-sm font-bold">No registered users yet</p>
                            </div>
                        ) : (
                            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                                                <th className="text-left px-4 py-3 font-bold">User</th>
                                                <th className="text-left px-4 py-3 font-bold">Email</th>
                                                <th className="text-left px-4 py-3 font-bold">Provider</th>
                                                <th className="text-left px-4 py-3 font-bold">Plan</th>
                                                <th className="text-left px-4 py-3 font-bold">Joined</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map(user => (
                                                <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                                                {user.display_name?.charAt(0)?.toUpperCase() || '?'}
                                                            </div>
                                                            <span className="font-bold text-white">{user.display_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{user.email}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                                                            user.provider === 'google' ? 'bg-blue-500/20 text-blue-400' :
                                                            user.provider === 'twitter' ? 'bg-sky-500/20 text-sky-400' :
                                                            'bg-gray-700 text-gray-400'
                                                        }`}>{user.provider}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                                                            user.plan === 'pro' ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-700 text-gray-400'
                                                        }`}>{user.plan}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500 text-xs">
                                                        {new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ── EVENTS VIEW ───────────────────────────────────────────── */}
                {activeView === 'events' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {events.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                                <Activity size={40} className="mb-3 opacity-40" />
                                <p className="text-sm font-bold">No events recorded yet</p>
                            </div>
                        ) : (
                            <div className="space-y-1.5 max-h-[70vh] overflow-y-auto">
                                {events.map((evt, i) => (
                                    <div key={evt.id || i} className="flex items-center gap-3 px-4 py-2.5 bg-gray-900 border border-gray-800/50 rounded-lg hover:border-gray-700 transition-colors">
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                                            evt.event_type.includes('save') ? 'bg-emerald-500' :
                                            evt.event_type.includes('delete') ? 'bg-red-500' :
                                            evt.event_type.includes('click') || evt.event_type.includes('buy') ? 'bg-amber-500' :
                                            'bg-blue-500'
                                        }`} />
                                        <span className="text-xs font-bold text-amber-400 font-mono uppercase w-36 shrink-0 truncate">{evt.event_type}</span>
                                        <span className="text-xs text-gray-500 font-mono truncate flex-1">
                                            {evt.session_id?.substring(0, 20)}
                                        </span>
                                        {evt.item_id && (
                                            <span className="text-[10px] text-gray-600 font-mono truncate max-w-[100px]" title={evt.item_id}>
                                                {evt.item_id.substring(0, 12)}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-gray-600 shrink-0">
                                            {new Date(evt.timestamp).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
