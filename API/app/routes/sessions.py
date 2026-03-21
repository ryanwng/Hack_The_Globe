import re
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


def _parse_structured_response(raw: str) -> dict:
    """Parse AI response into character_name, narration, dialogue, signal, and options."""
    result = {"character_name": "", "narration": "", "dialogue": "", "mood": "neutral", "signal": "", "options": []}

    # Extract CHARACTER:
    char_match = re.search(r'CHARACTER:\s*(.+)', raw)
    if char_match:
        result["character_name"] = char_match.group(1).strip()

    # Extract SCENE:
    scene_match = re.search(r'SCENE:\s*(.+)', raw)
    if scene_match:
        result["narration"] = scene_match.group(1).strip()

    # Extract MOOD:
    mood_match = re.search(r'MOOD:\s*(\w+)', raw)
    if mood_match:
        valid_moods = {"neutral", "pleased", "skeptical", "concerned", "impressed", "uncomfortable", "amused", "thoughtful"}
        mood_val = mood_match.group(1).strip().lower()
        if mood_val in valid_moods:
            result["mood"] = mood_val

    # Extract SIGNAL:
    signal_match = re.search(r'SIGNAL:\s*(.+)', raw)
    if signal_match:
        result["signal"] = signal_match.group(1).strip()

    # Extract DIALOGUE:
    dialogue_match = re.search(r'DIALOGUE:\s*(.+?)(?=\nOPTIONS:|\nSCENE:|\nCHARACTER:|\nSIGNAL:|\nMOOD:|$)', raw, re.DOTALL)
    if dialogue_match:
        result["dialogue"] = dialogue_match.group(1).strip()

    # Extract OPTIONS:
    parts = re.split(r'\nOPTIONS:\s*\n', raw, maxsplit=1)
    if len(parts) > 1:
        for line in parts[1].strip().splitlines():
            cleaned = re.sub(r'^\d+[\.\)]\s*', '', line.strip())
            if cleaned:
                result["options"].append(cleaned)

    # Guarantee at least 3 options
    defaults = [
        "[Direct] I'd like to address this head-on.",
        "[Diplomatic] Let me think about the best way to approach this.",
        "[Curious] Can you tell me more about what you're thinking?",
    ]
    while len(result["options"]) < 3:
        result["options"].append(defaults[len(result["options"])])
    result["options"] = result["options"][:3]

    # Fallback: if no DIALOGUE found, treat the whole pre-OPTIONS text as dialogue
    if not result["dialogue"]:
        fallback = parts[0].strip()
        # Remove CHARACTER/SCENE lines from fallback
        fallback = re.sub(r'CHARACTER:\s*.+\n?', '', fallback)
        fallback = re.sub(r'SCENE:\s*.+\n?', '', fallback)
        result["dialogue"] = fallback.strip()

    return result


def _parse_hint(raw_hint: str) -> HintPayload:
    parts = [p.strip() for p in raw_hint.split("||")]
    
    def clean(s: str) -> str:
        # Strip common AI-generated labels/prefixes
        return re.sub(r'^(whatTheOtherPersonIsThinking|whatToSayNext|whyItWorks|Perspective|Thinking|Action|Reasoning):\s*', '', s, flags=re.IGNORECASE).strip()

    if len(parts) < 3:
        return HintPayload(
            whatRecruiterMayThink=clean(raw_hint),
            whatToSayNext="Consider clarifying the situation or asking a question to show engagement.",
            whyItWorks="Curiosity helps build rapport and shows you are listening.",
        )
    
    return HintPayload(
        whatRecruiterMayThink=clean(parts[0]),
        whatToSayNext=clean(parts[1]),
        whyItWorks=clean(parts[2]),
    )


def _parse_feedback(raw_feedback: str) -> FeedbackResponse:
    parts = [p.strip() for p in raw_feedback.split("||")]
    if len(parts) < 4:
        return FeedbackResponse(
            strengths=["Engaged in the conversation."],
            improvements=["Add clearer structure to each response."],
            exampleBetterPhrases=["Could you clarify what success looks like in this role?"],
            nextPracticeFocus="Practice concise answers with one example.",
        )
    return FeedbackResponse(
        strengths=[s.strip() for s in parts[0].split(",") if s.strip()],
        improvements=[s.strip() for s in parts[1].split(",") if s.strip()],
        exampleBetterPhrases=[s.strip() for s in parts[2].split(",") if s.strip()],
        nextPracticeFocus=parts[3],
    )


