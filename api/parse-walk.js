import OpenAI from 'openai';

const PROMPT = `Extract walking/activity stats from this Apple Health screenshot.
The workout time is in yellow at the top of the screenshot. Do not report back the elapsed time.
The distance is in blue below the workout time. 
The active calories are in bright pink to the right of the distance. Do not report back the total calories.
The average pace is in light blue below the active calories.
The average heartrate is in orange below the total calories.
Return ONLY a JSON object with these exact fields (use null for anything not visible):
{
  "date": "YYYY-MM-DD",
  "distanceMiles": 2.3,
  "durationMinutes": 45.5,
  "averagePaceMinPerMile": "19:45",
  "heartRate": 130,
  "activeCalories": 240
}
No markdown, no explanation — just the raw JSON object.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: 'OPENAI_API_KEY is not set. Add it to your Vercel environment variables.',
    });
  }

  const { imageData, mediaType } = req.body ?? {};
  if (!imageData || !mediaType) {
    return res.status(400).json({ error: 'imageData and mediaType are required' });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await client.chat.completions.create({
      model: 'gpt-4.1-nano',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mediaType};base64,${imageData}` },
            },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    });

    const raw = response.choices[0].message.content.trim();

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
