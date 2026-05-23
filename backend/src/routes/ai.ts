import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { getCachedAI, setCachedAI, logEvent } from '../db/database';
import { PENCILS_DATA, PAPERS_DATA } from '../db/seed';

const router = Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
const visionModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// ─── Validation Schemas ───────────────────────────────────────────────────────

const StyleDetectSchema = z.object({
    imageData: z.string().min(100),   // base64 image
    sessionId: z.string().optional(),
});

const RecommendSchema = z.object({
    budget: z.number().min(0).max(100000),
    level: z.enum(['complete-beginner', 'beginner', 'intermediate', 'advanced', 'professional']),
    goals: z.array(z.string()).min(1).max(10),
    currentSupplies: z.array(z.string()).optional().default([]),
});

const CompatibilitySchema = z.object({
    pencilId: z.string(),
    paperId: z.string(),
});

// ─── Helper: Safe Gemini Call ─────────────────────────────────────────────────

async function safeGeminiCall(prompt: string): Promise<string> {
    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (err) {
        console.error('Gemini API error:', err);
        throw new Error('AI service temporarily unavailable');
    }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/ai/style-detect
 * Upload a sketch image → Gemini Vision analyzes art style → returns supply recommendations
 */
router.post('/style-detect', async (req: Request, res: Response) => {
    const parsed = StyleDetectSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ success: false, errors: parsed.error.issues });
        return;
    }

    const { imageData, sessionId } = parsed.data;
    const sid = sessionId || 'anonymous';

    try {
        // Extract base64 data (remove data:image/png;base64, prefix if present)
        const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;

        const prompt = `You are an expert art supply consultant analyzing a pencil sketch.

Analyze this sketch and provide a JSON response with exactly this structure:
{
  "detectedStyle": "one of: realism, impressionism, manga/comic, abstract, technical/architectural, gesture/figure, portrait, landscape, still-life, cartoon",
  "confidence": 0.85,
  "styleDescription": "2-3 sentence description of what you see in the drawing style",
  "primaryTechniques": ["hatching", "cross-hatching", "contour", "gesture", "shading"],
  "recommendedPencils": ["2b", "4b", "hb"],
  "recommendedPapers": ["smooth", "rough"],
  "reasoning": "Why these supplies suit this style in 2-3 sentences",
  "levelEstimate": "beginner/intermediate/advanced",
  "improvementTip": "One specific actionable tip for this artist"
}

Available pencil IDs: 4h, 2h, hb, 2b, 4b, 6b, ch (charcoal), ink, bp (brush pen)
Available paper IDs: smooth, rough, newsprint, watercolor, canvas, kraft

Return ONLY valid JSON, no markdown or extra text.`;

        const result = await visionModel.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: 'image/png',
                },
            },
        ]);

        const rawText = result.response.text().trim();
        // Clean up potential markdown code blocks
        const jsonStr = rawText.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
        const analysis = JSON.parse(jsonStr);

        // Enrich with full pencil/paper data
        const recommendedPencils = (analysis.recommendedPencils || []).map((id: string) =>
            PENCILS_DATA.find(p => p.id === id)
        ).filter(Boolean);

        const recommendedPapers = (analysis.recommendedPapers || []).map((id: string) =>
            PAPERS_DATA.find(p => p.id === id)
        ).filter(Boolean);

        logEvent('ai_style_detect', sid, undefined, { style: analysis.detectedStyle });

        res.json({
            success: true,
            data: {
                ...analysis,
                recommendedPencilsData: recommendedPencils,
                recommendedPapersData: recommendedPapers,
            },
        });
    } catch (err) {
        console.error('/ai/style-detect error:', err);
        res.status(500).json({
            success: false,
            error: 'Style analysis failed. Please try again.',
            fallback: {
                detectedStyle: 'general sketching',
                recommendedPencils: ['2b', 'hb', '4b'],
                recommendedPapers: ['smooth', 'rough'],
            },
        });
    }
});

/**
 * POST /api/ai/recommend
 * Budget + level + goals → personalized prioritized supply list
 */
