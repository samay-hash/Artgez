'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Brain, Upload, Check, AlertCircle, ShoppingBag, Loader2, Sparkles, 
    Camera, Video, RotateCcw, TrendingUp, DollarSign, Activity, Eye, RefreshCw 
} from 'lucide-react';
import RoughCard from './RoughCard';
import RoughButton from './RoughButton';
import { PENCILS, PAPERS } from './data';
import { logEvent } from '@/src/lib/analytics';

type Props = {
    sessionId: string;
    onTryInLab: (pencilId: string) => void;
};

export default function AIAssist({ sessionId, onTryInLab }: Props) {
    const [activeSubTab, setActiveSubTab] = useState<'style' | 'scan' | 'recommend' | 'compat' | 'analytics'>('style');

    // ─── STYLE DETECTOR STATE ───────────────────────────────────────────────────
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [detecting, setDetecting] = useState(false);
    const [detectResult, setDetectResult] = useState<{
        detectedStyle: string;
        confidence: number;
        styleDescription: string;
        primaryTechniques: string[];
        recommendedPencilsData: any[];
        recommendedPapersData: any[];
        reasoning: string;
        levelEstimate: string;
        improvementTip: string;
    } | null>(null);

    // ─── CAMERA SCANNER STATE ───────────────────────────────────────────────────
    const videoRef = useRef<HTMLVideoElement>(null);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [streamActive, setStreamActive] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState<{
        detectedBrand: string;
        detectedModel: string;
        matchedTwinId: string;
        confidenceScore: number;
        explanation: string;
        twinData: any;
    } | null>(null);

    // ─── RECOMMEND STATE ────────────────────────────────────────────────────────
    const [budget, setBudget] = useState('600');
    const [level, setLevel] = useState('beginner');
    const [goal, setGoal] = useState('portraits');
    const [recommending, setRecommending] = useState(false);
    const [recommendResult, setRecommendResult] = useState<{
        totalEstimate: number;
        budgetUsage: string;
        priorityList: { rank: number; itemId: string; name: string; price: number; reason: string; buyWhen: string; skipIf: string }[];
        budgetTip: string;
        nextLevelTip: string;
        doNotBuy: string[];
    } | null>(null);

    // ─── COMPATIBILITY STATE ────────────────────────────────────────────────────
    const [pencilId, setPencilId] = useState(PENCILS[3].id); // 2B
    const [paperId, setPaperId] = useState(PAPERS[0].id); // Smooth
    const [checkingCompat, setCheckingCompat] = useState(false);
    const [compatResult, setCompatResult] = useState<{
        compatible: boolean;
        compatibilityScore: number;
        score?: number;
        rating: string;
        status?: string;
        headline: string;
        whatHappens: string;
        explanation?: string;
        pros: string[];
        cons: string[];
        tip: string;
        alternativePaper: string;
    } | null>(null);

    // ─── FUNNEL ANALYTICS STATE ─────────────────────────────────────────────────
    const [funnelData, setFunnelData] = useState<any | null>(null);
    const [loadingFunnel, setLoadingFunnel] = useState(false);

    // ─── CAMERA HANDLERS ────────────────────────────────────────────────────────
    const startCamera = async () => {
        setScanResult(null);
        setCapturedImage(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraStream(stream);
            setStreamActive(true);
            logEvent('camera_stream_start');
        } catch (err) {
            console.error('Camera open failed:', err);
            alert('Failed to access camera. Please upload an image file instead.');
        }
    };

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
        }
        setStreamActive(false);
        setCameraStream(null);
    };

    const capturePhoto = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL('image/png');
            stopCamera();
            setCapturedImage(base64);
            triggerScanMatch(base64);
        }
    };

    const handleCameraUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result as string;
            setCapturedImage(base64);
            triggerScanMatch(base64);
        };
        reader.readAsDataURL(file);
    };

    const triggerScanMatch = async (base64: string) => {
        setScanning(true);
        setScanResult(null);
        try {
            const res = await fetch('/api/ai/scan-match', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-session-id': sessionId,
                },
                body: JSON.stringify({ image: base64, sessionId }),
            });
            const result = await res.json();
            if (result.success) {
                setScanResult(result.data);
            } else {
                console.error('Scan matching failed:', result.error);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setScanning(false);
        }
    };

    useEffect(() => {
        return () => {
            // Clean up camera stream on unmount
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [cameraStream]);

    // ─── FUNNEL LOAD HANDLER ────────────────────────────────────────────────────
    const fetchFunnelData = async () => {
        setLoadingFunnel(true);
        try {
            const res = await fetch('/api/events/funnel');
            const result = await res.json();
            if (result.success) {
                setFunnelData(result.data);
            }
        } catch (err) {
            console.error('Failed to fetch funnel:', err);
        } finally {
            setLoadingFunnel(false);
        }
    };

    useEffect(() => {
        if (activeSubTab === 'analytics') {
            fetchFunnelData();
        }
    }, [activeSubTab]);

    // ─── OTHER HANDLERS ─────────────────────────────────────────────────────────

    // Style detector
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = reader.result as string;
            setSelectedImage(base64);
            setDetectResult(null);

            setDetecting(true);
            try {
                const res = await fetch('/api/ai/style-detect', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-session-id': sessionId,
                    },
                    body: JSON.stringify({ imageData: base64, sessionId }),
                });
                const result = await res.json();
                if (result.success) {
                    setDetectResult(result.data);
                    logEvent('ai_style_detect_success', null, { style: result.data.detectedStyle });
                } else {
                    console.error('Style detection failed:', result.error);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setDetecting(false);
            }
        };
        reader.readAsDataURL(file);
    };

    // Recommender
    const handleRecommend = async () => {
        setRecommending(true);
        setRecommendResult(null);
        try {
            const res = await fetch('/api/ai/recommend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-session-id': sessionId,
                },
                body: JSON.stringify({
                    budget: parseInt(budget, 10),
                    level,
                    goals: [goal],
                }),
            });
            const result = await res.json();
            if (result.success) {
                setRecommendResult(result.data);
                logEvent('ai_recommend_success', null, { budget, level, goal });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setRecommending(false);
        }
    };

    // Compatibility
    const handleCheckCompatibility = async () => {
        setCheckingCompat(true);
        setCompatResult(null);
        try {
            const res = await fetch('/api/ai/compatibility', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-session-id': sessionId,
                },
                body: JSON.stringify({ pencilId, paperId }),
            });
            const result = await res.json();
            if (result.success) {
                setCompatResult(result.data);
                logEvent('ai_compat_check_success', pencilId, { paperId });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setCheckingCompat(false);
        }
    };

    return (
        <div className="flex h-full flex-col overflow-hidden bg-[#fdfbf7]">
            {/* Header */}
            <div className="border-b-2 border-black/8 bg-white px-6 py-4 flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-xl font-black flex items-center gap-2">
                        <Brain className="text-purple-600 animate-pulse" size={20} /> AI Art Studio
                    </h2>
                    <p className="text-sm text-gray-500">Gemini-powered style matching, twin scanner, and live metrics</p>
                </div>
            </div>

            {/* Sub-tabs selection */}
            <div className="flex border-b border-black/8 bg-white px-6 py-2 gap-2 overflow-x-auto select-none shrink-0 scrollbar-none">
                {[
                    { id: 'style', label: 'AI Style Detector' },
                    { id: 'scan', label: 'Scan & Match (Camera)' },
                    { id: 'recommend', label: 'AI Supply Builder' },
                    { id: 'compat', label: 'Pencil-Paper Matcher' },
                    { id: 'analytics', label: '📊 Live Funnel Analytics' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            stopCamera();
                            setActiveSubTab(tab.id as any);
                        }}
                        className={`rounded px-3 py-1.5 text-xs font-bold transition-all shrink-0 ${
                            activeSubTab === tab.id
                                ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                : 'text-gray-500 hover:text-black hover:bg-gray-100'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Sub-tab content */}
            <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                    
                    {/* STYLE DETECTOR */}
                    {activeSubTab === 'style' && (
                        <motion.div
                            key="style"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="max-w-3xl mx-auto flex flex-col gap-6"
                        >
                            <RoughCard className="p-6 bg-white" roughness={0.8}>
                                <h3 className="text-lg font-black mb-1">Analyze Your Sketch</h3>
                                <p className="text-xs text-gray-500 mb-4">
                                    Upload any pencil/ink drawing image. Gemini Vision will identify your drawing style, review your technical technique (contrast, shading, lines), and recommend matching professional supplies.
                                </p>

                                <div className="flex flex-col md:flex-row gap-6 items-stretch">
                                    {/* Upload box */}
                                    <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-black rounded-lg cursor-pointer p-6 bg-gray-50/50 hover:bg-gray-50 transition-colors relative overflow-hidden min-h-[220px]">
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                        {selectedImage ? (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                                                <img src={selectedImage} alt="Uploaded sketch" className="h-full w-full object-contain" />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-center">
                                                <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                                    <Upload size={18} />
                                                </div>
                                                <span className="text-xs font-bold text-gray-700">Click to Select Sketch</span>
                                                <span className="text-[10px] text-gray-400">PNG, JPG or JPEG up to 10MB</span>
                                            </div>
                                        )}
                                    </label>

                                    {/* Control/Feedback Pane */}
                                    <div className="flex-1 flex flex-col justify-center">
                                        {detecting ? (
                                            <div className="flex flex-col items-center justify-center gap-3 py-8">
                                                <Loader2 size={32} className="text-purple-600 animate-spin" />
                                                <p className="text-xs font-bold text-gray-600 animate-pulse flex items-center gap-1.5">
                                                    <Sparkles size={13} className="text-purple-500" /> Gemini Vision is analyzing your sketch...
                                                </p>
                                            </div>
                                        ) : detectResult ? (
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="rounded-full bg-green-100 p-1 text-green-700">
                                                        <Check size={16} />
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Style Detected</span>
                                                        <h4 className="text-lg font-black text-purple-900 capitalize">{detectResult.detectedStyle}</h4>
                                                    </div>
                                                    <span className="ml-auto rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">
                                                        {Math.round(detectResult.confidence * 100)}% Match
                                                    </span>
                                                </div>

                                                <div className="text-xs text-gray-700 leading-relaxed border-t border-b border-black/5 py-3">
                                                    <p className="font-bold text-gray-900 mb-1">Gemini Feedback:</p>
                                                    <p className="italic">"{detectResult.styleDescription}"</p>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2">
                                                    {detectResult.primaryTechniques?.slice(0, 3).map((tech, idx) => (
                                                        <div key={idx} className="rounded bg-purple-50/50 p-2 text-center">
                                                            <p className="text-[9px] uppercase font-bold text-purple-800/60">Technique</p>
                                                            <p className="text-xs font-bold text-gray-800 capitalize mt-0.5">{tech}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded border border-black/5">
                                                <AlertCircle size={20} className="text-gray-400 mb-1" />
                                                <p className="text-xs font-semibold text-gray-600">Select and upload a sketch above to trigger the analysis</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </RoughCard>

                            {detectResult && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                    <RoughCard className="p-6 bg-purple-900 text-white" roughness={0.8} stroke="#ffffff" fill="#2e1065">
                                        <h4 className="text-base font-black flex items-center gap-2 mb-3">
                                            <Sparkles size={16} /> Recommended Supplies for {detectResult.detectedStyle} Art
                                        </h4>
                                        <p className="text-xs text-purple-200 mb-4 leading-relaxed">
                                            {detectResult.reasoning || "Based on Gemini's feedback, these professional supplies are best suited to perfect your technique:"}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {detectResult.recommendedPencilsData?.map((supply: any) => (
                                                <div
                                                    key={supply.id}
                                                    className="flex items-center gap-2 bg-white/10 border border-white/20 rounded px-3 py-2 text-xs font-semibold hover:bg-white/20 transition-colors"
                                                >
                                                    <span>✏️ {supply.brand} {supply.label}</span>
                                                    <button
                                                        onClick={() => onTryInLab(supply.id)}
                                                        className="ml-2 bg-[#ffeb3b] text-black text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border border-black"
                                                    >
                                                        Try in Lab
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </RoughCard>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* SCAN & MATCH (CAMERA DETECTOR) */}
                    {activeSubTab === 'scan' && (
                        <motion.div
                            key="scan"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="max-w-xl mx-auto flex flex-col gap-6"
                        >
                            <RoughCard className="p-6 bg-white" roughness={0.7}>
                                <h3 className="text-lg font-black mb-1">Pencil Scanner & Digital Twin</h3>
                                <p className="text-xs text-gray-500 mb-4">
                                    Point your camera at any real drawing pencil/pen or upload its photo. Gemini AI will match its core specs to generate its digital twin on our site!
                                </p>

                                {/* Webcam Box or Captured Image */}
                                <div className="border-2 border-black rounded-lg bg-black aspect-video relative overflow-hidden flex flex-col items-center justify-center shadow-[4px_4px_0_rgba(0,0,0,0.8)]">
                                    {streamActive ? (
                                        <>
                                            <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
                                            {/* Laser scanning sweep animation */}
                                            <div className="absolute left-0 w-full h-1 bg-green-400 shadow-[0_0_10px_#4ade80] animate-[bounce_3s_infinite]" />
                                            
                                            {/* Snap overlay capture */}
                                            <button 
                                                onClick={capturePhoto}
                                                className="absolute bottom-4 h-12 w-12 rounded-full border-4 border-white bg-red-500 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
                                                title="Capture Photo"
                                            >
                                                <div className="h-4 w-4 bg-white rounded-full" />
                                            </button>
                                        </>
                                    ) : capturedImage ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                                            <img src={capturedImage} alt="Captured snapshot" className="h-full w-full object-contain" />
                                            
                                            {scanning && (
                                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2 text-white">
                                                    <Loader2 size={36} className="animate-spin text-purple-400" />
                                                    <p className="text-xs font-black animate-pulse uppercase tracking-widest">Gemini matching twin...</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-4 text-center p-6 text-gray-400">
                                            <Camera size={44} className="opacity-40" />
                                            <div>
                                                <p className="text-sm font-bold text-white">No active camera stream</p>
                                                <p className="text-xs mt-1 text-gray-500">Launch webcam feed or drop a photo file</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2.5 justify-center mt-2">
                                                <button 
                                                    onClick={startCamera}
                                                    className="flex items-center gap-1 bg-[#ffeb3b] text-black border-2 border-black font-bold text-xs px-4 py-2 rounded shadow-[2px_2px_0_rgba(0,0,0,1)] hover:shadow-none translate-x-[-1px] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                                                >
                                                    <Video size={13} /> Activate Camera
                                                </button>
                                                <label className="flex items-center gap-1 bg-white text-black border-2 border-black font-bold text-xs px-4 py-2 rounded shadow-[2px_2px_0_rgba(0,0,0,1)] hover:shadow-none translate-x-[-1px] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer">
                                                    <Upload size={13} /> Upload File
                                                    <input type="file" accept="image/*" className="hidden" onChange={handleCameraUpload} />
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    {/* Close camera button */}
                                    {streamActive && (
                                        <button 
                                            onClick={stopCamera}
                                            className="absolute top-3 right-3 bg-black/60 hover:bg-black text-white p-1.5 rounded-full border border-white/20 transition-all"
                                        >
                                            <RotateCcw size={14} />
                                        </button>
                                    )}
                                </div>
                            </RoughCard>

                            {/* Scan result display */}
                            {scanResult && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    <RoughCard className="p-6 bg-white border-2 border-purple-600 shadow-[6px_6px_0_rgba(124,58,237,1)]" roughness={0.7}>
                                        <div className="flex items-center gap-3.5 pb-4 border-b border-black/5">
                                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                                                <CheckCircle2Icon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <span className="text-[9px] uppercase font-bold text-purple-600 tracking-wider">Pencil Match Success!</span>
                                                <h4 className="text-lg font-black">{scanResult.detectedBrand} {scanResult.detectedModel}</h4>
                                            </div>
                                            <span className="ml-auto rounded bg-purple-50 border border-purple-200 text-purple-700 font-bold px-2 py-0.5 text-xs">
                                                {Math.round(scanResult.confidenceScore * 100)}% Match
                                            </span>
                                        </div>

                                        <div className="py-4">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Matched Twin Specs</p>
                                            <p className="text-sm text-gray-700 mt-1">{scanResult.explanation}</p>
                                            
                                            <div className="mt-3 flex items-center gap-3 rounded-lg border-2 border-black/15 bg-gray-50/50 p-3">
                                                <span className="text-2xl">✏️</span>
                                                <div>
                                                    <p className="text-xs font-black uppercase text-purple-600 tracking-wide">{scanResult.twinData?.brand} Core</p>
                                                    <p className="text-sm font-black">{scanResult.twinData?.label} Digital Twin</p>
                                                    <p className="text-[10px] text-gray-500 mt-0.5">{scanResult.twinData?.desc}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <RoughButton 
                                                onClick={() => {
                                                    onTryInLab(scanResult.matchedTwinId);
                                                    logEvent('equip_scanned_twin', scanResult.matchedTwinId);
                                                }}
                                                className="flex-1 py-3 text-xs"
                                                bg="#ffeb3b"
                                            >
                                                🎨 Equip Digital Twin in Canvas
                                            </RoughButton>
                                            <button 
                                                onClick={startCamera}
                                                className="border-2 border-black bg-white font-bold text-xs px-4 rounded hover:bg-gray-50 active:translate-y-[1px]"
                                            >
                                                Scan New
                                            </button>
                                        </div>
                                    </RoughCard>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* SUPPLY RECOMMENDER */}
                    {activeSubTab === 'recommend' && (
                        <motion.div
                            key="recommend"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="max-w-3xl mx-auto flex flex-col gap-6"
                        >
                            <RoughCard className="p-6 bg-white" roughness={0.8}>
                                <h3 className="text-lg font-black mb-1">Build Your Custom Art Set</h3>
                                <p className="text-xs text-gray-500 mb-6">
                                    Tell us your budget, skill level, and art goal. Gemini will create a bespoke shopping list curated specifically for you.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    {/* Level */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-gray-600">Your Skill Level</label>
                                        <select
                                            value={level}
                                            onChange={e => setLevel(e.target.value)}
                                            className="h-10 rounded border-2 border-black/15 bg-white px-3 text-xs font-semibold outline-none focus:border-black"
                                        >
                                            <option value="beginner">Beginner (Curious Explorer)</option>
                                            <option value="intermediate">Intermediate (Improving Skills)</option>
                                            <option value="professional">Professional (Master Crafter)</option>
                                        </select>
                                    </div>

                                    {/* Budget */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-gray-600">Budget Limit</label>
                                        <select
                                            value={budget}
                                            onChange={e => setBudget(e.target.value)}
                                            className="h-10 rounded border-2 border-black/15 bg-white px-3 text-xs font-semibold outline-none focus:border-black"
                                        >
                                            <option value="300">₹300 (Pocket Friendly)</option>
                                            <option value="600">₹600 (Recommended Starter)</option>
                                            <option value="1200">₹1,200 (Advanced Artist)</option>
                                            <option value="2500">₹2,500 (Ultimate Creator Pack)</option>
                                        </select>
                                    </div>

                                    {/* Goal */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-gray-600">Primary Goal</label>
                                        <select
                                            value={goal}
                                            onChange={e => setGoal(e.target.value)}
                                            className="h-10 rounded border-2 border-black/15 bg-white px-3 text-xs font-semibold outline-none focus:border-black"
                                        >
                                            <option value="portraits">Detailed Portrait Shading</option>
                                            <option value="landscapes">Scenery & Light Sketches</option>
                                            <option value="manga">Comic & Manga Linework</option>
                                            <option value="calligraphy">Elegant Hand Lettering</option>
                                            <option value="all-round">All-Rounder General Sketching</option>
                                        </select>
                                    </div>
                                </div>

                                <RoughButton
                                    onClick={handleRecommend}
                                    className="w-full py-3 text-sm"
                                    bg="#ffeb3b"
                                    disabled={recommending}
                                >
                                    {recommending ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 size={16} className="animate-spin" /> Cooking recommendations...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-1.5">
                                            <Brain size={15} /> Build Custom Set
                                        </span>
                                    )}
                                </RoughButton>
                            </RoughCard>

                            {recommendResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col gap-4"
                                >
                                    <RoughCard className="p-6 bg-white" roughness={0.8}>
                                        <div className="mb-4">
                                            <h4 className="text-base font-black text-gray-900 flex items-center gap-2">
                                                📊 Custom Art Set Analysis
                                            </h4>
                                            <p className="mt-2 text-xs text-gray-700 leading-relaxed border-l-4 border-purple-500 pl-3 italic">
                                                "{recommendResult.budgetTip}"
                                            </p>
                                        </div>

                                        <h4 className="text-xs uppercase font-bold tracking-widest text-gray-400 mb-3">Your Curation Shopping List</h4>
                                        <div className="flex flex-col gap-3">
                                            {recommendResult.priorityList?.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-2 border-black/10 hover:border-black rounded-lg p-4 bg-gray-50/50 hover:bg-white transition-all shadow-sm hover:shadow-[3px_3px_0_rgba(0,0,0,0.8)]"
                                                >
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-gray-800">{item.name}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1 max-w-lg">{item.reason}</p>
                                                    </div>
                                                    <div className="flex items-center justify-between sm:justify-end gap-3 mt-3 sm:mt-0 border-t sm:border-t-0 border-black/5 pt-2.5 sm:pt-0 shrink-0">
                                                        <span className="text-base font-black text-purple-900">₹{item.price}</span>
                                                        <button className="flex items-center gap-1 bg-[#ffeb3b] hover:bg-black hover:text-white rounded border border-black px-2.5 py-1 text-xs font-bold transition-all">
                                                            <ShoppingBag size={11} /> Buy
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </RoughCard>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* COMPATIBILITY MATCHERS */}
                    {activeSubTab === 'compat' && (
                        <motion.div
                            key="compat"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="max-w-2xl mx-auto flex flex-col gap-6"
                        >
                            <RoughCard className="p-6 bg-white" roughness={0.8}>
                                <h3 className="text-lg font-black mb-1">Check Pencil-Paper Compatibility</h3>
                                <p className="text-xs text-gray-500 mb-6">
                                    Pick any drawing supply pencil and any canvas paper type to analyze compatibility. Gemini will score their synergy out of 100% and provide warnings or custom tips!
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-gray-600">Select Pencil</label>
                                        <select
                                            value={pencilId}
                                            onChange={e => setPencilId(e.target.value)}
                                            className="h-10 rounded border-2 border-black/15 bg-white px-3 text-xs font-semibold outline-none focus:border-black"
                                        >
                                            {PENCILS.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.label} ({p.brand} {p.category})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-gray-600">Select Paper</label>
                                        <select
                                            value={paperId}
                                            onChange={e => setPaperId(e.target.value)}
                                            className="h-10 rounded border-2 border-black/15 bg-white px-3 text-xs font-semibold outline-none focus:border-black"
                                        >
                                            {PAPERS.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.label} ({p.brand})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <RoughButton
                                    onClick={handleCheckCompatibility}
                                    className="w-full py-3 text-sm"
                                    bg="#ffeb3b"
                                    disabled={checkingCompat}
                                >
                                    {checkingCompat ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 size={16} className="animate-spin" /> Verifying matches...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-1.5">
                                            <Sparkles size={14} /> Check Synergistic Score
                                        </span>
                                    )}
                                </RoughButton>
                            </RoughCard>

                            {compatResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <RoughCard className="p-6 bg-white" roughness={0.8}>
                                        <div className="flex items-center gap-4 mb-4">
                                            {/* Score circle */}
                                            <div className="h-16 w-16 rounded-full border-4 border-purple-500 flex items-center justify-center font-black text-lg bg-purple-50 shrink-0 shadow-inner">
                                                {compatResult.compatibilityScore || compatResult.score || 80}%
                                            </div>

                                            <div>
                                                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Match Status</span>
                                                <h4 className="text-base font-black text-purple-900 mt-0.5">{compatResult.rating || compatResult.status}</h4>
                                                <p className="text-xs text-gray-500 mt-0.5">{compatResult.headline || "Synergy rating for this combination"}</p>
                                            </div>
                                        </div>

                                        <div className="text-xs text-gray-700 leading-relaxed bg-gray-50 border border-black/5 rounded p-3 mb-4">
                                            <p className="font-bold text-gray-900 mb-1">SYNERGY REVIEW:</p>
                                            <p>{compatResult.whatHappens || compatResult.explanation}</p>
                                        </div>
                                    </RoughCard>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* LIVE FUNNEL ANALYTICS DASHBOARD */}
                    {activeSubTab === 'analytics' && (
                        <motion.div
                            key="analytics"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="max-w-4xl mx-auto flex flex-col gap-6"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black flex items-center gap-2">
                                        <TrendingUp className="text-teal-600 animate-bounce" size={20} /> Live Funnel Metrics
                                    </h3>
                                    <p className="text-xs text-gray-500">Real-time developer console logging & SQLite persistent telemetry</p>
                                </div>
                                <button 
                                    onClick={fetchFunnelData}
                                    disabled={loadingFunnel}
                                    className="flex items-center gap-1.5 text-xs font-bold border-2 border-black bg-white rounded px-3 py-1.5 shadow-[2px_2px_0_rgba(0,0,0,1)] hover:shadow-none translate-x-[-1px] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                                >
                                    <RefreshCw size={12} className={loadingFunnel ? 'animate-spin' : ''} /> Refresh Feed
                                </button>
                            </div>

                            {loadingFunnel && !funnelData ? (
                                <div className="flex flex-col items-center justify-center gap-2 py-16">
                                    <Loader2 size={36} className="animate-spin text-teal-600" />
                                    <p className="text-xs font-bold text-gray-500">Loading conversion charts...</p>
                                </div>
                            ) : funnelData ? (
                                <>
                                    {/* Metrics Blocks */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <RoughCard className="p-4 bg-white" roughness={0.5}>
                                            <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Unique Session IDs</span>
                                            <p className="text-2xl font-black mt-1 text-purple-900 flex items-center gap-1">
                                                <Activity size={18} className="text-purple-500" /> {funnelData.metrics?.totalSessions}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">Active visitor funnels</p>
                                        </RoughCard>

                                        <RoughCard className="p-4 bg-white" roughness={0.5}>
                                            <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Canvas Supply Tries</span>
                                            <p className="text-2xl font-black mt-1 text-teal-900 flex items-center gap-1">
                                                <Sparkles size={18} className="text-teal-500" /> {funnelData.metrics?.tryLabCount}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">Friction trials in lab</p>
                                        </RoughCard>

                                        <RoughCard className="p-4 bg-white" roughness={0.5}>
                                            <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Mock Payments</span>
                                            <p className="text-2xl font-black mt-1 text-amber-900 flex items-center gap-1">
                                                <ShoppingBag size={18} className="text-amber-500" /> {funnelData.metrics?.checkoutSuccessCount}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">Orders in relational DB</p>
                                        </RoughCard>

                                        <RoughCard className="p-4 bg-white border-2 border-emerald-500 bg-emerald-50/5" roughness={0.5}>
                                            <span className="text-[9px] uppercase font-bold text-emerald-700/60 tracking-wider">Total Sales (MOCK)</span>
                                            <p className="text-2xl font-black mt-1 text-emerald-950 flex items-center gap-1">
                                                <DollarSign size={18} className="text-emerald-500" /> ₹{funnelData.metrics?.totalRevenue}
                                            </p>
                                            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">{funnelData.metrics?.conversionRate}% overall conversion</p>
                                        </RoughCard>
                                    </div>

                                    {/* Conversion Funnel Bar graphs */}
                                    <RoughCard className="p-6 bg-white" roughness={0.7}>
                                        <h4 className="text-sm font-black uppercase tracking-wider text-gray-500 mb-4">AARRR Pirate Acquisition Funnel</h4>
                                        <div className="flex flex-col gap-4">
                                            {/* Step 1: Sessions */}
                                            <div>
                                                <div className="flex justify-between text-xs font-bold mb-1">
                                                    <span>1. Acquisition (Total Unique Sessions)</span>
                                                    <span>{funnelData.metrics?.totalSessions} users (100%)</span>
                                                </div>
                                                <div className="h-4 bg-gray-100 rounded-full overflow-hidden border border-black/10">
                                                    <div className="h-full bg-purple-500 rounded-full" style={{ width: '100%' }} />
                                                </div>
                                            </div>

                                            {/* Step 2: Tries */}
                                            {(() => {
                                                const triesPct = funnelData.metrics?.totalSessions > 0 ? (funnelData.metrics?.tryLabCount / funnelData.metrics?.totalSessions) * 100 : 0;
                                                return (
                                                    <div>
                                                        <div className="flex justify-between text-xs font-bold mb-1">
                                                            <span>2. Activation (Tried Pencil in Lab)</span>
                                                            <span>{funnelData.metrics?.tryLabCount} trials ({Math.min(Math.round(triesPct), 100)}%)</span>
                                                        </div>
                                                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden border border-black/10">
                                                            <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.min(triesPct, 100)}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {/* Step 3: AI Assists */}
                                            {(() => {
                                                const aiPct = funnelData.metrics?.totalSessions > 0 ? (funnelData.metrics?.aiAssistCount / funnelData.metrics?.totalSessions) * 100 : 0;
                                                return (
                                                    <div>
                                                        <div className="flex justify-between text-xs font-bold mb-1">
                                                            <span>3. Engagement (Triggered AI Assists / Scanner)</span>
                                                            <span>{funnelData.metrics?.aiAssistCount} triggers ({Math.min(Math.round(aiPct), 100)}%)</span>
                                                        </div>
                                                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden border border-black/10">
                                                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(aiPct, 100)}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {/* Step 4: Checkout Clicks */}
                                            {(() => {
                                                const checkoutPct = funnelData.metrics?.totalSessions > 0 ? (funnelData.metrics?.checkoutClickCount / funnelData.metrics?.totalSessions) * 100 : 0;
                                                return (
                                                    <div>
                                                        <div className="flex justify-between text-xs font-bold mb-1">
                                                            <span>4. Checkout Intent (Clicked BUY Option)</span>
                                                            <span>{funnelData.metrics?.checkoutClickCount} checkout launches ({Math.min(Math.round(checkoutPct), 100)}%)</span>
                                                        </div>
                                                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden border border-black/10">
                                                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(checkoutPct, 100)}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {/* Step 5: Success Checkouts */}
                                            {(() => {
                                                const successPct = funnelData.metrics?.totalSessions > 0 ? (funnelData.metrics?.checkoutSuccessCount / funnelData.metrics?.totalSessions) * 100 : 0;
                                                return (
                                                    <div>
                                                        <div className="flex justify-between text-xs font-bold mb-1">
                                                            <span>5. Revenue (Completed Mock Razorpay Checkout)</span>
                                                            <span>{funnelData.metrics?.checkoutSuccessCount} successes ({Math.min(Math.round(successPct), 100)}%)</span>
                                                        </div>
                                                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden border border-black/10">
                                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(successPct, 100)}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </RoughCard>

                                    {/* SQLite Real-time Event Logger terminal logs */}
                                    <RoughCard className="p-6 bg-[#18181b] text-white border-2 border-black" roughness={0.7} fill="#18181b">
                                        <h4 className="text-xs uppercase font-black tracking-widest text-teal-400 mb-3.5 flex items-center gap-1.5">
                                            <span className="h-2 w-2 rounded-full bg-teal-400 animate-ping" /> SQLite Database Event Log Stream
                                        </h4>
                                        <div className="flex flex-col gap-2 font-mono text-[11px] leading-relaxed max-h-[250px] overflow-y-auto pr-2">
                                            {funnelData.logs?.length === 0 ? (
                                                <p className="text-gray-500 italic">No events logged yet. Try drawing on the canvas or checking out supplies to populate database records.</p>
                                            ) : (
                                                funnelData.logs.map((log: any) => {
                                                    let logColor = 'text-purple-400';
                                                    if (log.eventType.includes('SUCCESS')) logColor = 'text-emerald-400';
                                                    else if (log.eventType.includes('TRY')) logColor = 'text-teal-400';
                                                    else if (log.eventType.includes('CLICK')) logColor = 'text-amber-400';

                                                    return (
                                                        <div key={log.id} className="border-b border-white/5 pb-1.5 flex justify-between gap-6 hover:bg-white/5 rounded px-1 transition-all">
                                                            <div className="truncate flex-1">
                                                                <span className="text-gray-500">[{log.dateString} {log.timeString}]</span>{' '}
                                                                <span className={`${logColor} font-bold`}>{log.eventType}</span>{' '}
                                                                {log.itemId && <span className="text-blue-400">({log.itemId})</span>}{' '}
                                                                <span className="text-gray-400">
                                                                    {log.metadata ? JSON.stringify(log.metadata) : ''}
                                                                </span>
                                                            </div>
                                                            <div className="text-gray-600 shrink-0 text-[10px]">
                                                                sess: {log.sessionId?.substring(0, 8)}...
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </RoughCard>
                                </>
                            ) : (
                                <p className="text-xs text-gray-500">Unable to load telemetry metrics.</p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Simple placeholder icon to prevent import compilation errors if CheckCircle2 is missing
function CheckCircle2Icon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}
