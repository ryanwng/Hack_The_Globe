from typing import Optional

from fastapi import APIRouter, HTTPException

from app.models import (
    FeedbackResponse,
    HintPayload,
    HintRequest,
    Scenario,
    SimulateConversationRequest,
    SimulateConversationResponse,
    SimulatedTurn,
    SessionCreateRequest,
    SessionCreateResponse,
    TurnRequest,
    TurnResponse,
)
from app.services.gemini_client import GeminiClient
from app.services.prompt_builder import (
    build_feedback_prompt,
    build_hint_prompt,
    build_opening_prompt,
    build_turn_prompt,
)
from app.services.session_store import InMemorySessionStore

router = APIRouter()
store = InMemorySessionStore()
gemini_client: Optional[GeminiClient] = None


def get_gemini() -> GeminiClient:
    global gemini_client
    if gemini_client is None:
        gemini_client = GeminiClient()
    return gemini_client


def _parse_hint(raw_hint: str) -> HintPayload:
    parts = [p.strip() for p in raw_hint.split("||")]
    if len(parts) < 3:
        return HintPayload(
            whatRecruiterMayThink=raw_hint,
            whatToSayNext="Try a shorter, clearer response focused on one key point.",
            whyItWorks="Clear structure helps the listener follow your intent.",
        )
    return HintPayload(
        whatRecruiterMayThink=parts[0],
        whatToSayNext=parts[1],
        whyItWorks=parts[2],
    )


def _parse_feedback(raw_feedback: str) -> FeedbackResponse:
    parts = [p.strip() for p in raw_feedback.split("||")]
    if len(parts) < 5:
        return FeedbackResponse(
            strengths=["Engaged in the conversation."],
            improvements=["Add clearer structure to each response."],
            exampleBetterPhrases=["Could you clarify what success looks like in this role?"],
            overallScore=70,
            nextPracticeFocus="Practice concise answers with one example.",
        )
    try:
        score = int(parts[3])
    except ValueError:
        score = 70
    return FeedbackResponse(
        strengths=[s.strip() for s in parts[0].split(",") if s.strip()],
        improvements=[s.strip() for s in parts[1].split(",") if s.strip()],
        exampleBetterPhrases=[s.strip() for s in parts[2].split(",") if s.strip()],
        overallScore=max(0, min(100, score)),
        nextPracticeFocus=parts[4],
    )


@router.get("/scenarios", response_model=list[Scenario])
def scenarios() -> list[Scenario]:
    return [
        Scenario(
            scenarioId="job_interview",
            scenarioTitle="Job Interview",
            description="Practice answering interview questions clearly and confidently.",
        ),
        Scenario(
            scenarioId="team_conflict",
            scenarioTitle="Team Conflict",
            description="Practice navigating disagreement with respectful communication.",
        ),
    ]


@router.post("/sessions", response_model=SessionCreateResponse)
def create_session(payload: SessionCreateRequest) -> SessionCreateResponse:
    state = store.create(
        scenario_id=payload.scenarioId,
        scenario_title=payload.scenarioTitle,
        user_goal=payload.userGoal,
        difficulty=payload.difficulty or "medium",
    )
    opening = get_gemini().generate_text(build_opening_prompt(state))
    state.messages.append({"role": "assistant", "content": opening})
    return SessionCreateResponse(
        sessionId=state.session_id,
        aiOpeningMessage=opening,
        conversationState="active",
    )


@router.post("/sessions/{session_id}/turns", response_model=TurnResponse)
def create_turn(session_id: str, payload: TurnRequest) -> TurnResponse:
    state = store.get(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")

    state.messages.append({"role": "user", "content": payload.userMessage})
    ai_message = get_gemini().generate_text(build_turn_prompt(state, payload.userMessage))
    state.messages.append({"role": "assistant", "content": ai_message})

    hint = None
    if payload.requestHint:
        hint_raw = get_gemini().generate_text(build_hint_prompt(state, payload.userMessage))
        hint = _parse_hint(hint_raw)

    return TurnResponse(
        aiMessage=ai_message,
        hint=hint,
        turnNumber=len([m for m in state.messages if m["role"] == "user"]),
        progressSignals=[
            "maintained conversation",
            "responded to prompt",
        ],
    )


@router.post("/sessions/{session_id}/hint", response_model=HintPayload)
def get_hint(session_id: str, payload: HintRequest) -> HintPayload:
    state = store.get(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    latest = payload.userMessageContext or (
        state.messages[-1]["content"] if state.messages else "No user message available"
    )
    hint_raw = get_gemini().generate_text(build_hint_prompt(state, latest))
    return _parse_hint(hint_raw)


@router.post("/sessions/{session_id}/complete", response_model=FeedbackResponse)
def complete_session(session_id: str) -> FeedbackResponse:
    state = store.get(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    raw_feedback = get_gemini().generate_text(build_feedback_prompt(state))
    return _parse_feedback(raw_feedback)


@router.post("/simulate", response_model=SimulateConversationResponse)
def simulate_conversation(payload: SimulateConversationRequest) -> SimulateConversationResponse:
    state = store.create(
        scenario_id=payload.scenarioId,
        scenario_title=payload.scenarioTitle,
        user_goal=payload.userGoal,
        difficulty=payload.difficulty or "medium",
    )
    opening = get_gemini().generate_text(build_opening_prompt(state))
    state.messages.append({"role": "assistant", "content": opening})

    simulated_turns = []
    for user_message in payload.userMessages:
        state.messages.append({"role": "user", "content": user_message})
        ai_message = get_gemini().generate_text(build_turn_prompt(state, user_message))
        state.messages.append({"role": "assistant", "content": ai_message})
        hint = None
        if payload.requestHintEachTurn:
            hint_raw = get_gemini().generate_text(build_hint_prompt(state, user_message))
            hint = _parse_hint(hint_raw)
        simulated_turns.append(
            SimulatedTurn(
                userMessage=user_message,
                aiMessage=ai_message,
                hint=hint,
                turnNumber=len([m for m in state.messages if m["role"] == "user"]),
            )
        )

    feedback = _parse_feedback(get_gemini().generate_text(build_feedback_prompt(state)))
    return SimulateConversationResponse(
        sessionId=state.session_id,
        aiOpeningMessage=opening,
        turns=simulated_turns,
        feedback=feedback,
    )
