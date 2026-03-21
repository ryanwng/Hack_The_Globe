from app.services.session_store import SessionState


def build_opening_prompt(state: SessionState) -> str:
    return (
        "You are simulating a workplace scenario for autism-friendly social skills coaching. "
        f"Scenario: {state.scenario_title}. Goal: {state.user_goal}. Difficulty: {state.difficulty}. "
        "Start as the interviewer/recruiter and ask one realistic first question."
    )


def build_turn_prompt(state: SessionState, user_message: str) -> str:
    return (
        "Continue the roleplay as the workplace counterpart. "
        "Keep the language clear, direct, and supportive. "
        f"Scenario: {state.scenario_title}. Goal: {state.user_goal}. "
        f"User just said: {user_message}"
    )


def build_hint_prompt(state: SessionState, latest_user_message: str) -> str:
    return (
        "Give a coaching hint in plain text with three sections separated by '||': "
        "whatRecruiterMayThink || whatToSayNext || whyItWorks. "
        f"Scenario: {state.scenario_title}. Goal: {state.user_goal}. "
        f"User said: {latest_user_message}"
    )


def build_feedback_prompt(state: SessionState) -> str:
    return (
        "Evaluate the user on workplace communication. "
        "Return plain text with fields split by '||' in this exact order: "
        "strengths(comma list)||improvements(comma list)||exampleBetterPhrases(comma list)||overallScore(0-100)||nextPracticeFocus. "
        f"Scenario: {state.scenario_title}. Goal: {state.user_goal}. "
        f"Conversation transcript: {state.messages}"
    )
