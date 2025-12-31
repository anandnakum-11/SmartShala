import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

import { GoogleGenerativeAI } from "@google/generative-ai";

async function listModels() {
    const apiKey = process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        console.error("❌ API key not found in environment variables. Check server/.env");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        const models = await genAI.listModels();

        console.log("✅ AVAILABLE MODELS:\n");

        models.models.forEach((model) => {
            console.log("Model name:", model.name);
            console.log("Supported methods:", model.supportedGenerationMethods);
            console.log("-----------------------------------");
        });
    } catch (error) {
        console.error("❌ Error listing models:", error);
        if (error.message.includes("API key not valid")) {
            console.error("👉 Please verify your VITE_GEMINI_API_KEY in server/.env");
        }
    }
}

listModels();
