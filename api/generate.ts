import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userPrompt, mainParts, referenceParts, systemInstruction, apiKey: clientApiKey } = req.body;
    
    const finalApiKey = clientApiKey || process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!finalApiKey) {
      throw new Error("Vui lòng nhập Gemini API Key để tạo giáo án.");
    }
    
    const ai = new GoogleGenAI({ apiKey: finalApiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
         parts: [
              { text: userPrompt },
              ...mainParts,
              ...referenceParts
         ]
      },
      config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.7
      }
    });

    res.status(200).json({ text: response.text });
  } catch (error: any) {
    console.error("Vercel API Error:", error);
    res.status(500).json({ error: error.message });
  }
}
