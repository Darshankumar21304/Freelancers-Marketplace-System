/**
 * Puter AI Claims Extractor & NLP Analysis Layer
 * Evaluates unstructured textual data (profile bios, project posts, claims)
 * Strictly extracts facts, claims, and textual consistency patterns.
 * Never directly dictates the final fraud risk score.
 */

const PUTER_ENDPOINT = 'https://api.puter.com/drivers/call';
const DEFAULT_TOKEN = process.env.PUTER_AI_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InYyIn0.eyJ0IjoidCIsInYiOiIyIiwidG9rZW5fdWlkIjoiMTdmYWY2M2ItYTdkZC00MTNiLTk2Y2UtNDViMWU3NDY4MjVjIiwidXUiOiJFTTVYRk9xN1M3ZVZWYWx2aFIxN05BPT0iLCJzdSI6IkxRSXgxRVpZUkJHcnUwTEVyYjlmTmc9PSIsImFpIjoiRU01WEZPcTdTN2VWVmFsdmhSMTdOQT09IiwiZnVsbF9hY2Nlc3MiOnRydWUsImlhdCI6MTc4ODA2MzAxOX0.KHJ-hl6PDLKzara41VQI5KVl6Z5am3Pfz7DeXuaOh-k';

// In-memory NLP cache with TTL (15 minutes)
const nlpCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;

/**
 * Deterministic Regex/Rule-Based Claims Extractor (Immediate Fallback)
 */
function extractClaimsDeterministic(text = '', role = 'freelancer') {
  const clean = String(text || '').toLowerCase();
  
  // 1. Skill keyword matches
  const skillKeywords = [
    'react', 'node.js', 'node', 'javascript', 'typescript', 'mongodb', 'express',
    'python', 'django', 'fastapi', 'flask', 'ai', 'ml', 'machine learning', 'rag',
    'ui/ux', 'ui/ux design', 'figma', 'flutter', 'react native', 'docker', 'aws',
    'sql', 'postgresql', 'devops', 'tailwind', 'graphql', 'next.js', 'vue', 'angular'
  ];
  const detectedSkills = skillKeywords.filter(k => clean.includes(k));

  // 2. Experience years detection
  let detectedExp = 'Not specified';
  const expMatch = clean.match(/(\d+)\+?\s*(?:years?|yrs?)/i);
  if (expMatch) {
    const yrs = parseInt(expMatch[1]);
    if (yrs >= 8) detectedExp = `${yrs}+ years (Senior/Lead)`;
    else if (yrs >= 3) detectedExp = `${yrs} years (Mid-Level)`;
    else detectedExp = `${yrs} years (Junior/Entry)`;
  } else if (clean.includes('expert') || clean.includes('senior')) {
    detectedExp = 'Senior / Expert';
  } else if (clean.includes('beginner') || clean.includes('entry level')) {
    detectedExp = 'Entry Level';
  }

  // 3. Spam / Off-platform contact signals
  const suspiciousKeywords = [
    'telegram', 'whatsapp me', 'wire transfer', 'crypto only', 'pay outside',
    'contact directly on @', 'cashapp', 'western union', 'fake account'
  ];
  const spamSignals = suspiciousKeywords.filter(kw => clean.includes(kw));

  // 4. Domain categorization
  let domain = 'general';
  if (detectedSkills.some(s => ['react', 'node.js', 'node', 'express', 'mongodb', 'javascript'].includes(s))) {
    domain = 'full_stack_development';
  } else if (detectedSkills.some(s => ['python', 'ai', 'ml', 'machine learning', 'rag'].includes(s))) {
    domain = 'ai_machine_learning';
  } else if (detectedSkills.some(s => ['figma', 'ui/ux', 'ui/ux design'].includes(s))) {
    domain = 'ui_ux_design';
  }

  return {
    claimedSkills: detectedSkills,
    claimedExperience: detectedExp,
    domain,
    textLength: clean.length,
    hasOffPlatformHints: spamSignals.length > 0,
    offPlatformSignals: spamSignals,
    source: 'Deterministic-NLP'
  };
}

/**
 * Call Puter AI for Structured Natural Language Extraction
 */
async function extractProfileClaims(text = '', role = 'freelancer') {
  if (!text || text.trim().length === 0) {
    return extractClaimsDeterministic('', role);
  }

  const cacheKey = `${role}_${text.trim().slice(0, 120)}_${text.length}`;
  const cached = nlpCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  const prompt = `Act as an NLP Information Extraction Parser for a professional freelance marketplace.
Analyze the following ${role} profile/job description:
"""
${text.slice(0, 2000)}
"""

Extract factual claims and respond strictly in valid JSON format with keys:
"claimedSkills": Array of technical and professional skills mentioned (strings),
"claimedExperience": String summary of claimed experience (e.g. "5 years", "Entry Level", "Unspecified"),
"domain": Primary professional domain (e.g. "full_stack_development", "ui_ux_design", "ai_machine_learning", "general"),
"hasOffPlatformHints": Boolean (true if text solicits off-platform contact like Telegram, WhatsApp, or outside payment),
"offPlatformSignals": Array of suspicious phrases if any.`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(PUTER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEFAULT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        interface: 'puter-chat-completion',
        driver: 'ai-chat',
        method: 'complete',
        args: {
          messages: [{ role: 'user', content: prompt }],
          model: 'gpt-4o-mini'
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Puter HTTP error ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.result?.message?.content || data.message?.content || '';
    const cleanJson = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    const validated = {
      claimedSkills: Array.isArray(parsed.claimedSkills) ? parsed.claimedSkills.map(s => String(s).toLowerCase().trim()) : [],
      claimedExperience: typeof parsed.claimedExperience === 'string' ? parsed.claimedExperience : 'Unspecified',
      domain: typeof parsed.domain === 'string' ? parsed.domain : 'general',
      hasOffPlatformHints: Boolean(parsed.hasOffPlatformHints),
      offPlatformSignals: Array.isArray(parsed.offPlatformSignals) ? parsed.offPlatformSignals : [],
      textLength: text.length,
      source: 'Puter-AI'
    };

    nlpCache.set(cacheKey, { data: validated, timestamp: Date.now() });
    return validated;
  } catch (err) {
    // Fallback to deterministic NLP immediately
    const fallback = extractClaimsDeterministic(text, role);
    nlpCache.set(cacheKey, { data: fallback, timestamp: Date.now() });
    return fallback;
  }
}

module.exports = {
  extractProfileClaims,
  extractClaimsDeterministic
};
