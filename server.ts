import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { triggerSystemEmail } from './src/server/email';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI client lazily to avoid crashing on start if API key is missing
let aiClient: GoogleGenAI | null = null;

function getAIClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    console.log('[DEBUG] Initializing GoogleGenAI client...');
    if (!key) {
      console.error('[ERROR] GEMINI_API_KEY is completely missing from process.env');
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    } else if (key === 'MY_GEMINI_API_KEY') {
      console.error('[ERROR] GEMINI_API_KEY is set to default placeholder "MY_GEMINI_API_KEY"');
      throw new Error('GEMINI_API_KEY is configured as a placeholder. Please configure a valid secret.');
    } else {
      const maskedKey = key.length > 8 
        ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` 
        : '***';
      console.log(`[DEBUG] GEMINI_API_KEY is present in env. Length: ${key.length} characters. Key: ${maskedKey}`);
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// ----------------------------------------------------
// SECURE GEMINI AI PROXY ENDPOINT
// ----------------------------------------------------
app.post('/api/generate-package', async (req, res) => {
  try {
    const { destination, duration, budget, vibe, specialRequests } = req.body;

    if (!destination || !duration || !budget) {
      return res.status(400).json({ error: 'Missing required parameters: destination, duration, budget.' });
    }

    const client = getAIClient();
    
    const prompt = `You are an expert travel planner for Pravaah Travels, a highly customized, safe, and premium travel agency.
Generate a highly personalized, detailed, and authentic travel package itinerary based on the following customer preferences:
- Destination: ${destination}
- Duration: ${duration} Days
- Budget: INR ${budget}
- Travel Vibe/Style: ${vibe || 'Balanced'}
- Special Requests/Customizations: ${specialRequests || 'None'}

Craft an itinerary that makes sense for the destination, keeping travel times between spots realistic. Each day must feature a highly engaging and evocative description of activities, local dining recommendations, sightseeing points, and other premium travel insights.`;

    const candidateModels = ['gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    let lastError: any = null;
    let response: any = null;

    for (const modelName of candidateModels) {
      try {
        console.log(`Attempting itinerary generation with model: ${modelName}`);
        response = await client.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: {
                  type: Type.STRING,
                  description: 'A creative, professional, and inspiring title for this bespoke itinerary (e.g., "Sacred Peaks & Hidden Valleys: A Luxe Uttarakhand Escape").'
                },
                duration: {
                  type: Type.STRING,
                  description: 'The duration statement, e.g. "5 Days / 4 Nights".'
                },
                itinerary: {
                  type: Type.ARRAY,
                  description: 'A daily breakdown of the itinerary with realistic and detailed recommendations.',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      day: {
                        type: Type.INTEGER,
                        description: 'The day number (1, 2, 3, ...).'
                      },
                      title: {
                        type: Type.STRING,
                        description: 'A brief, inviting name for this day\'s main focus or route.'
                      },
                      description: {
                        type: Type.STRING,
                        description: 'Detailed sensory description of the sights, routes, dining secrets, physical ease, or adventure tips for this day. Keep it compelling and highly personalized.'
                      }
                    },
                    required: ['day', 'title', 'description']
                  }
                },
                inclusions: {
                  type: Type.ARRAY,
                  description: 'At least 4 premium, personalized inclusions (e.g., expert private local sherpa/guide, special permits, boutique stays, regional breakfast).',
                  items: { type: Type.STRING }
                },
                exclusions: {
                  type: Type.ARRAY,
                  description: 'Exactly 3 typical exclusions standard for this style (e.g., laundry, personal purchases, travel insurance).',
                  items: { type: Type.STRING }
                },
                tips: {
                  type: Type.ARRAY,
                  description: '3 highly practical safety, cultural, or navigation tips customized to their style and destination.',
                  items: { type: Type.STRING }
                }
              },
              required: ['title', 'duration', 'itinerary', 'inclusions', 'exclusions', 'tips']
            }
          }
        });
        
        if (response && response.text) {
          console.log(`Successfully generated itinerary using model: ${modelName}`);
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} failed with error:`, err?.message || err);
        lastError = err;
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('All candidate models failed to generate content.');
    }

    const responseText = response.text.trim();
    
    // Attempt to parse the response text
    try {
      const parsedData = JSON.parse(responseText);
      return res.json(parsedData);
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON. Raw text:', responseText);
      // Fallback fallback parser in case model outputted md code block inside responseMimeType
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanJson);
      return res.json(parsedData);
    }
  } catch (err: any) {
    console.error('Gemini Generation Error:', err);
    return res.status(500).json({
      error: 'Failed to generate travel package.',
      details: err.message || 'Unknown error occurred.',
    });
  }
});

