import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase request size limit for base64 file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve Firebase Configuration to client safely
app.get("/api/firebase-config", (req, res) => {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, "utf-8");
      res.json(JSON.parse(data));
    } else {
      res.status(404).json({ error: "Config file not found" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// OCR endpoint using Gemini
app.post("/api/ocr", async (req, res) => {
  try {
    const { fileBase64, mimeType, filename, customModels } = req.body;

    if (!fileBase64 || !mimeType) {
      return res.status(400).json({ error: "Missing fileBase64 or mimeType" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Define standard models info
    const standardModelsText = `
1. AGENDAMENTO (Agendamento):
   Extract fields:
   - motorista (Driver name)
   - veiculo (Vehicle / License plate)
   - dataAgendamento (Schedule date)
   - horarioRetirada (Time / Slot of pickup)

2. DUIMP (DUIMP):
   Extract fields:
   - taie (TAIE Nº)
   - bl (B/L Nº)
   - dataEmissao (Date of emission)
   - navio (Vessel name)
   - dataChegada (Date of arrival)
   - container (Container ID)
   - volumes (Number of volumes)
   - pesoBruto (Gross weight)
   - bandeira (Vessel Flag)
   - nic (NIC)
   - invoice (Invoice ID)
   - terminal (Terminal name)

3. PEDIDO_DE_COLETA (Pedido de Coleta):
   Extract fields:
   - cliente (Client name)
   - processo (Process number)
   - container (Container ID)
   - transportadora (Carrier name)
   - terminal (Terminal name)
   - motorista (Driver name)
   - veiculo (Vehicle / License plate)
   - dataColeta (Collection Date)
   - horarioColeta (Collection Time)

4. NOTA_FISCAL (Nota Fiscal):
   Extract fields:
   - numeroNota (Invoice Number / Número da Nota)
   - serie (Series / Série)
   - emitente (Issuer name / Emitente)
   - destinatario (Recipient name / Destinatário)
   - valorTotal (Total Value / Valor Total)
   - pesoBruto (Gross weight / Peso Bruto)
   - pesoLiquido (Net weight / Peso Líquido)
   - dataEmissao (Issue Date / Data de Emissão)
   - chaveAcesso (44-digit Access Key / Chave de Acesso)

5. BILL_OF_LADING (Bill of Lading):
   Extract fields:
   - bl (B/L Number)
   - navio (Vessel name)
   - container (Container ID)
   - peso (Weight)
   - volumes (Volumes / Packages)
   - portoOrigem (Port of Origin)
   - portoDestino (Port of Destination)
   - importador (Importer name)
   - exportador (Exporter name)
`;

    const customModelsText = customModels && customModels.length > 0 
      ? `Here are the custom models defined by the user that you MUST also consider:
${customModels.map((m: any, i: number) => `
Custom Model ID: "${m.id}"
Name: "${m.name}"
Keywords for identification: ${m.keywords ? m.keywords.join(", ") : "none"}
Fields to extract:
${m.fields ? m.fields.map((f: any) => `- ${f.key} (${f.label || f.description || ""})`).join("\n") : ""}
`).join("\n")}
`
      : "No custom models are defined currently.";

    const prompt = `
Analyze the attached document (it could be an image or a PDF page).
First, identify which document type this is. Match against the standard models:
- AGENDAMENTO
- DUIMP
- PEDIDO_DE_COLETA
- NOTA_FISCAL
- BILL_OF_LADING

And match against any of the custom models if they are active and have matching keywords or headers:
${customModelsText}

Standard Models Rules:
${standardModelsText}

Rule for identification: Look for headers, title, keywords (such as "DUIMP", "TAIE", "DANFE", "NOTA FISCAL", "AGENDAMENTO", "BILL OF LADING", "B/L", "PEDIDO DE COLETA" etc.) and select the single best matching document type.
If none matches perfectly, pick the closest one or classify as "UNKNOWN".

Output your response as a raw JSON object ONLY, with exactly this schema:
{
  "documentType": "AGENDAMENTO" | "DUIMP" | "PEDIDO_DE_COLETA" | "NOTA_FISCAL" | "BILL_OF_LADING" | "CUSTOM_<ID>" | "UNKNOWN",
  "confidence": 0.0 to 1.0 (a decimal rating your confidence),
  "fields": {
    // key-value pairs of extracted fields. Keys must match the exact field name specified in the rules above, or the custom field key.
    // E.g., for AGENDAMENTO, keys are: motorista, veiculo, dataAgendamento, horarioRetirada.
    // values should be strings, formatted cleanly (e.g. clean dates as DD/MM/YYYY or YYYY-MM-DD, weights as clean numbers if possible, names in capital case).
  }
}

Do not include any Markdown wrap like \`\`\`json or trailing comments. Output strict, valid JSON.
`;

    // Strip prefix if any
    const base64Clean = fileBase64.replace(/^data:.*?;base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            data: base64Clean,
            mimeType: mimeType
          }
        },
        prompt
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);

    res.json({
      success: true,
      filename,
      ocrResult: parsed
    });
  } catch (error: any) {
    console.error("OCR API Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during OCR processing" });
  }
});

async function startServer() {
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
