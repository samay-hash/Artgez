// ─── SHARED DATA & TYPES for Artgez ArtLab ─────────────────────────────────

export type PencilType = {
    id: string;
    label: string;
    brand: string;
    price: string;
    hardness: number;   // 0-1 (hard to soft)
    darkness: number;   // 0-1
    smudge: number;     // 0-1
    opacity: number;    // canvas rendering opacity
    size: number;       // base stroke width
    color: string;      // stroke color hex
    desc: string;
    bestFor: string[];
    category: 'graphite' | 'charcoal' | 'ink';
};

export type PaperType = {
    id: string;
    label: string;
    brand: string;
    grain: number;  // 0-1
    bg: string;     // background color
    desc: string;
};

export type Tool = 'pencil' | 'eraser' | 'line';

export type SavedSketch = {
    id: string;
    name: string;
    data: string;   // base64 PNG
    pencil: string;
    paper: string;
    date: string;
};

export type SupplyItem = {
    id: string;
    name: string;
    brand: string;
    type: 'Graphite' | 'Charcoal' | 'Ink' | 'Paper' | 'Kit';
    price: string;
    rating: number;
    reviews: number;
    pencilId: string | null;
    emoji: string;
    desc: string;
};

// ─── PENCILS DATA ──────────────────────────────────────────────────────────────

export const PENCILS: PencilType[] = [
    {
        id: '4h', label: '4H', brand: 'Faber-Castell', price: '₹49',
        hardness: 0.95, darkness: 0.12, smudge: 0.04, opacity: 0.2, size: 0.7, color: '#bbc5cf',
        desc: 'Very hard, razor-light marks for technical precision.',
        bestFor: ['Technical drawing', 'Construction lines', 'Architecture sketches'],
        category: 'graphite',
    },
    {
        id: '2h', label: '2H', brand: 'Faber-Castell', price: '₹49',
        hardness: 0.75, darkness: 0.28, smudge: 0.1, opacity: 0.35, size: 1.0, color: '#9aaab8',
        desc: 'Hard and precise — ideal for clean outlines.',
        bestFor: ['Outlines', 'Fine details', 'Illustration guides'],
        category: 'graphite',
    },
    {
        id: 'hb', label: 'HB', brand: 'Staedtler', price: '₹35',
        hardness: 0.5, darkness: 0.5, smudge: 0.35, opacity: 0.55, size: 1.5, color: '#555f70',
        desc: 'Perfect all-rounder. Every artist should own one.',
        bestFor: ['General sketching', 'Studies', 'Everyday drawing'],
        category: 'graphite',
    },
    {
        id: '2b', label: '2B', brand: 'Faber-Castell', price: '₹55',
        hardness: 0.35, darkness: 0.72, smudge: 0.55, opacity: 0.78, size: 2.2, color: '#2a2e40',
        desc: 'Soft and dark — the go-to for expressive shading.',
        bestFor: ['Shading', 'Portraits', 'Expressive marks'],
        category: 'graphite',
    },
    {
        id: '4b', label: '4B', brand: 'Faber-Castell', price: '₹65',
        hardness: 0.2, darkness: 0.87, smudge: 0.78, opacity: 0.9, size: 3.2, color: '#181a26',
        desc: 'Very dark and rich for dramatic shadow work.',
        bestFor: ['Deep shadows', 'Figure drawing', 'Bold strokes'],
        category: 'graphite',
    },
    {
        id: '6b', label: '6B', brand: 'Staedtler', price: '₹75',
        hardness: 0.08, darkness: 0.97, smudge: 0.92, opacity: 0.96, size: 4.8, color: '#0c0d18',
        desc: 'Blackest graphite — velvety, powdery, dramatic.',
        bestFor: ['Rich blacks', 'Gesture drawing', 'Large areas'],
        category: 'graphite',
    },
    {
        id: 'ch', label: 'Charcoal', brand: 'Camlin', price: '₹99',
        hardness: 0.12, darkness: 0.93, smudge: 0.97, opacity: 0.72, size: 6.5, color: '#1c1c1c',
        desc: 'Powdery and smudgeable — gestural and expressive.',
        bestFor: ['Life drawing', 'Bold gestures', 'Portrait work'],
        category: 'charcoal',
    },
    {
        id: 'ink', label: 'Ink Pen', brand: 'Sakura', price: '₹149',
        hardness: 1.0, darkness: 1.0, smudge: 0.0, opacity: 1.0, size: 1.2, color: '#04040e',
        desc: 'Permanent, crisp, zero smudge. Perfect for final inking.',
        bestFor: ['Inking', 'Comic art', 'Final linework'],
        category: 'ink',
    },
    {
        id: 'bp', label: 'Brush Pen', brand: 'Pentel', price: '₹199',
        hardness: 0.4, darkness: 0.92, smudge: 0.0, opacity: 0.93, size: 3.8, color: '#0e0d1e',
        desc: 'Flexible tip for calligraphy and expressive inking.',
        bestFor: ['Calligraphy', 'Comics', 'Expressive inking'],
        category: 'ink',
    },
];

