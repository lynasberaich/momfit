import Anthropic from '@anthropic-ai/sdk';

const PROMPT = `Extract walking/activity stats from this Apple Health screenshot.
Return ONLY a JSON object with these exact fields (use null for anything not visible):
{
  "date": "YYYY-MM-DD",
  "distanceMiles": 2.3,
  "durationMinutes": 45.5,
  "averagePaceMinPerMile": "19:45",
  "steps": 4800
}
No markdown, no explanation — just the raw JSON object.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY is not set. Add it to your Vercel environment variables.',
    });
  }

  const { imageData, mediaType } = req.body ?? {};
  if (!imageData || !mediaType) {
    return res.status(400).json({ error: 'imageData and mediaType are required' });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageData },
            },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    });

    const raw = message.content[0].text.trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) {
        return res.status(500).json({ error: 'Could not parse vision response', raw });
      }
      parsed = JSON.parse(match[0]);
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('parse-walk error:', err);
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
}
