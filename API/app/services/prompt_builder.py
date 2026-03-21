from app.services.session_store import SessionState


def build_opening_prompt(state: SessionState) -> str:
    return (
        "You are roleplaying as a character in a workplace scenario. "
        "Stay fully in-character the entire time — never break the fourth wall or mention "
        "that this is a practice exercise, coaching session, or simulation.\n\n"
        f"Scenario: {state.scenario_title}\n"
        f"The user's personal goal (hidden from your character): {state.user_goal}\n"
        f"Difficulty: {state.difficulty}\n\n"
        "Instructions:\n"
        "- Immediately set the scene with a short 1-2 sentence description of the moment, then speak in-character.\n"
        "- Do NOT introduce yourself in a meta way (e.g. 'Welcome to this practice session').\n"
        "- Just act naturally as the person the user would encounter in this situation.\n"
        "- Keep your opening short and natural — say what that person would realistically say.\n\n"
        "After your in-character opening line, on a new line write EXACTLY:\n"
        "OPTIONS:\n"
        "Then provide exactly 3 short response options the user could choose from, each on its own line, "
        "numbered 1-3. Make them meaningfully different approaches (confident, cautious, curious, etc.). "
        "Do NOT include a 'write your own' option — that is handled by the UI."
    )


def build_turn_prompt(state: SessionState, user_message: str) -> str:
    history_text = "\n".join(
        f"{'[You]' if m['role'] == 'user' else '[Them]'}: {m['content']}"
        for m in state.messages
    )
    return (
        "Continue the roleplay as the same workplace character. Stay fully in-character.\n"
        "Never say things like 'this is a good response' or 'in this scenario.' "
        "Just react as a real person would.\n\n"
        f"Scenario: {state.scenario_title}\n"
        f"Conversation so far:\n{history_text}\n\n"
        f"User just said: {user_message}\n\n"
        "Respond naturally in-character (2-4 sentences max), then on a new line write EXACTLY:\n"
        "OPTIONS:\n"
        "Provide exactly 3 short response options the user could say next, each on its own line, "
        "numbered 1-3. Make them meaningfully different approaches."
    )


def build_hint_prompt(state: SessionState, latest_user_message: str) -> str:
    return (
        "You are a social skills coach analyzing a workplace conversation. "
        "Give a coaching hint in plain text with three sections separated by '||':\n"
        "whatTheOtherPersonMayThink || whatToSayNext || whyItWorks\n\n"
        f"Scenario: {state.scenario_title}.\n"
        f"User's goal: {state.user_goal}.\n"
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