router.post('/recommend', async (req: Request, res: Response) => {
    const parsed = RecommendSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ success: false, errors: parsed.error.issues });
        return;
    }

    const { budget, level, goals, currentSupplies } = parsed.data;
    const cacheKey = `recommend:${budget}:${level}:${goals.sort().join(',')}`;
    const cached = getCachedAI(cacheKey);

    if (cached) {
        res.json({ success: true, data: JSON.parse(cached), cached: true });
        return;
    }

    const pencilList = PENCILS_DATA.map(p => `- ${p.id} (${p.label} by ${p.brand}, ${p.priceStr})`).join('\n');

    const prompt = `You are Artgez's AI supply advisor helping Indian artists make smart purchasing decisions.

Artist profile:
- Budget: ₹${budget}
- Level: ${level}
- Goals: ${goals.join(', ')}
- Already has: ${currentSupplies.length > 0 ? currentSupplies.join(', ') : 'nothing yet'}

Available pencils:
${pencilList}

Available papers: Smooth Fabriano ₹450, Canson Rough Pad ₹320, Newsprint ₹80, Kraft paper ₹50

Return a JSON response with exactly this structure:
{
  "totalEstimate": 450,
  "budgetUsage": "80%",
  "priorityList": [
    {
      "rank": 1,
      "itemId": "hb",
      "name": "HB Pencil by Staedtler",
      "price": 35,
      "reason": "Why buy this FIRST in 1 sentence",
      "buyWhen": "Start here",
      "skipIf": "You already own any mid-grade pencil"
    }
  ],
  "budgetTip": "Smart money advice for this budget in 1-2 sentences",
  "nextLevelTip": "What to buy next when budget increases",
  "doNotBuy": ["Items to avoid and why in 1 sentence each"]
}

Prioritize value for money. Only recommend what fits in the budget.
Return ONLY valid JSON.`;

    try {
        const response = await safeGeminiCall(prompt);
        const jsonStr = response.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '');
        const data = JSON.parse(jsonStr);

        setCachedAI(cacheKey, JSON.stringify(data), 12 * 60 * 60 * 1000); // 12hr cache
        logEvent('ai_recommend', 'anonymous', undefined, { budget, level, goals });

        res.json({ success: true, data, cached: false });
    } catch (err) {
        console.error('/ai/recommend error:', err);
        res.status(500).json({ success: false, error: 'Recommendation failed. Please try again.' });
    }
});

/**
 * POST /api/ai/compatibility
 * Check if pencil + paper combination is suitable
 */
router.post('/compatibility', async (req: Request, res: Response) => {
    const parsed = CompatibilitySchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ success: false, errors: parsed.error.issues });
        return;
    }

    const { pencilId, paperId } = parsed.data;
    const cacheKey = `compat:${pencilId}:${paperId}`;
    const cached = getCachedAI(cacheKey);

    if (cached) {
        res.json({ success: true, data: JSON.parse(cached), cached: true });
        return;
    }

    const pencil = PENCILS_DATA.find(p => p.id === pencilId);
    const paper = PAPERS_DATA.find(p => p.id === paperId);

    if (!pencil || !paper) {
        res.status(400).json({ success: false, error: 'Invalid pencil or paper ID' });
        return;
    }

    const prompt = `You are an expert art supply consultant.

Analyze the compatibility of using "${pencil.label} (${pencil.category})" on "${paper.label}" paper.

Pencil details: ${pencil.desc}
Paper details: ${paper.desc}

Return a JSON response:
{
  "compatible": true,
  "compatibilityScore": 8,
  "rating": "Excellent/Good/Fair/Poor",
  "headline": "Short 5-10 word summary",
  "whatHappens": "Exactly what happens when this pencil touches this paper in 2-3 sentences",
  "pros": ["Specific advantage 1", "Specific advantage 2"],
  "cons": ["Potential issue 1"],
  "tip": "One expert technique tip for this combination",
  "alternativePaper": "If poor match, suggest a better paper by name"
}

Return ONLY valid JSON.`;

    try {
        const response = await safeGeminiCall(prompt);
        const jsonStr = response.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '');
        const data = JSON.parse(jsonStr);

        setCachedAI(cacheKey, JSON.stringify(data), 24 * 60 * 60 * 1000); // 24hr cache
        res.json({ success: true, data, pencil, paper, cached: false });
    } catch (err) {
        console.error('/ai/compatibility error:', err);
        res.status(500).json({ success: false, error: 'Compatibility check failed.' });
    }
});

/**
 * GET /api/ai/pencil-insight/:id
 * AI-generated narrative about what using a specific pencil feels like
 */
router.get('/pencil-insight/:id', async (req: Request, res: Response) => {
    const pencilId = req.params.id;
    const cacheKey = `pencil-insight:${pencilId}`;
    const cached = getCachedAI(cacheKey);

    if (cached) {
        res.json({ success: true, data: JSON.parse(cached), cached: true });
        return;
    }

    const pencil = PENCILS_DATA.find(p => p.id === pencilId);
    if (!pencil) {
        res.status(404).json({ success: false, error: 'Pencil not found' });
        return;
    }

    const prompt = `You are a passionate art educator writing for Artgez, an Indian artist supply platform.

Write an engaging insight about the "${pencil.label}" pencil (${pencil.brand}, ${pencil.category}).
Pencil details: ${pencil.desc}

Return JSON:
{
  "experience": "2-3 sentences describing what it FEELS like to draw with this pencil (sensory, artistic)",
  "voiceOf": "Name of a famous Indian artist who might love this",
  "quote": "A fictional inspirational quote from that artist about this pencil (in first person)",
  "secretTip": "One expert secret technique most people don't know",
  "perfectFor": "The ONE type of drawing this pencil is absolutely made for",
  "notFor": "The ONE thing this pencil really struggles with"
}

Keep it engaging, specific, and useful for Indian art students. Return ONLY valid JSON.`;

    try {
        const response = await safeGeminiCall(prompt);
        const jsonStr = response.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '');
        const data = JSON.parse(jsonStr);

        setCachedAI(cacheKey, JSON.stringify(data), 7 * 24 * 60 * 60 * 1000); // 7 day cache
        res.json({ success: true, data, pencil, cached: false });
    } catch (err) {
        console.error('/ai/pencil-insight error:', err);
        res.status(500).json({ success: false, error: 'Insight generation failed.' });
    }
});

