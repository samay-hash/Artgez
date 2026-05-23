'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Smartphone, ShieldCheck, CheckCircle2, ChevronRight, Loader2, Sparkles, Receipt } from 'lucide-react';
import RoughCard from './RoughCard';
import RoughButton from './RoughButton';
import { logEvent } from '@/src/lib/analytics';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    itemName: string;
    itemPrice: string;
    itemId: string;
    sessionId: string;
};

type Step = 'contact' | 'shipping' | 'payment' | 'processing' | 'success';

export default function RazorpayModal({ isOpen, onClose, itemName, itemPrice, itemId, sessionId }: Props) {
    const [step, setStep] = useState<Step>('contact');
    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        name: '',
        address: '',
        city: '',
        pinCode: '',
        paymentMethod: 'upi',
    });
    const [txId, setTxId] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    React.useEffect(() => {
        if (isOpen) {
            logEvent('CHECKOUT_OPEN', itemId, { itemName, price: itemPrice });
        }
    }, [isOpen, itemId, itemName, itemPrice]);

    if (!isOpen) return null;

    const numericPrice = parseInt(itemPrice.replace(/[^0-9]/g, '')) || 0;

    const validateContact = () => {
        const errs: Record<string, string> = {};
        if (!formData.email.includes('@')) errs.email = 'Enter a valid email address';
        if (formData.phone.length < 10 || !/^\d+$/.test(formData.phone)) errs.phone = 'Enter a valid 10-digit phone';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const validateShipping = () => {
        const errs: Record<string, string> = {};
        if (!formData.name.trim()) errs.name = 'Full name is required';
        if (!formData.address.trim()) errs.address = 'Address is required';
        if (!formData.city.trim()) errs.city = 'City is required';
        if (formData.pinCode.length !== 6 || !/^\d+$/.test(formData.pinCode)) errs.pinCode = 'Enter a 6-digit Indian PIN';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleNextToShipping = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateContact()) setStep('shipping');
    };

    const handleNextToPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateShipping()) setStep('payment');
    };

    const handlePay = async () => {
        setStep('processing');
        logEvent('CHECKOUT_CLICK', itemId, { itemName, price: itemPrice });
        
        // Track the mock payment via API
        try {
            const res = await fetch('/api/shop/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-session-id': sessionId,
                },
                body: JSON.stringify({
                    itemId,
                    itemName,
                    amount: itemPrice,
                    customerName: formData.name,
                    customerEmail: formData.email,
                    customerPhone: formData.phone,
                    paymentMethod: formData.paymentMethod,
                    address: formData.address,
                    city: formData.city,
                    pinCode: formData.pinCode,
                }),
            });
            const result = await res.json();
            
            // Wait 2 seconds to simulate network gateway latency
            await new Promise(resolve => setTimeout(resolve, 2200));
 
            if (result.success) {
                setTxId(result.transactionId);
                setStep('success');
                logEvent('CHECKOUT_SUCCESS', itemId, { itemName, price: itemPrice });
            } else {
                alert('Payment processing failed. Try again!');
                setStep('payment');
            }
        } catch (err) {
            console.error('Checkout failed:', err);
            // Fallback mock success
            await new Promise(resolve => setTimeout(resolve, 2000));
            setTxId(`pay_MOCK_${Math.random().toString(36).substring(2, 12).toUpperCase()}`);
            setStep('success');
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                {/* Modal Window */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                    className="w-full max-w-md"
                >
                    <RoughCard className="bg-white overflow-hidden shadow-2xl p-0" roughness={0.8}>
                        {/* Header banner */}
                        <div className="bg-[#0f2c59] text-white p-4 relative flex items-center justify-between border-b-2 border-black">
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black italic tracking-tighter text-[#52b1ff] select-none">
                                    Razorpay
                                </span>
                                <span className="h-4 w-[1px] bg-white/20" />
                                <span className="text-xs font-bold text-gray-300">Artgez Secure Shop</span>
                            </div>
                            
                            {step !== 'processing' && step !== 'success' && (
                                <button 
                                    onClick={onClose} 
                                    className="rounded-full bg-white/10 p-1 hover:bg-white/20 transition-colors text-white"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Order Summary Ribbon */}
                        <div className="bg-gray-50 border-b border-black/10 px-5 py-2.5 flex items-center justify-between text-xs font-semibold text-gray-500">
                            <span>Item: <strong className="text-black font-bold">{itemName}</strong></span>
                            <span className="text-sm font-black text-black">{itemPrice}</span>
                        </div>

                        {/* Body content based on step */}
                        <div className="p-5 min-h-[300px] flex flex-col justify-between">
                            
                            {/* STEP 1: CONTACT */}
                            {step === 'contact' && (
                                <form onSubmit={handleNextToShipping} className="flex flex-col gap-4 flex-1 justify-between">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 uppercase tracking-wider">
                                            <Smartphone size={13} /> Step 1: Contact Details
                                        </div>
                                        <h3 className="text-base font-black">Where should we send order updates?</h3>
                                        
                                        <div className="flex flex-col gap-1 mt-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Email Address</label>
                                            <input 
                                                type="email" 
                                                required
                                                placeholder="artist@artgez.com"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                className={`h-10 rounded border-2 px-3 text-sm outline-none transition-all ${
                                                    errors.email ? 'border-red-500 bg-red-50' : 'border-black/15 focus:border-black'
                                                }`}
                                            />
                                            {errors.email && <span className="text-[10px] font-bold text-red-500">{errors.email}</span>}
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Phone Number</label>
                                            <div className="flex gap-2">
                                                <span className="h-10 flex items-center justify-center rounded border-2 border-black/15 bg-gray-100 px-2 text-sm font-semibold select-none">
                                                    +91
                                                </span>
                                                <input 
                                                    type="tel" 
                                                    maxLength={10}
                                                    required
                                                    placeholder="9876543210"
                                                    value={formData.phone}
                                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                    className={`h-10 flex-1 rounded border-2 px-3 text-sm outline-none transition-all ${
                                                        errors.phone ? 'border-red-500 bg-red-50' : 'border-black/15 focus:border-black'
                                                    }`}
                                                />
                                            </div>
                                            {errors.phone && <span className="text-[10px] font-bold text-red-500">{errors.phone}</span>}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-black/5 mt-4">
                                        <RoughButton 
                                            type="submit" 
                                            className="w-full py-3 flex items-center justify-center gap-1 text-xs uppercase"
                                            bg="#ffeb3b"
                                        >
                                            Continue to Shipping <ChevronRight size={13} />
                                        </RoughButton>
                                    </div>
                                </form>
                            )}

                            {/* STEP 2: SHIPPING */}
                            {step === 'shipping' && (
                                <form onSubmit={handleNextToPayment} className="flex flex-col gap-3 flex-1 justify-between">
                                    <div className="flex flex-col gap-2.5">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 uppercase tracking-wider">
                                            <Smartphone size={13} /> Step 2: Shipping Address
                                        </div>
                                        <h3 className="text-base font-black">Where should we deliver your art supplies?</h3>
                                        
                                        <div className="flex flex-col gap-1 mt-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Receiver's Full Name</label>
                                            <input 
                                                type="text" 
                                                required
                                                placeholder="Samay Samrat"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                className="h-9 rounded border-2 border-black/15 px-3 text-sm outline-none transition-all focus:border-black"
                                            />
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Delivery Address</label>
                                            <input 
                                                type="text" 
                                                required
                                                placeholder="Flat/House No, Building, Street Name"
                                                value={formData.address}
                                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                                className="h-9 rounded border-2 border-black/15 px-3 text-sm outline-none transition-all focus:border-black"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase">City</label>
                                                <input 
                                                    type="text" 
                                                    required
                                                    placeholder="Mumbai"
                                                    value={formData.city}
                                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                                    className="h-9 rounded border-2 border-black/15 px-3 text-sm outline-none transition-all focus:border-black"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase">PIN Code</label>
                                                <input 
                                                    type="text" 
                                                    maxLength={6}
                                                    required
                                                    placeholder="400001"
                                                    value={formData.pinCode}
                                                    onChange={e => setFormData({ ...formData, pinCode: e.target.value })}
                                                    className={`h-9 rounded border-2 px-3 text-sm outline-none transition-all ${
                                                        errors.pinCode ? 'border-red-500 bg-red-50' : 'border-black/15 focus:border-black'
                                                    }`}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-4 border-t border-black/5 mt-4">
                                        <button 
                                            type="button" 
                                            onClick={() => setStep('contact')}
                                            className="px-4 py-2.5 rounded border-2 border-black text-xs font-bold uppercase transition-all hover:bg-gray-100"
                                        >
                                            Back
                                        </button>
                                        <RoughButton 
                                            type="submit" 
                                            className="flex-1 py-2.5 flex items-center justify-center gap-1 text-xs uppercase"
                                            bg="#ffeb3b"
                                        >
                                            Continue to Payment <ChevronRight size={13} />
                                        </RoughButton>
                                    </div>
                                </form>
                            )}

                            {/* STEP 3: PAYMENT */}
                            {step === 'payment' && (
                                <div className="flex flex-col gap-4 flex-1 justify-between">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 uppercase tracking-wider">
                                            <CreditCard size={13} /> Step 3: Payment Method
                                        </div>
                                        <h3 className="text-base font-black">Choose secure payment option</h3>
                                        
                                        <div className="flex flex-col gap-2 mt-1">
                                            {/* UPI */}
                                            <label 
                                                className={`flex items-center justify-between border-2 p-3 rounded cursor-pointer transition-all ${
                                                    formData.paymentMethod === 'upi' ? 'border-black bg-purple-50/50 shadow-[2px_2px_0_rgba(0,0,0,1)]' : 'border-black/10 hover:border-black/30'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input 
                                                        type="radio" 
                                                        name="payment" 
                                                        value="upi"
                                                        checked={formData.paymentMethod === 'upi'}
                                                        onChange={() => setFormData({ ...formData, paymentMethod: 'upi' })}
                                                        className="accent-purple-600"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800">UPI Payments</p>
                                                        <p className="text-[10px] text-gray-500 font-semibold">Google Pay, PhonePe, Paytm, BHIM</p>
                                                    </div>
                                                </div>
                                                <Smartphone className="text-gray-400" size={18} />
                                            </label>

                                            {/* Card */}
                                            <label 
                                                className={`flex items-center justify-between border-2 p-3 rounded cursor-pointer transition-all ${
                                                    formData.paymentMethod === 'card' ? 'border-black bg-purple-50/50 shadow-[2px_2px_0_rgba(0,0,0,1)]' : 'border-black/10 hover:border-black/30'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input 
                                                        type="radio" 
                                                        name="payment" 
                                                        value="card"
                                                        checked={formData.paymentMethod === 'card'}
                                                        onChange={() => setFormData({ ...formData, paymentMethod: 'card' })}
                                                        className="accent-purple-600"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800">Credit / Debit Card</p>
                                                        <p className="text-[10px] text-gray-500 font-semibold">Visa, Mastercard, RuPay, Maestro</p>
                                                    </div>
                                                </div>
                                                <CreditCard className="text-gray-400" size={18} />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-black/5 mt-4">
                                        <div className="flex gap-2">
                                            <button 
                                                type="button" 
                                                onClick={() => setStep('shipping')}
                                                className="px-4 py-2.5 rounded border-2 border-black text-xs font-bold uppercase transition-all hover:bg-gray-100"
                                            >
                                                Back
                                            </button>
                                            <RoughButton 
                                                onClick={handlePay}
                                                className="flex-1 py-2.5 flex items-center justify-center gap-2 text-xs uppercase"
                                                bg="#ffeb3b"
                                            >
                                                <ShieldCheck size={14} /> Pay {itemPrice} via Razorpay
                                            </RoughButton>
                                        </div>
                                        <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 mt-3 font-semibold select-none">
                                            <ShieldCheck size={12} className="text-emerald-500" /> Fully Secured by PCI-DSS Bank Standards
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: PROCESSING */}
                            {step === 'processing' && (
                                <div className="flex flex-col items-center justify-center gap-5 flex-1 min-h-[300px] text-center select-none">
                                    <Loader2 className="animate-spin text-purple-600" size={48} strokeWidth={2.5} />
                                    <div className="flex flex-col gap-1.5">
                                        <h3 className="text-lg font-black tracking-tight">Verifying Secure Payment</h3>
                                        <p className="text-xs text-gray-500 max-w-xs font-semibold leading-relaxed">
                                            Awaiting authorization from bank UPI gateway. Do not reload or close this modal.
                                        </p>
                                    </div>
                                    <div className="h-2 w-48 rounded-full bg-black/5 overflow-hidden relative">
                                        <motion.div 
                                            className="absolute left-0 top-0 h-full rounded-full bg-purple-600"
                                            animate={{ width: ['0%', '100%'] }}
                                            transition={{ duration: 2, ease: 'easeOut' }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* STEP 5: SUCCESS RECEIPT */}
                            {step === 'success' && (
                                <div className="flex flex-col gap-4 flex-1 text-center justify-between min-h-[300px]">
                                    <div className="flex flex-col items-center gap-3">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: [0, 1.2, 1] }}
                                            transition={{ type: 'spring', duration: 0.6 }}
                                            className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"
                                        >
                                            <CheckCircle2 size={40} />
                                        </motion.div>
                                        
                                        <div className="flex flex-col gap-1">
                                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-1.5 justify-center">
                                                <Sparkles size={16} className="text-amber-400 animate-pulse" /> Order Confirmed!
                                            </h3>
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                                                Receipt & Shipping Details
                                            </p>
                                        </div>

                                        {/* Dynamic receipt */}
                                        <div className="w-full text-left bg-gray-50 rounded-lg border-2 border-black/10 border-dashed p-4 flex flex-col gap-2 mt-2 select-text">
                                            <div className="flex items-center gap-1 text-xs font-bold text-gray-400 uppercase mb-1 border-b border-black/5 pb-1">
                                                <Receipt size={12} /> Transaction DNA Summary
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-400 font-semibold">Payment ID:</span>
                                                <code className="font-mono font-bold text-purple-700 bg-purple-50 px-1 rounded">{txId}</code>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-400 font-semibold">Product:</span>
                                                <span className="font-black text-gray-800">{itemName}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-400 font-semibold">Amount Paid:</span>
                                                <span className="font-black text-emerald-600">{itemPrice}</span>
                                            </div>
                                            <div className="flex justify-between text-xs border-t border-black/5 pt-2 mt-1">
                                                <span className="text-gray-400 font-semibold">Shipped to:</span>
                                                <span className="font-bold text-gray-700">{formData.name}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-400 font-semibold">Dest:</span>
                                                <span className="font-semibold text-gray-600">{formData.city} - {formData.pinCode}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-400 font-semibold">Est Delivery:</span>
                                                <span className="font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                                                    In 2-3 Working Days
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-black/5 mt-4">
                                        <RoughButton 
                                            onClick={() => {
                                                onClose();
                                                setStep('contact');
                                            }}
                                            className="w-full py-3 flex items-center justify-center gap-1.5 text-xs font-black uppercase"
                                            bg="#ffeb3b"
                                        >
                                            Keep Creating 🎨
                                        </RoughButton>
                                    </div>
                                </div>
                            )}

                        </div>
                    </RoughCard>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
