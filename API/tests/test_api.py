from fastapi.testclient import TestClient

import main
from app.routes import sessions


class FakeGemini:
    def generate_text(self, prompt: str) -> str:
        if "three sections" in prompt:
            return "They may want more clarity||Try a concise answer with one concrete example||It shows confidence and structure"
        if "Evaluate the user" in prompt:
            return "clear intent,good engagement||add specificity,shorter answers||I can share one example from my internship,Could you clarify expected outcomes for this role?||84||Practice concise STAR-style responses"
        if "Start as the interviewer" in prompt:
            return "Thanks for joining us today. Can you tell me about yourself?"
        return "That sounds good. Could you give a specific example?"


def test_health():
    client = TestClient(main.app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_session_lifecycle():
    sessions.gemini_client = FakeGemini()
    client = TestClient(main.app)

    create_response = client.post(
        "/v1/sessions",
        json={
            "scenarioId": "job_interview",
            "scenarioTitle": "Job Interview",
            "userGoal": "Ace the interview",
        },
    )
    assert create_response.status_code == 200
    session_id = create_response.json()["sessionId"]

    turn_response = client.post(
        f"/v1/sessions/{session_id}/turns",
        json={"userMessage": "I worked on a team project.", "requestHint": True},
    )
    assert turn_response.status_code == 200
    turn_payload = turn_response.json()
    assert "aiMessage" in turn_payload
    assert turn_payload["hint"] is not None
    assert "whatToSayNext" in turn_payload["hint"]

    hint_response = client.post(
        f"/v1/sessions/{session_id}/hint",
        json={"userMessageContext": "I am unsure what to say next."},
    )
    assert hint_response.status_code == 200
    assert "whatRecruiterMayThink" in hint_response.json()

    complete_response = client.post(f"/v1/sessions/{session_id}/complete")
    assert complete_response.status_code == 200
    complete_payload = complete_response.json()
    assert "overallScore" in complete_payload
    assert isinstance(complete_payload["strengths"], list)


def test_simulate_endpoint():
    sessions.gemini_client = FakeGemini()
    client = TestClient(main.app)

    response = client.post(
        "/v1/simulate",
        json={
            "scenarioId": "job_interview",
            "scenarioTitle": "Job Interview",
            "userGoal": "Ace the interview",
            "difficulty": "medium",
            "userMessages": [
                "I have worked in collaborative environments.",
                "I led a capstone project with 4 teammates.",
            ],
            "requestHintEachTurn": True,
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert "sessionId" in payload
    assert "aiOpeningMessage" in payload
    assert len(payload["turns"]) == 2
    assert payload["turns"][0]["hint"] is not None
    assert "overallScore" in payload["feedback"]
