import fs from "fs";
import os from "os";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();



async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));






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

  app.post("/api/generate", async (req, res) => {
    let uploadedGeminiFiles: string[] = [];
    const allLocalIds: string[] = [];
    try {
      const { userPrompt, systemInstruction, apiKey: clientApiKey, sourceType, mainFileId, mainImages, referenceFileIds } = req.body;
      
      const finalApiKey = clientApiKey || process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!finalApiKey) {
        throw new Error("Vui lòng nhập Gemini API Key để tạo giáo án.");
      }
      
      const ai = new GoogleGenAI({ apiKey: finalApiKey });
      const parts: any[] = [{ text: userPrompt }];

      const uploadFile = async (fileId: string, mimeType: string) => {
          allLocalIds.push(fileId);
          const filePath = path.join(tempDir, fileId);
          if (!fs.existsSync(filePath)) throw new Error("File missing on server: " + fileId);
          const geminiFile = await ai.files.upload({ file: filePath, config: { mimeType: mimeType } });
          uploadedGeminiFiles.push(geminiFile.name);
          return {
              fileData: {
                  fileUri: geminiFile.uri,
                  mimeType: mimeType
              }
          };
      };

      if (sourceType === 'pdf' && mainFileId) {
          parts.push(await uploadFile(mainFileId, 'application/pdf'));
      } else if (sourceType === 'image' && mainImages?.length) {
          for (const img of mainImages) {
              parts.push(await uploadFile(img.fileId, img.mimeType));
          }
      }

      if (referenceFileIds?.length) {
          parts.push({ text: "DƯỚI ĐÂY LÀ (CÁC) FILE PDF TÀI LIỆU THAM KHẢO (SỬ DỤNG LÀM KHUNG CƠ SỞ CHO NỘI DUNG TÍCH HỢP):" });
          for (const refId of referenceFileIds) {
              parts.push(await uploadFile(refId, 'application/pdf'));
          }
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts },
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.7
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("API Error:", error);
      res.status(500).json({ error: error.message });
    } finally {
        const ai = new GoogleGenAI({ apiKey: req.body.apiKey || process.env.GEMINI_API_KEY || process.env.API_KEY || '' });
        for (const name of uploadedGeminiFiles) {
            try { await ai.files.delete({ name }); } catch(e) { console.error("Cleanup error:", e); }
        }
        for (const id of allLocalIds) {
            try { fs.unlinkSync(path.join(tempDir, id)); } catch(e) {}
        }
    }
  });

  // Express error handler for payload too large or other errors
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global Express Error:", err);
    res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // For Express 5
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
