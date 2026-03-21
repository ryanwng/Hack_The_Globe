## 1) Setup

Run these commands in a terminal opened at the project folder:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `.env`:

```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```

## 2) Run the API

```bash
uvicorn main:app --reload --port 8000
```

Open docs:

- http://127.0.0.1:8000/docs

## 3) Core Endpoints

- `GET /health`
- `GET /v1/scenarios`
- `POST /v1/sessions`
- `POST /v1/sessions/{sessionId}/turns`
- `POST /v1/sessions/{sessionId}/hint`
- `POST /v1/sessions/{sessionId}/complete`
- `POST /v1/simulate` (one-call end-to-end conversation test)
- `POST /v1/voice/stt` (placeholder)
- `POST /v1/voice/tts` (placeholder)

## 4) Sample Requests

Create session:

```bash
curl -X POST "http://127.0.0.1:8000/v1/sessions" \
  -H "Content-Type: application/json" \
  -d '{"scenarioId":"job_interview","scenarioTitle":"Job Interview","userGoal":"Ace the interview","difficulty":"medium"}'
```

Complete and get feedback:

```bash
curl -X POST "http://127.0.0.1:8000/v1/sessions/<sessionId>/complete"
```

One-call full simulation:

```bash
curl -X POST "http://127.0.0.1:8000/v1/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "scenarioId":"job_interview",
    "scenarioTitle":"Job Interview",
    "userGoal":"Ace the interview",
    "difficulty":"medium",
    "userMessages":[
      "Hi, thanks for meeting with me.",
      "I recently led a school project with a team of four."
    ],
    "requestHintEachTurn": true
  }'
```

## 5) Run Tests

```bash
pytest -q
```