@router.get("/scenarios", response_model=list[Scenario])
def scenarios() -> list[Scenario]:
    return [
        Scenario(
            scenarioId="technical_debt_presentation",
            scenarioTitle="Technical Scope Negotiation",
            description="Negotiate a re-prioritization of technical debt with an engineering lead who is focused on shipping new features for a Q3 release.",
        ),
        Scenario(
            scenarioId="low_performing_peer",
            scenarioTitle="Providing Peer Feedback",
            description="Discuss a consistent pattern of missed deadlines with a peer whose work quality is impacting the wider team's project delivery timeline.",
        ),
        Scenario(
            scenarioId="senior_leadership_pitch",
            scenarioTitle="Project Resource Advocacy",
            description="A 10% budget reduction has been mandated. Stakeholders are requesting a justification for maintaining existing headcount on a cross-functional initiative.",
        ),
        Scenario(
            scenarioId="cross_functional_alignment",
            scenarioTitle="Inter-Departmental Conflict",
            description="A design stakeholder is requesting changes that extend beyond the current sprint scope. You need to align expectations regarding incremental delivery.",
        ),
    ]


@router.post("/sessions", response_model=SessionCreateResponse)
def create_session(payload: SessionCreateRequest) -> SessionCreateResponse:
    state = store.create(
        scenario_id=payload.scenarioId,
        scenario_title=payload.scenarioTitle,
        user_goal=payload.userGoal,
        difficulty=payload.difficulty or "medium",
        user_context=payload.userContext,
    )
    raw_opening = get_gemini().generate_text(build_opening_prompt(state))
    parsed = _parse_structured_response(raw_opening)
    state.messages.append({"role": "assistant", "content": parsed["dialogue"]})
    return SessionCreateResponse(
        sessionId=state.session_id,
        aiOpeningMessage=parsed["dialogue"],
        narration=parsed["narration"],
        characterName=parsed["character_name"],
        mood=parsed.get("mood", "neutral"),
        responseOptions=parsed["options"],
        conversationState="active",
    )


@router.post("/sessions/{session_id}/turns", response_model=TurnResponse)
def create_turn(session_id: str, payload: TurnRequest) -> TurnResponse:
    state = store.get(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")

    state.messages.append({"role": "user", "content": payload.userMessage})
    raw_response = get_gemini().generate_text(build_turn_prompt(state, payload.userMessage))
    parsed = _parse_structured_response(raw_response)
    state.messages.append({"role": "assistant", "content": parsed["dialogue"]})

    hint = None
    if payload.requestHint:
        hint_raw = get_gemini().generate_text(build_hint_prompt(state, payload.userMessage))
        hint = _parse_hint(hint_raw)

    return TurnResponse(
        aiMessage=parsed["dialogue"],
        narration=parsed["narration"],
        responseOptions=parsed["options"],
        hint=hint,
        turnNumber=len([m for m in state.messages if m["role"] == "user"]),
        mood=parsed.get("mood", "neutral"),
        socialSignal=parsed.get("signal", ""),
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
    raw_opening = get_gemini().generate_text(build_opening_prompt(state))
    opening_parsed = _parse_structured_response(raw_opening)
    message = opening_parsed["dialogue"]
    state.messages.append({"role": "assistant", "content": message})

    simulated_turns = []
    for user_message in payload.userMessages:
        state.messages.append({"role": "user", "content": user_message})
        raw = get_gemini().generate_text(build_turn_prompt(state, user_message))
        turn_parsed = _parse_structured_response(raw)
        ai_message = turn_parsed["dialogue"]
        turn_options = turn_parsed["options"]
        state.messages.append({"role": "assistant", "content": ai_message})
        hint = None
        if payload.requestHintEachTurn:
            hint_raw = get_gemini().generate_text(build_hint_prompt(state, user_message))
            hint = _parse_hint(hint_raw)
        simulated_turns.append(
            SimulatedTurn(
                userMessage=user_message,
                aiMessage=ai_message,
                responseOptions=turn_options,
                hint=hint,
                turnNumber=len([m for m in state.messages if m["role"] == "user"]),
            )
        )

    feedback = _parse_feedback(get_gemini().generate_text(build_feedback_prompt(state)))
    return SimulateConversationResponse(
        sessionId=state.session_id,
        aiOpeningMessage=message,
        turns=simulated_turns,
        feedback=feedback,
    )
