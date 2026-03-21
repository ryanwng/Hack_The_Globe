import os
import json
import base64
import urllib.request
import urllib.error
from fastapi import APIRouter, Request
from dotenv import load_dotenv

load_dotenv(override=True)

router = APIRouter()

@router.post("/stt")
def speech_to_text_placeholder() -> dict:
    return {
        "message": "STT placeholder.",
    }


@router.post("/tts")
async def generate_tts(request: Request) -> dict:
    data = await request.json()
    text = data.get("text", "").strip()
    if not text:
        return {"error": "No text provided"}

    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        return {"error": "Missing ELEVENLABS_API_KEY"}

    # EXAVITQu4vr4xnSDxMaL = Sarah voice (standard premade, free tier supported).
    url = "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL?output_format=mp3_44100_128"
    
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }
    
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'))
    req.add_header('xi-api-key', api_key)
    req.add_header('Content-Type', 'application/json')
    req.add_header('Accept', 'audio/mpeg')

    try:
        with urllib.request.urlopen(req) as response:
            audio_data = response.read()
            b64_audio = base64.b64encode(audio_data).decode('utf-8')
            return {"audioBuffer": b64_audio}
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8')
        print(f"ElevenLabs TTS HTTP Error: {e.code} - {err_msg}")
        return {"error": err_msg}
    except Exception as e:
        print(f"ElevenLabs TTS Error: {str(e)}")
        return {"error": str(e)}
