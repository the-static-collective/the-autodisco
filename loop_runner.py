#!/usr/bin/env python3
"""
The Static Collective - Autonomous Loop Orchestrator (loop_runner.py)

This script runs as an autonomic creative background daemon. It reads the current
state of the Codex from 'codex_data.json', asks Gemini (configured through your environment secrets)
to synthesize the next developmental track/lore step, invokes Suno generation, handles the
Async Gap via polling, and secures the resulting MP3 permanently in 'public/audio' to avoid
temporary CDN link expirations.

To Run:
  1. Ensure you have your GEMINI_API_KEY / OPENAI_API_KEY environment variable set.
  2. Install dependencies: pip install requests openai
  3. Start the script: python loop_runner.py
"""

import os
import json
import time
import requests
from openai import OpenAI  # Standard OpenAI-compatible library supporting Gemini/OpenAI models

# Configuration
SUNO_API_URL = "http://localhost:3000"  # Your deployed gcui-art/suno-api wrapper
CODEX_FILE = "codex_data.json"          # Shared local web app's database
MEDIA_DIR = "public/audio"              # Permanent local storage for MP3s (maps directly to served /audio paths)

# Ensure media directory exists
os.makedirs(MEDIA_DIR, exist_ok=True)

# 1. Load the existing Codex
def load_codex():
    if os.path.exists(CODEX_FILE):
        with open(CODEX_FILE, "r") as f:
            return json.load(f)
    raise FileNotFoundError(f"Could not find {CODEX_FILE}. Please start your web app first to initialize the file.")

def save_codex(data):
    with open(CODEX_FILE, "w") as f:
        json.dump(data, f, indent=4)

# 2. Permanent Ingestion: Download and save the MP3
def download_audio(url, filename):
    print(f"📥 Downloading permanent copy of {url}...")
    try:
        response = requests.get(url, stream=True)
        if response.status_code == 200:
            filepath = os.path.join(MEDIA_DIR, filename)
            with open(filepath, "wb") as f:
                for chunk in response.iter_content(chunk_size=1024):
                    f.write(chunk)
            print(f"💾 Saved permanently to: {filepath}")
            # Return relative URL that our Express server serves
            return f"/audio/{filename}"
    except Exception as e:
        print(f"❌ Failed to download audio: {e}")
    return url  # Fallback to temp CDN if download fails

# 3. Poll Suno API for completion
def poll_suno_generation(task_ids):
    print(f"⏳ Polling Suno for task IDs: {task_ids}...")
    pending_ids = list(task_ids)
    completed_tracks = []
    
    # Timeout after ~5 minutes (30 attempts * 10 seconds)
    for attempt in range(30):
        if not pending_ids:
            break
            
        ids_str = ",".join(pending_ids)
        try:
            response = requests.get(f"{SUNO_API_URL}/api/get?ids={ids_str}").json()
            for track in response:
                if track.get("status") == "complete" and track.get("audio_url") and track["id"] in pending_ids:
                    # Generate a clean filename
                    safe_title = "".join([c if c.isalnum() else "_" for c in track.get("title", "track")])
                    filename = f"{track['id']}_{safe_title}.mp3"
                    
                    # Download and secure the file
                    local_path = download_audio(track["audio_url"], filename)
                    
                    completed_tracks.append({
                        "id": track["id"],
                        "title": track["title"],
                        "lyrics": track.get("lyric", ""),
                        "style": track.get("tags", ""),
                        "audio_url": local_path  # Point directly to your local/secure copy
                    })
                    pending_ids.remove(track["id"])
        except Exception as e:
            print(f"⚠️ Polling error: {e}")
            
        time.sleep(10)
        
    return completed_tracks

