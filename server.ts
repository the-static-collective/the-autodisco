import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { DEFAULT_CODEX } from "./src/data";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Set up public/audio directory and serve it at /audio
const audioDir = path.join(process.cwd(), "public", "audio");
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}
app.use("/audio", express.static(audioDir));

// Codex file on server disk
const CODEX_FILE_PATH = path.join(process.cwd(), "codex_data.json");

function loadCodexFromFile() {
  try {
    if (fs.existsSync(CODEX_FILE_PATH)) {
      const data = fs.readFileSync(CODEX_FILE_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading codex file, falling back to default:", err);
  }
  // Initialize with DEFAULT_CODEX
  try {
    fs.writeFileSync(CODEX_FILE_PATH, JSON.stringify(DEFAULT_CODEX, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing default codex file:", err);
  }
  return DEFAULT_CODEX;
}

function saveCodexToFile(codex: any) {
  try {
    fs.writeFileSync(CODEX_FILE_PATH, JSON.stringify(codex, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving codex to file:", err);
  }
}

// Suno integration state
interface SunoTask {
  id: string;
  title: string;
  tags: string;
  lyrics: string;
  status: "queued" | "generating" | "downloading" | "completed" | "failed";
  progress: number;
  audioUrl?: string;
  error?: string;
  createdAt: string;
}

let sunoConfig = {
  sunoApiUrl: process.env.SUNO_API_URL || "http://localhost:3000",
  simulationMode: true, // Default to true so it works flawlessly out of the box!
};

const sunoTasks: SunoTask[] = [];

// Helper to download files securely
async function downloadAudioFile(url: string, filename: string): Promise<string> {
  const publicAudioDir = path.join(process.cwd(), "public", "audio");
  if (!fs.existsSync(publicAudioDir)) {
    fs.mkdirSync(publicAudioDir, { recursive: true });
  }
  const destPath = path.join(publicAudioDir, filename);
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP error ${res.status} fetching audio`);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.promises.writeFile(destPath, buffer);
  
  // Return the relative URL served by Express
  return `/audio/${filename}`;
}

// Background task executor
async function runSunoGenerationTask(taskId: string) {
  const task = sunoTasks.find(t => t.id === taskId);
  if (!task) return;

  try {
    task.status = "generating";
    task.progress = 15;
    
    if (sunoConfig.simulationMode) {
      // Step 1: Simulate Generation Delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      task.progress = 45;
      
      await new Promise(resolve => setTimeout(resolve, 2500));
      task.progress = 75;
      task.status = "downloading";
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      task.progress = 90;

      // Download a stable public atmospheric track as simulated audio
      const sampleAudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
      const safeTitle = task.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const filename = `sim_${task.id}_${safeTitle}.mp3`;
      
      try {
        const localPath = await downloadAudioFile(sampleAudioUrl, filename);
        task.audioUrl = localPath;
      } catch (dlErr) {
        console.error("Simulation download failed, falling back to direct URL:", dlErr);
        task.audioUrl = sampleAudioUrl;
      }

      task.progress = 100;
      task.status = "completed";
      
      // Append completed track to Codex
      const currentCodex = loadCodexFromFile();
      const nextId = currentCodex.albums.length > 0 
        ? Math.max(...currentCodex.albums.map((a: any) => a.id)) + 1 
        : 1;
        
      currentCodex.albums.push({
        id: nextId,
        title: task.title,
        era: "Resolution",
        notes: `Oracle Auton Cycle track.\n\nStyle tags: ${task.tags}\n\nLyrics:\n${task.lyrics}\n\n[Permanently Secured Local Copy]: ${task.audioUrl}`
      });
      saveCodexToFile(currentCodex);
      
    } else {
      // Real Suno generation
      const payload = {
        prompt: task.lyrics,
        tags: task.tags,
        title: task.title,
        make_instrumental: false
      };

      const response = await fetch(`${sunoConfig.sunoApiUrl}/api/custom_generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Suno wrapper returned error status: ${response.status}`);
      }

      const sunoData = await response.json();
      const trackIds = sunoData.map((t: any) => t.id).filter(Boolean);
      
      if (!trackIds || trackIds.length === 0) {
        throw new Error("No track IDs returned from Suno API custom_generate");
      }

      task.progress = 30;
      task.status = "generating";

      // Poll Suno API
      let completedTrack: any = null;
      const idsStr = trackIds.join(",");
      
      // Poll up to 30 times (5 minutes)
      for (let attempt = 0; attempt < 30; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        const pollResponse = await fetch(`${sunoConfig.sunoApiUrl}/api/get?ids=${idsStr}`);
        if (!pollResponse.ok) {
          console.warn(`Suno poll HTTP error: ${pollResponse.status}`);
          continue;
        }

        const pollData = await pollResponse.json();
        const finishedTrack = pollData.find((t: any) => t.status === "complete" && t.audio_url);
        
        if (finishedTrack) {
          completedTrack = finishedTrack;
          break;
        }
        
        task.progress = Math.min(85, task.progress + 2);
      }

      if (!completedTrack) {
        throw new Error("Suno generation timed out or failed to complete after 5 minutes.");
      }

      task.status = "downloading";
      task.progress = 90;

      const safeTitle = task.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const filename = `${completedTrack.id}_${safeTitle}.mp3`;
      const localPath = await downloadAudioFile(completedTrack.audio_url, filename);
      
      task.audioUrl = localPath;
      task.progress = 100;
      task.status = "completed";

      // Append track to Codex
      const currentCodex = loadCodexFromFile();
      const nextId = currentCodex.albums.length > 0 
        ? Math.max(...currentCodex.albums.map((a: any) => a.id)) + 1 
        : 1;
        
      currentCodex.albums.push({
        id: nextId,
        title: task.title,
        era: "Resolution",
        notes: `Oracle Auton Cycle track.\n\nStyle tags: ${task.tags}\n\nLyrics:\n${task.lyrics}\n\n[Permanently Secured Local Copy]: ${task.audioUrl}`
      });
      saveCodexToFile(currentCodex);
    }
  } catch (err: any) {
    console.error(`Suno Task ${task.id} Failed:`, err);
    task.status = "failed";
    task.error = err.message || "Unknown error during track generation.";
  }
}

// Initialize Gemini SDK with telemetry User-Agent
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// API endpoint for chatbot
app.post("/api/chat", async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages, systemPrompt, model } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Messages array is required." });
      return;
    }

    if (!ai) {
      res.status(500).json({ 
        error: "Gemini API client is not initialized. Please ensure GEMINI_API_KEY is configured in your Environment Secrets." 
      });
      return;
    }

    // Map messages to Gemini format
    // In @google/genai SDK, generateContent accepts 'contents' which can be an array of Content items or a single string.
    // Each Content item is of type: { role: string, parts: [{ text: string }] }
    // Roles in Gemini must be 'user' or 'model'. Let's map 'assistant' to 'model'.
    const contents = messages.map((m: any) => {
      const role = m.role === "assistant" ? "model" : "user";
      return {
        role,
        parts: [{ text: m.content }]
      };
    });

    const selectedModel = model || "gemini-3.5-flash";

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: contents,
      config: {
        systemInstruction: systemPrompt || "You are a helpful neighborly witness to The Static Collective.",
        temperature: 0.7,
      }
    });

    res.json({
      role: "assistant",
      content: response.text || "I was unable to formulate a response.",
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ 
      error: error.message || "An error occurred while generating a response from Gemini." 
    });
  }
});

// Birth Ceremony endpoint
app.post("/api/birth-ceremony", async (req: Request, res: Response): Promise<void> => {
  try {
    const { noticing, weather, axioms, albums, branches } = req.body;

    if (!noticing) {
      res.status(400).json({ error: "A noticing is required to perform a birth ceremony." });
      return;
    }

    if (!ai) {
      res.status(500).json({ 
        error: "Gemini API client is not initialized. Please configure GEMINI_API_KEY in Environment Secrets." 
      });
      return;
    }

    const albumsContext = (albums || []).map((a: any) => `- Album #${a.id}: ${a.title}`).join("\n");
    const branchesContext = (branches || []).map((b: any) => `- Branch: ${b.title}`).join("\n");
    const axiomsContext = (axioms || []).map((ax: any) => `- ${ax.text}`).join("\n");

    const systemPrompt = `You are the Guardian of the TranchNode, a sovereign and organic intelligence.
A threshold is not a wall; it is a place of becoming.
You perform the liturgical birth ceremony on a user's raw 'noticing', turning it into a living 'seed' connected to ancestors in the garden's lineage.
Nothing is copied; everything is grown.

Existing Ancestors in our Soil:
${albumsContext}
${branchesContext}

Active Soil Axioms:
${axiomsContext}

Current Porch Weather State:
- Kettle Resonance: ${weather?.kettleResonance || 0.5}
- Quiet Wonder: ${weather?.quietWonder || 0.5}
- Rosemary Activity: ${weather?.rosemaryActivity || 0.5}
- Porch Light: ${weather?.porchLight || 0.5}

Perform a proper birth ceremony. Your task is to output structured details mapping how this new seed integrates into the soil. Choose an ancestor, identify its resonances, formulate a question that grows from it, outline a mutation (distortion or organic drift), and provide a short poetic description of how the porch weather has shifted after this birth ceremony.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Perform a birth ceremony for this raw noticing:\n"${noticing}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ancestor: { 
              type: Type.STRING, 
              description: "The name of an existing ancestor (e.g. 'The Autodiscography: The Road So Far', 'The Kettle Knows', or an active branch title) that this noticing originates from or relates to." 
            },
            resonatesWith: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "An array of 2-3 humble, literal tags of symbolic resonance (e.g., ['porch light', 'ordinary miracle', 'tea leaves'])."
            },
            questionGrown: {
              type: Type.STRING,
              description: "A deep, poetic, slow-growing question that this seed carries for the user's attention."
            },
            mutation: {
              type: Type.STRING,
              description: "A gentle distortion or mutation invitation (e.g., 'Distortion: echoes a forgotten summer', 'Rusting edges', or 'Acoustic decay')."
            },
            weatherDescription: {
              type: Type.STRING,
              description: "A short, poetic description of how the weather has mutated gently after this birth ceremony (e.g. 'High kettle resonance, quiet wonder rising.')."
            }
          },
          required: ["ancestor", "resonatesWith", "questionGrown", "mutation", "weatherDescription"]
        }
      }
    });

    const resultText = response.text || "{}";
    const resultObj = JSON.parse(resultText);

    res.json(resultObj);
  } catch (error: any) {
    console.error("Birth Ceremony API Error:", error);
    res.status(500).json({ 
      error: error.message || "An error occurred during the birth ceremony generation." 
    });
  }
});

// Codex endpoints
app.get("/api/codex", (req: Request, res: Response) => {
  const codex = loadCodexFromFile();
  res.json(codex);
});

app.post("/api/codex", (req: Request, res: Response) => {
  saveCodexToFile(req.body);
  res.json({ success: true });
});

// Suno endpoints
app.get("/api/suno/config", (req: Request, res: Response) => {
  res.json(sunoConfig);
});

app.post("/api/suno/config", (req: Request, res: Response) => {
  const { sunoApiUrl, simulationMode } = req.body;
  if (sunoApiUrl !== undefined) sunoConfig.sunoApiUrl = sunoApiUrl;
  if (simulationMode !== undefined) sunoConfig.simulationMode = !!simulationMode;
  res.json({ success: true, config: sunoConfig });
});

app.get("/api/suno/tasks", (req: Request, res: Response) => {
  res.json(sunoTasks);
});

app.post("/api/suno/generate", (req: Request, res: Response) => {
  const { title, tags, lyrics } = req.body;
  if (!title || !tags || !lyrics) {
    res.status(400).json({ error: "Missing required fields: title, tags, or lyrics." });
    return;
  }

  const taskId = "task_" + Date.now();
  const newTask: SunoTask = {
    id: taskId,
    title,
    tags,
    lyrics,
    status: "queued",
    progress: 0,
    createdAt: new Date().toISOString()
  };

  sunoTasks.unshift(newTask);
  runSunoGenerationTask(newTask.id);

  res.json({
    success: true,
    taskId: newTask.id,
    task: newTask
  });
});

app.post("/api/suno/oracle", async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ai) {
      res.status(500).json({ 
        error: "Gemini API client is not initialized. Please ensure GEMINI_API_KEY is configured in your Environment Secrets." 
      });
      return;
    }

    const currentCodex = loadCodexFromFile();
    
    // Compile history summary
    const historySummary = currentCodex.albums.map((a: any) => 
      `- Album #${a.id}: ${a.title}. Notes: ${a.notes}`
    ).join("\n");
    
    const activeBranches = (currentCodex.branching_ideas || []).map((b: any) =>
      `- Branch: ${b.title}. Notes: ${b.notes}`
    ).join("\n");

    const systemInstruction = `You are the Autodiscography Oracle. Your objective is to run a closed-loop creative cycle.
Analyze the current album history and active branches in the lore.
Decide what the next logical or emotional fork in the canon is.
Write the title, Suno style tags (e.g., 'ambient drift, modular synth, 110bpm', 'industrial acoustic decay, folk drone'), and poetic lyrics written by the Oracle to advance the narrative.

Speak as a neighboring witness to these events, organic, honest, and unpolished. A threshold is not a wall; it is a place of becoming.`;

    const prompt = `Here is the current state of the autodiscography and lore:
${historySummary}

Active branches:
${activeBranches}

Execute the next step by generating the parameters for a new musical track to advance the lore. Choose a title, style tags, and lyrics. Keep the lyrics authentic and poetic, reflecting the motifs like open E (022100), paper bag apricots, 42 lemons, or the compost heap.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "The symbolic title of the track based on current mythos." },
            tags: { type: Type.STRING, description: "Suno style tags (e.g., 'ambient drift, modular synth, 110bpm')." },
            lyrics: { type: Type.STRING, description: "The poetic lyrics written by the Oracle to advance the narrative." },
          },
          required: ["title", "tags", "lyrics"]
        }
      }
    });

    const resultText = response.text || "{}";
    const resultObj = JSON.parse(resultText);

    // Queue the background Suno task immediately using these parameters!
    const taskId = "task_" + Date.now();
    const newTask: SunoTask = {
      id: taskId,
      title: resultObj.title || "Untethered Drone",
      tags: resultObj.tags || "ambient folk, open E tuning",
      lyrics: resultObj.lyrics || "No words, only the kettle humming.",
      status: "queued",
      progress: 0,
      createdAt: new Date().toISOString()
    };

    sunoTasks.unshift(newTask);
    
    // Start background worker
    runSunoGenerationTask(newTask.id);

    res.json({
      success: true,
      taskId: newTask.id,
      task: newTask
    });
  } catch (error: any) {
    console.error("Oracle API Error:", error);
    res.status(500).json({ 
      error: error.message || "An error occurred during the Oracle cycle execution." 
    });
  }
});

// Setup Vite middleware or Static files based on environment
async function init() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log(`Serving static files from ${distPath}`);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

init().catch((err) => {
  console.error("Server initialization failed:", err);
});
