from dataclasses import dataclass, field
from typing import Dict, List, Optional
from uuid import uuid4


@dataclass
class SessionState:
    session_id: str
    scenario_id: str
    scenario_title: str
    user_goal: str
    difficulty: str
    user_context: Optional[str] = None
    messages: List[dict] = field(default_factory=list)


class InMemorySessionStore:
    def __init__(self) -> None:
        self._sessions: Dict[str, SessionState] = {}

    def create(
        self,
        scenario_id: str,
        scenario_title: str,
        user_goal: str,
        difficulty: str,
        user_context: Optional[str] = None,
    ) -> SessionState:
        session_id = str(uuid4())
        state = SessionState(
            session_id=session_id,
            scenario_id=scenario_id,
            scenario_title=scenario_title,
            user_goal=user_goal,
            difficulty=difficulty,
            user_context=user_context,
        )
        self._sessions[session_id] = state
        return state

    def get(self, session_id: str) -> Optional[SessionState]:
        return self._sessions.get(session_id)