/**
 * POST /api/ai/quick-tip
 * Get a quick contextual tip based on current pencil + paper selection
 */
router.post('/quick-tip', async (req: Request, res: Response) => {
    const { pencilId, paperId, tool } = req.body;
    const cacheKey = `quick-tip:${pencilId}:${paperId}:${tool}`;
    const cached = getCachedAI(cacheKey);

    if (cached) {
        res.json({ success: true, tip: cached, cached: true });
        return;
    }

    const pencil = PENCILS_DATA.find(p => p.id === pencilId);
    const paper = PAPERS_DATA.find(p => p.id === paperId);

    const prompt = `In exactly ONE sentence (max 20 words), give an expert drawing tip for:
Pencil: ${pencil?.label || pencilId} | Paper: ${paper?.label || paperId} | Tool: ${tool}
Be specific and immediately actionable. No preamble.`;

    try {
        const tip = await safeGeminiCall(prompt);
        const cleanTip = tip.trim().replace(/^["']|["']$/g, '');
        setCachedAI(cacheKey, cleanTip, 6 * 60 * 60 * 1000);
        res.json({ success: true, tip: cleanTip, cached: false });
    } catch {
        res.json({ success: true, tip: `Try holding your ${pencil?.label || 'pencil'} at a lower angle for broader strokes.`, cached: false });
    }
});

/**
 * POST /api/ai/scan-match
 * Upload/capture pencil photo → Gemini Vision matches brand/hardness to our digital twin
 */
router.post('/scan-match', async (req: Request, res: Response) => {
    const { image, sessionId } = req.body;
    const sid = sessionId || 'anonymous';

    if (!image) {
        res.status(400).json({ success: false, error: 'Image data is required' });
        return;
    }

    try {
        const base64Data = image.includes(',') ? image.split(',')[1] : image;

        const prompt = `You are a professional art supply expert.
Analyze this captured photograph or uploaded image of a drawing pencil, brush, or other art supply item.
Identify the brand, brand color, and details of this supply.
Then, you must match it to the CLOSEST corresponding Digital Twin ID from our available catalog:

Available Digital Twin IDs in our database:
- 4h: 4H Technical Graphite Pencil (Faber-Castell)
- 2h: 2H Outline Graphite Pencil (Faber-Castell)
- hb: HB General Sketching Pencil (Staedtler)
- 2b: 2B Medium Shading Pencil (Faber-Castell)
- 4b: 4B Deep Shading Pencil (Faber-Castell)
- 6b: 6B Darkest Graphite Pencil (Staedtler)
- ch: Camlin Charcoal Pencil (Camlin)
- ink: Sakura Pigma Micron 01 Ink Pen (Sakura)
- bp: Pentel Pocket Brush Pen (Pentel)

Return a JSON response with exactly this structure:
{
  "detectedBrand": "Faber-Castell or Staedtler or Camlin or Sakura or Pentel",
  "detectedModel": "Name of the supply with its hardness/spec, e.g., 4B Graphite Pencil / Pigma Micron / Brush Pen / etc.",
  "matchedTwinId": "4h or 2h or hb or 2b or 4b or 6b or ch or ink or bp",
  "confidenceScore": 0.92,
  "explanation": "1-2 sentences explaining why this matched, based on physical details like casing color, markings, or core shape."
}

Return ONLY valid JSON. Do not include markdown code blocks, backticks, or any other surrounding text.`;

        const result = await visionModel.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: 'image/png',
                },
            },
        ]);

        const rawText = result.response.text().trim();
        const jsonStr = rawText.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
        const analysis = JSON.parse(jsonStr);

        // Find the matched pencil in seeds
        const twinData = PENCILS_DATA.find(p => p.id === analysis.matchedTwinId.toLowerCase()) || PENCILS_DATA[2];

        logEvent('AI_SCAN_MATCH', sid, twinData.id, {
            detectedBrand: analysis.detectedBrand,
            detectedModel: analysis.detectedModel,
            confidence: analysis.confidenceScore
        });

        res.json({
            success: true,
            data: {
                ...analysis,
                twinData
            }
        });
    } catch (err) {
        console.error('/ai/scan-match error:', err);
        res.status(500).json({
            success: false,
            error: 'Camera scan failed. Please try again.',
            fallback: {
                detectedBrand: 'Faber-Castell',
                detectedModel: '2B Graphite Pencil',
                matchedTwinId: '2b',
                confidenceScore: 0.75,
                explanation: 'Fallback matched closer to 2B graphite core.',
                twinData: PENCILS_DATA.find(p => p.id === '2b')
            }
        });
    }
});

export default router;
