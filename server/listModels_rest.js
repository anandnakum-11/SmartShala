import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

async function listModels() {
    // Manually test the other key
    const apiKey = "AIzaSyCR3yWezE6EKCLYRwf2K_5jn_7a5q5tQFs";
    console.log(`Checking models for key starting with ${apiKey.substring(0, 10)}...`);

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await res.json();

        if (data.error) {
            console.error("❌ API Error:", data.error.message);
            return;
        }

        console.log("✅ FULL RAW DATA:");
        console.log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("❌ Connection failed:", err.message);
    }
}

listModels();