// ----------------------------------------------------
// WEATHER & TRAVEL ALERTS PROXY ENDPOINT
// ----------------------------------------------------
app.get('/api/weather-alerts', async (req, res) => {
  try {
    const { destination } = req.query;

    if (!destination) {
      return res.status(400).json({ error: 'Missing required parameter: destination' });
    }

    const client = getAIClient();
    const prompt = `You are an expert Himalayan meteorologist and travel dispatcher for Pravaah Travels.
Generate a realistic, highly professional real-time weather update and travel advisory alerts package for the following destination: "${destination}".

Return a single JSON object. The weather should be realistic for the month of July in the Himalayas, with helpful, authentic notes about rainfall, landslide risks, and essential trekking/driving advisories.

The response MUST strictly match this JSON schema:
{
  "destination": "Name of the destination",
  "temperature": "Current temperature range (e.g. '15°C - 22°C')",
  "condition": "Short weather description (e.g. 'Light showers with heavy cloud cover')",
  "safetyStatus": "One of: 'Safe', 'Caution advised', 'Advisory alert'",
  "landslideRisk": "One of: 'Low', 'Moderate', 'High'",
  "routeStatus": "Detailed status of highway/mountain pass routes (e.g. 'NH-58 fully open. Avoid night travel.')",
  "packingRecommendation": "Key garments or accessories to pack (e.g. 'Heavy rainproof windcheater, trekking poles, warm base layers.')",
  "lastUpdated": "Today's localized timestamp (e.g. 'July 13, 10:15 AM')",
  "advisoryMessage": "A professional and friendly safety advisory or tip from Pravaah Travels (e.g. 'Mornings are usually clear. We recommend starting sightseeing by 6 AM to avoid afternoon cloud cover.')"
}`;

    const candidateModels = ['gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    let lastError: any = null;
    let response: any = null;

    for (const modelName of candidateModels) {
      try {
        console.log(`[DEBUG] Generating weather alerts with model: ${modelName} for destination: ${destination}`);
        response = await client.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                destination: { type: Type.STRING },
                temperature: { type: Type.STRING },
                condition: { type: Type.STRING },
                safetyStatus: { type: Type.STRING, description: "Must be one of: 'Safe', 'Caution advised', 'Advisory alert'" },
                landslideRisk: { type: Type.STRING, description: "Must be one of: 'Low', 'Moderate', 'High'" },
                routeStatus: { type: Type.STRING },
                packingRecommendation: { type: Type.STRING },
                lastUpdated: { type: Type.STRING },
                advisoryMessage: { type: Type.STRING }
              },
              required: ['destination', 'temperature', 'condition', 'safetyStatus', 'landslideRisk', 'routeStatus', 'packingRecommendation', 'lastUpdated', 'advisoryMessage']
            }
          }
        });

        if (response && response.text) {
          console.log(`[DEBUG] Successfully generated weather alerts using model: ${modelName}`);
          break;
        }
      } catch (err: any) {
        console.warn(`[WARNING] Weather alert generation failed on model ${modelName} with error:`, err?.message || err);
        lastError = err;
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('All candidate models failed to generate content.');
    }

    const responseText = response.text.trim();
    try {
      const parsedData = JSON.parse(responseText);
      return res.json(parsedData);
    } catch (parseErr) {
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanJson);
      return res.json(parsedData);
    }
  } catch (err: any) {
    console.error('[ERROR] Weather Alert Generation failed:', err);
    return res.status(500).json({
      error: 'Failed to generate weather alerts.',
      details: err.message || 'Unknown error occurred.'
    });
  }
});

// ----------------------------------------------------
// AUTOMATED EMAIL TRIGGER ENDPOINT
// ----------------------------------------------------
app.post('/api/trigger-email', async (req, res) => {
  try {
    const { trigger, recipientEmail, metadata } = req.body;

    if (!trigger || !recipientEmail || !metadata) {
      return res.status(400).json({ error: 'Missing required parameters: trigger, recipientEmail, metadata' });
    }

    const result = await triggerSystemEmail(trigger, recipientEmail, metadata);
    return res.json({ success: true, result });
  } catch (err: any) {
    console.error('[ERROR] Automated email trigger failed:', err);
    return res.status(500).json({
      error: 'Failed to trigger automated email.',
      details: err.message || 'Unknown error occurred.'
    });
  }
});

// ----------------------------------------------------
// DYNAMIC SEO ENDPOINTS (ROBOTS.TXT & SITEMAP.XML)
// ----------------------------------------------------
app.get('/robots.txt', (req, res) => {
  const origin = req.protocol + '://' + req.get('host');
  const robots = `User-agent: *
Allow: /
Disallow: /admin-dashboard
Disallow: /admin-login

Sitemap: ${origin}/sitemap.xml
`;
  res.type('text/plain');
  res.send(robots);
});

app.get('/sitemap.xml', async (req, res) => {
  const origin = req.protocol + '://' + req.get('host');
  let packageUrls = '';

  try {
    // Dynamically retrieve active packages from Firestore if Admin is initialized
    const { getApps, initializeApp } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');
    
    if (getApps().length === 0) {
      initializeApp();
    }
    const adminDb = getFirestore();
    const snap = await adminDb.collection('packages').where('active', '==', true).get();
    
    snap.forEach((doc: any) => {
      packageUrls += `  <url>\n    <loc>${origin}/package/${doc.id}</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
    });
  } catch (err) {
    console.warn('[SEO] Failed dynamic package fetch for sitemap. Using basic fallback pages.', err);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${origin}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${origin}/packages</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${origin}/destinations</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${origin}/reviews</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${origin}/gallery</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${origin}/about</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${origin}/contact</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${origin}/ai-curator</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
${packageUrls}</urlset>`;

  res.type('application/xml');
  res.send(sitemap);
});

// ----------------------------------------------------
// STATIC FILES & VITE MIDDLEWARE
// ----------------------------------------------------
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Running in Development mode. Initializing Vite middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Running in Production mode. Serving static assets...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

setupVite().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
});
