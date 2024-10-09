import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import http from "http";
import fs from "fs";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.apiKey });

let chatHistory = [];
let messagesLDS = [];

// USE A JSON FILE TO LOAD CONTENT INTO THE CHAT

function loadContent() {
  fs.readFile("bom.json", "utf8", (err, data) => {
    if (err) {
      console.error("Error reading chat history:", err);
      return;
    }
    try {
      const scriptures = JSON.parse(data);

      scriptures.forEach((p) => {
        messagesLDS.push(p);
      });

      console.log("Chat history loaded successfully");
    } catch (error) {
      console.error("Error parsing chat history:", error);
    }
  });
}

loadContent();

// MAIN FUNCTION

async function main(text, res) {
  // Map the chat history to the format OpenAI expects

  try {
    const messages = chatHistory.map(([role, content]) => ({
      role,
      content,
    }));

    const loadedContext = messagesLDS.map(({ role, content }) => ({
      role,
      content,
    }));

    // Add the user message to the chat history

    messages.push({
      role: "user",
      content:
        text +
        ". Respond in the language that the previous sentence uses. Keep the response very brief.",
    });

    loadedContext.push({
      role: "user",
      content:
        text + ". Keep the response brief and use the preloaded JSON data.",
    });

    // Generate a completion based on the chat history

    const completion = await openai.chat.completions.create({
      messages: messages,
      model: "gpt-4o-mini",
    });

    const completionLDS = await openai.chat.completions.create({
      messages: loadedContext,
      model: "gpt-4o-mini",
    });

    // Extract the completed text from the completion

    const completedText = completion.choices[0].message.content;
    const completedTextLDS = completionLDS.choices[0].message.content;

    // Add the completed text to the chat history

    chatHistory.push(["user", text]);
    chatHistory.push(["assistant", completedText]);

    messagesLDS.push({ role: "user", content: text });
    messagesLDS.push({ role: "assistant", content: completedTextLDS });

    console.log("LDS VERSION " + completedTextLDS);

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "echo",
      input: completedText,
    });

    const englishTranslation = await openai.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Please provide a literal English translation of this text and nothing else: ${completedText}`,
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
      path: "/", // Adjust this path as needed
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

// Define the route for the server

app.post("/", (req, res) => {
  let text = req.body.text;
  main(text, res);
});

app.listen(4000, () => {
  console.log("Server is Running");
});
