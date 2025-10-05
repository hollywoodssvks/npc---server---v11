import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple memory store per NPC
const memories = {};

app.post("/api/turn", async (req, res) => {
  try {
    const { speaker = "Noel", message = "" } = req.body;

    // Retrieve memory history for this NPC
    if (!memories[speaker]) memories[speaker] = [];
    const history = memories[speaker];

    // Send to OpenAI
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: `You are ${speaker}. Stay in character.` },
        ...history,
        { role: "user", content: message }
      ],
    });

    const reply = completion.choices[0].message.content;

    // Save memory
    history.push({ role: "user", content: message });
    history.push({ role: "assistant", content: reply });
    if (history.length > 12) history.splice(0, history.length - 12);

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("NPC server is running.");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server listening on " + port));
