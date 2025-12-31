import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from absolute path
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
app.use(cors());
app.use(express.json());

// DEBUG LOG
console.log("GEMINI KEY:", process.env.VITE_GEMINI_API_KEY ? "Loaded (starts with " + process.env.VITE_GEMINI_API_KEY.substring(0, 10) + "...)" : "UNDEFINED");

app.post("/chat", async (req, res) => {
    console.log("--- New Chat Request (REST v1) ---");
    try {
        const apiKey = process.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "API key missing on server" });
        }

        const { message, history } = req.body;

        // Prepare contents with history
        // The frontend sends history in the correct role/parts format
        const contents = [
            ...(history || []),
            {
                role: "user",
                parts: [{ text: message }]
            }
        ];

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents }),
            }
        );

        const data = await response.json();

        if (data.error) {
            console.error("Gemini API Error:", data.error);
            return res.status(response.status).json({ error: data.error.message });
        }

        if (!data.candidates || !data.candidates[0].content) {
            console.error("Unexpected Gemini Response:", data);
            return res.status(500).json({ error: "Invalid response from Gemini" });
        }

        const replyText = data.candidates[0].content.parts[0].text;
        console.log("Gemini response success");

        res.json({
            reply: replyText,
        });
    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ error: "Server failed to reach Gemini" });
    }
});

// Health check
app.get("/ping", (req, res) => {
    res.json({ status: "ok", message: "REST Proxy is reachable" });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`✅ Gemini REST server running on http://localhost:${PORT}`);
});
