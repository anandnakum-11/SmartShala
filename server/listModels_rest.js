import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

async function listModels() {
    const apiKey = process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ No API key found in .env");
        return;
    }
    console.log(`Checking models for key starting with ${apiKey.substring(0, 10)}...`);

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await res.json();

        if (data.error) {
            console.error("❌ API Error:", data.error.message);
            return;
        }

        if (data.models) {
            let output = "";
            data.models.forEach(m => {
                if (m.supportedGenerationMethods.includes("generateContent")) {
                    output += `${m.name}\n`;
                }
            });
            fs.writeFileSync("models.txt", output);
            console.log("✅ Models written to models.txt");
        } else {
            console.log("No models found or unexpected response:", data);
        }
    } catch (err) {
        console.error("❌ Connection failed:", err.message);
    }
}

listModels();
