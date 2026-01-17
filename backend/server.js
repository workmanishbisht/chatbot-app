import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

console.log("GEMINI KEY:", process.env.GEMINI_API_KEY?.slice(0, 10));

app.get("/", (req, res) => {
  res.send("Gemini backend running 🚀");
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.json({ reply: "Message missing" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: message }],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    console.log("GEMINI RAW:", JSON.stringify(data, null, 2));

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from Gemini";

    res.json({ reply: text });
  } catch (error) {
    console.error("GEMINI ERROR:", error);
    res.json({ reply: "Nova couldn't generate a response 😓" });
  }
});

app.listen(3000, () => {
  console.log("Gemini server running on http://localhost:3000");
});
