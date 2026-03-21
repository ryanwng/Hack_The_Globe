from fastapi import APIRouter

router = APIRouter()


@router.post("/stt")
def speech_to_text_placeholder() -> dict:
    return {
        "message": "STT placeholder.",
    }


@router.post("/tts")
def text_to_speech_placeholder() -> dict:
    return {
        "message": "TTS placeholder",
    }
