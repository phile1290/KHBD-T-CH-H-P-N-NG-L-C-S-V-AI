const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf8');
code = code.replace('import { Part } from "@google/genai";', 'import { GoogleGenAI, Part } from "@google/genai";');
fs.writeFileSync('services/geminiService.ts', code);
