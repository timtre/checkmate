from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field

# --- Chat ---


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    guest_name: Optional[str] = None


class Source(BaseModel):
    document_id: str
    title: str
    snippet: str
    similarity: float


class ChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    answer: str
    confidence: float
    sources: list[Source]
    escalated: bool = False


# --- Evaluation ---


class EvalVerdict(str, Enum):
    OK = "ok"
    LOW_CONFIDENCE = "low_confidence"
    DISSATISFIED = "dissatisfied"
    REPEATED_QUESTION = "repeated_question"


class EvaluationResult(BaseModel):
    evaluation_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversation_id: str
    message_id: str
    verdict: EvalVerdict
    confidence: float
    reasons: list[str] = []
    escalation_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


# --- Escalation ---


class EscalationStatus(str, Enum):
    OPEN = "open"
    REPLIED = "replied"
    RESOLVED = "resolved"


class Escalation(BaseModel):
    escalation_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    property_id: str
    conversation_id: str
    message_id: str
    guest_message: str
    ai_answer: str
    confidence: float
    reason: EvalVerdict
    status: EscalationStatus = EscalationStatus.OPEN
    pm_email: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class EscalationReply(BaseModel):
    reply_text: str
    replied_by: Optional[str] = None


class EscalationResponse(BaseModel):
    escalation_id: str
    status: EscalationStatus
    conversation_id: str
    reply_injected: bool = False


# --- Knowledge Base ---


class DocumentIngest(BaseModel):
    title: str
    content: str
    category: Optional[str] = None
    metadata: dict = {}


class DocumentIngestResponse(BaseModel):
    document_id: str
    chunks_created: int


# --- Insights ---


class QuestionInsight(BaseModel):
    question_pattern: str
    count: int
    avg_confidence: float
    escalation_count: int


class InsightsResponse(BaseModel):
    property_id: str
    total_conversations: int
    total_messages: int
    total_escalations: int
    most_asked: list[QuestionInsight]
    worst_answered: list[QuestionInsight]
    period_days: int = 30


# --- Tokens ---


class TokenCreateRequest(BaseModel):
    guest_name: str


class TokenCreateResponse(BaseModel):
    token: str
    link: str


class TokenValidationResponse(BaseModel):
    property_id: str
    guest_name: Optional[str] = None