// ─── PAPERS DATA ───────────────────────────────────────────────────────────────

export const PAPERS: PaperType[] = [
    { id: 'smooth',     label: 'Smooth',     brand: 'Fabriano', grain: 0,    bg: '#fdfbf7', desc: 'Ultra-smooth, best for detail work and ink.' },
    { id: 'rough',      label: 'Rough',      brand: 'Canson',   grain: 0.62, bg: '#f4efe5', desc: 'Heavy tooth — excellent for charcoal and pastels.' },
    { id: 'newsprint',  label: 'Newsprint',  brand: 'Generic',  grain: 0.28, bg: '#eee8d6', desc: 'Warm-toned, affordable. Great for practice.' },
    { id: 'watercolor', label: 'Watercolor', brand: 'Fabriano', grain: 0.85, bg: '#f7f2ea', desc: 'Highly textured and absorbent.' },
    { id: 'canvas',     label: 'Canvas',     brand: 'Generic',  grain: 0.72, bg: '#f0e9da', desc: 'Coarse and gritty — gives a painterly feel.' },
    { id: 'kraft',      label: 'Kraft',      brand: 'Generic',  grain: 0.22, bg: '#c9a87c', desc: 'Brown paper — warm tone, unique for white pencil highlights.' },
];

// ─── SUPPLY SHOP DATA ─────────────────────────────────────────────────────────

export const SUPPLY_SHOP: SupplyItem[] = [
    { id: 'fc-2b',  name: 'Faber-Castell 2B',         brand: 'Faber-Castell', type: 'Graphite', price: '₹55',  rating: 4.8, reviews: 1240, pencilId: '2b',  emoji: '✏️', desc: 'Best-selling graphite for shading and portrait work.' },
    { id: 'st-hb',  name: 'Staedtler HB (12pk)',       brand: 'Staedtler',     type: 'Graphite', price: '₹299', rating: 4.7, reviews: 890,  pencilId: 'hb',  emoji: '✏️', desc: 'A classroom staple. Reliable and consistent every time.' },
    { id: 'fc-6b',  name: 'Faber-Castell 6B',          brand: 'Faber-Castell', type: 'Graphite', price: '₹75',  rating: 4.9, reviews: 2100, pencilId: '6b',  emoji: '✏️', desc: 'The darkest graphite you can get. Dramatic and velvety.' },
    { id: 'cam-ch', name: 'Camlin Charcoal Pencils',   brand: 'Camlin',        type: 'Charcoal', price: '₹99',  rating: 4.6, reviews: 560,  pencilId: 'ch',  emoji: '🖤', desc: 'Smudgeable, powdery charcoal sticks for gestural art.' },
    { id: 'sk-ink', name: 'Sakura Pigma Micron 01',    brand: 'Sakura',        type: 'Ink',      price: '₹149', rating: 4.9, reviews: 3400, pencilId: 'ink', emoji: '🖊️', desc: 'Industry standard for inking and comic art.' },
    { id: 'pen-bp', name: 'Pentel Pocket Brush Pen',   brand: 'Pentel',        type: 'Ink',      price: '₹199', rating: 4.8, reviews: 780,  pencilId: 'bp',  emoji: '🖌️', desc: 'Flexible real-brush feel in a pen form.' },
    { id: 'fab-sm', name: 'Fabriano Smooth Sketch A4', brand: 'Fabriano',      type: 'Paper',    price: '₹450', rating: 4.7, reviews: 430,  pencilId: null,  emoji: '📒', desc: 'Premium smooth surface for graphite and ink work.' },
    { id: 'can-ro', name: 'Canson Rough Pad A4',        brand: 'Canson',        type: 'Paper',    price: '₹320', rating: 4.6, reviews: 290,  pencilId: null,  emoji: '📔', desc: 'Cold-press texture — perfect for charcoal and pastels.' },
    { id: 'st-set', name: 'Staedtler Sketch Set 8pc',  brand: 'Staedtler',     type: 'Kit',      price: '₹599', rating: 4.9, reviews: 1800, pencilId: null,  emoji: '🎨', desc: 'Complete beginner kit: HB to 6B + charcoal + eraser.' },
];
