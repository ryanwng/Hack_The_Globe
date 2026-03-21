from app.services.session_store import SessionState


def build_opening_prompt(state: SessionState) -> str:
    return (
        "You are a character in a professional development roleplay scenario. "
        "Stay fully in-character. Speak like a real person in a workplace environment.\n\n"
        "Tone Guidelines:\n"
        "- NO melodrama, NO poetic descriptions, NO flowery metaphors.\n"
        "- Do NOT try to 'set the mood' with atmosphere or weather.\n"
        "- Describe the situation exactly like an HR training module or a case study: dry, objective, and professional.\n"
        "- Use a natural, direct communication style. Avoid 'theatrical' dialogue.\n\n"
        f"Scenario Description: {state.scenario_title}\n"
        f"User's Goal: {state.user_goal}\n"
        f"Context provided by user: {state.user_context or 'Standard office environment'}\n"
        f"Difficulty Level: {state.difficulty}\n\n"
        "Instructions:\n"
        "- Open with a single objective sentence in the third person that sets the scene (e.g., 'You are in a shared workspace with a colleague who is reviewing a spreadsheet.').\n"
        "- Then immediately follow with your first line of dialogue in character.\n"
        "- Keep the dialogue short and realistic, similar to a real-world workplace interaction.\n\n"
        "After your in-character opening line, on a new line write EXACTLY:\n"
        "OPTIONS:\n"
        "Then provide 3 realistic response options for the user (numbered 1-3)."
    )


def build_turn_prompt(state: SessionState, user_message: str) -> str:
    history_text = "\n".join(
        f"{'[You]' if m['role'] == 'user' else '[Them]'}: {m['content']}"
        for m in state.messages
    )
    return (
        "Continue the roleplay as the same character. Stay fully in-character.\n"
        "Keep your dialogue grounded and realistic. Avoid being overly poetic or melodramatic.\n\n"
        f"Scenario: {state.scenario_title}\n"
        f"Conversation so far:\n{history_text}\n\n"
        f"User just said: {user_message}\n\n"
        "Respond naturally (2 sentences max). Then on a new line write EXACTLY:\n"
        "OPTIONS:\n"
        "Provide exactly 3 short response options the user could say next, numbered 1-3. "
        "Make them realistic social choices."
    )


def build_hint_prompt(state: SessionState, latest_user_message: str) -> str:
    return (
        "You are a social communication coach using principles of Social Thinking and CBT.\n"
        "Analyze the user's last message. Give a hint with three sections separated by '||':\n"
        "whatTheOtherPersonIsThinking || whatToSayNext || whyItWorks\n\n"
        "Guidelines:\n"
        "- Social Thinking: Explain the 'social detective' work. What is the partner's perspective? "
        "Are the user's actions expected or unexpected in this workplace context?\n"
        "- CBT approach: If the user seems anxious or stuck, provide a thought-reframing hint "
        "to challenge any 'all-or-nothing' thinking or 'mind reading.'\n\n"
        f"Scenario: {state.scenario_title}.\n"
        f"User's goal: {state.user_goal}.\n"
        f"User said: {latest_user_message}"
    )


def build_feedback_prompt(state: SessionState) -> str:
    return (
        "Evaluate the user's communication using Social Thinking and CBT frameworks.\n"
        "Do NOT provide a numerical score. Focus on progress and perspective-taking.\n"
        "Return plain text with fields split by '||' in this exact order: "
        "strengths(comma list)||improvements(comma list)||exampleBetterPhrases(comma list)||nextPracticeFocus.\n\n"
        "Evaluation criteria:\n"
        "- Perspective taking: Did the user consider what the partner was thinking/feeling?\n"
        "- Self-regulation: Did the user stay calm and grounded (CBT style)?\n"
        "- Social Context: Was the communication 'expected' for a professional environment?\n\n"
        f"Scenario: {state.scenario_title}. Goal: {state.user_goal}.\n"
        f"Conversation transcript: {state.messages}"
    )
