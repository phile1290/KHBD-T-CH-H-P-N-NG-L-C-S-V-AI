const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newRoute = `
  app.post("/api/generate-inline", async (req, res) => {
      try {
          const { parts, systemInstruction, apiKey: clientApiKey } = req.body;
          const finalApiKey = clientApiKey || process.env.GEMINI_API_KEY || process.env.API_KEY;
          if (!finalApiKey) {
              throw new Error("Vui lòng nhập Gemini API Key để tạo giáo án.");
          }
          
          const ai = new GoogleGenAI({ apiKey: finalApiKey });
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: { parts },
              config: {
                  systemInstruction: systemInstruction,
                  responseMimeType: "application/json",
                  temperature: 0.7
              }
          });
          
          res.json({ text: response.text });
      } catch (error: any) {
          console.error("API Error (inline):", error);
          res.status(500).json({ error: error.message });
      }
  });

  // API routes FIRST
`;

code = code.replace("  // API routes FIRST", newRoute);
fs.writeFileSync('server.ts', code);