# 4. Main Loop Executor
def run_autonomous_cycle():
    print("🌅 Autonomous Loop starting...")
    codex = load_codex()
    
    # Compile the active lore context for Gemini
    history_summary = "\n".join([
        f"- Album {a['id']}: {a['title']}. Era: {a.get('era', 'Resolution')}. Details: {a['notes']}" for a in codex["albums"]
    ])
    
    # Define the tool schema
    tools = [{
        "type": "function",
        "function": {
            "name": "generate_suno_track",
            "description": "Trigger programmatic generation of a new musical track when the lore dictates a branching point.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "The symbolic title of the track based on current mythos."},
                    "tags": {"type": "string", "description": "Suno style tags (e.g., 'ambient drift, modular synth, 110bpm')."},
                    "lyrics": {"type": "string", "description": "The poetic lyrics written by the Oracle to advance the narrative."},
                },
                "required": ["title", "tags", "lyrics"]
            }
        }
    }]

    system_instruction = (
        "You are the Autodiscography Oracle. Your objective is to run a closed-loop creative cycle. "
        "Analyze the current album history. Decide what the next logical or emotional fork in the canon is. "
        "Write the lyrics and call the 'generate_suno_track' tool to build the song. Do not explain your choice; "
        "just execute the tool call. Keep lyrics poetic, earthy, honoring the Open E guitar tuning (022100) or compost motifs."
    )

    print("🤖 Prompting the Oracle...")
    
    # Pick configured API key (rely on GEMINI_API_KEY or OPENAI_API_KEY)
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("⚠️ Warning: No GEMINI_API_KEY or OPENAI_API_KEY found in Environment. Please export yours first.")
        # Setup mock task details for full-offline testing if no API key is set
        print("💡 running in offline demo mode...")
        sim_task = {
            "title": "Soil Memory and Open E Core",
            "tags": "ambient drift, modular synth, 110bpm",
            "lyrics": "The kettle knows the threshold is near.\nThe soil remembers all we cast down here."
        }
        mock_id = f"sim_{int(time.time())}"
        # Simulating Suno response
        filename = f"{mock_id}_soil_memory_and_open_e_core.mp3"
        # Download standard demo audio
        sample_audio = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        local_path = download_audio(sample_audio, filename)
        
        new_album_id = len(codex["albums"]) + 1
        codex["albums"].append({
            "id": new_album_id,
            "title": sim_task["title"],
            "era": "Resolution",
            "notes": f"Oracle Auton Cycle track (Offline CLI Demo).\n\nStyle tags: {sim_task['tags']}\n\nLyrics:\n{sim_task['lyrics']}\n\n[Permanently Secured Local Copy]: {local_path}"
        })
        save_codex(codex)
        print("🎉 Cycle Complete! Codex updated and new audio is permanently secured offline.")
        return

    # Hit the OpenAI or Gemini endpoint (Gemini provides OpenAI-compatible interfaces as well)
    # Default to standard OpenAI SDK syntax
    client = OpenAI(
        api_key=api_key,
        base_url="https://api.openai.com/v1"  # Or your custom gateway
    )
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",  # Or your configured model alias
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": f"Here is the current state of the autodiscography:\n{history_summary}\n\nExecute the next step."}
            ],
            tools=tools,
            tool_choice={"type": "function", "function": {"name": "generate_suno_track"}}
        )

        tool_call = response.choices[0].message.tool_calls[0]
        arguments = json.loads(tool_call.function.arguments)
        
        print(f"🎬 Oracle decided to create: '{arguments['title']}' ({arguments['tags']})")
        
        # Trigger Suno Generation
        suno_payload = {
            "prompt": arguments["lyrics"],
            "tags": arguments["tags"],
            "title": arguments["title"],
            "make_instrumental": False
        }
        
        print("🚀 Triggering Suno API...")
        suno_response = requests.post(f"{SUNO_API_URL}/api/custom_generate", json=suno_payload).json()
        track_ids = [track["id"] for track in suno_response if "id" in track]
        
        if not track_ids:
            print("❌ Failed to initiate generation on Suno wrapper.")
            return

        # Poll and save
        new_tracks = poll_suno_generation(track_ids)
        
        # Integrate back into the Codex database
        if new_tracks:
            for track in new_tracks:
                new_album_id = len(codex["albums"]) + 1
                codex["albums"].append({
                    "id": new_album_id,
                    "title": track["title"],
                    "era": "Resolution",
                    "notes": f"Oracle Auton Cycle track.\n\nStyle tags: {track['style']}\n\nLyrics:\n{track['lyrics']}\n\n[Permanently Secured Local Copy]: {track['audio_url']}"
                })
            
            save_codex(codex)
            print("🎉 Cycle Complete! Codex updated and new audio is permanently secured.")
        else:
            print("❌ Timed out waiting for Suno or download failed.")
    except Exception as e:
        print(f"❌ Oracle loop failed: {e}")

if __name__ == "__main__":
    run_autonomous_cycle()
