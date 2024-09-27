import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import http from "http";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.apiKey });

let chatHistory = [];

async function main(text, res) {
  try {
    const messages = chatHistory.map(([role, content]) => ({
      role,
      content,
    }));

    messages.push({
      role: "user",
      content: text + ". Vastaa minulle vain Suomeksi!",
    });

    const completion = await openai.chat.completions.create({
      messages: messages,
      model: "gpt-4o",
    });

    const completedText = completion.choices[0].message.content;

    chatHistory.push(["user", text]);
    chatHistory.push(["assistant", completedText]);

    console.log(completedText);

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "echo",
      input: completedText,
    });

    const englishTranslation = await openai.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Please provide a literal English translation of this text: ${completedText}`,
        },
      ],
      model: "gpt-4o-mini",
    });

    const englishText = englishTranslation.choices[0].message.content;

    const buffer = Buffer.from(await mp3.arrayBuffer());

    // Define the payload for the other server
    const payload = JSON.stringify({
      text: completedText,
      translation: englishText,
      audio: buffer.toString("base64"), // Encode buffer to base64 for sending
    });

    // Send the payload to the other server
    const options = {
      hostname: "localhost",
      port: 3001,
      path: "/your-endpoint-path", // Adjust this path as needed
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": payload.length,
      },
    };

    const req = http.request(options, (response) => {
      console.log(`statusCode: ${response.statusCode}`);
      response.on("data", (d) => {
        process.stdout.write(d);
      });
    });

    req.on("error", (error) => {
      console.error(error);
    });

    req.write(payload);
    req.end();

    res.json({
      text: completedText,
      translation: englishText,
      audio: buffer.toString("base64"),
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).send("Server error");
  }
}

app.post("/", (req, res) => {
  let text = req.body.text;
  main(text, res);
});

app.listen(4000, () => {
  console.log("Server is Running");
});
