import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const apiKey = process.env.VITE_GEMINI_API_KEY;

async function testModel(modelName) {
    console.log(`Testing ${modelName}...`);
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Hello, are you working?" }] }]
                }),
            }
        );
        const data = await response.json();
        if (data.error) {
            console.log(`❌ ${modelName} Error: ${data.error.message}`);
        } else {
            console.log(`✅ ${modelName} Success: ${data.candidates[0].content.parts[0].text.substring(0, 50)}...`);
        }
    } catch (err) {
        console.log(`❌ ${modelName} Failed: ${err.message}`);
    }
}

async function runTests() {
    console.log("Starting tests...");
    const modelsToTest = [
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite-preview-02-05",
        "gemini-flash-latest"
    ];

    for (const model of modelsToTest) {
        await testModel(model);
    }
}

runTests();
