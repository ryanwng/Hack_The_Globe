from typing import List, Optional

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    code: str
    message: str
    details: Optional[str] = None


class Scenario(BaseModel):
    scenarioId: str
    scenarioTitle: str
    description: str


class SessionCreateRequest(BaseModel):
    scenarioId: str = Field(..., min_length=1)
    scenarioTitle: str = Field(..., min_length=1)
    userGoal: str = Field(..., min_length=1)
    userContext: Optional[str] = None
    difficulty: Optional[str] = "medium"


class SessionCreateResponse(BaseModel):
    sessionId: str
    aiOpeningMessage: str
    narration: str = ""
    characterName: str = ""
    mood: str = "neutral"
    responseOptions: List[str] = []
    conversationState: str


class TurnRequest(BaseModel):
    userMessage: str = Field(..., min_length=1)
    requestHint: bool = False
    hintDepth: Optional[str] = "standard"


class HintPayload(BaseModel):
    whatRecruiterMayThink: str
    whatToSayNext: str
    whyItWorks: str


class TurnResponse(BaseModel):
    aiMessage: str
    narration: str = ""
    responseOptions: List[str] = []
    hint: Optional[HintPayload] = None
    turnNumber: int
    mood: str = "neutral"
    socialSignal: str = ""
    progressSignals: List[str]


class HintRequest(BaseModel):
    userMessageContext: Optional[str] = None


class FeedbackResponse(BaseModel):
    strengths: List[str]
    improvements: List[str]
    exampleBetterPhrases: List[str]
    nextPracticeFocus: str


class SimulateConversationRequest(BaseModel):
    scenarioId: str = Field(..., min_length=1)
    scenarioTitle: str = Field(..., min_length=1)
    userGoal: str = Field(..., min_length=1)
    difficulty: Optional[str] = "medium"
    userMessages: List[str] = Field(..., min_length=1)
    requestHintEachTurn: bool = False


class SimulatedTurn(BaseModel):
    userMessage: str
    aiMessage: str
    responseOptions: List[str] = []
    hint: Optional[HintPayload] = None
    turnNumber: int


class SimulateConversationResponse(BaseModel):
    sessionId: str
    aiOpeningMessage: str
    turns: List[SimulatedTurn]
    feedback: FeedbackResponse
