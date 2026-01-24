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
    escalate_reason: str = "none"


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


class KnowledgeBaseDocument(BaseModel):
    document_id: str
    title: str
    category: str
    content: str
    chunk_count: int


class KnowledgeBaseDocumentsResponse(BaseModel):
    property_id: str
    documents: list[KnowledgeBaseDocument]


# --- Insights ---


class QuestionInsight(BaseModel):
    question_pattern: str
    count: int
    avg_confidence: float
    escalation_count: int


class EscalationInsight(BaseModel):
    reason: str
    escalation_count: int
    avg_confidence: float
    sample_questions: list[str] = []


class InsightsResponse(BaseModel):
    property_id: str
    total_conversations: int
    total_messages: int
    total_escalations: int
    most_asked: list[QuestionInsight]
    worst_answered: list[QuestionInsight]
    escalation_themes: list[EscalationInsight] = []
    period_days: int = 30


# --- Batch Suggestions ---


class BatchSuggestion(BaseModel):
    suggestion_id: str
    property_id: str
    suggestion_type: str
    title: str
    content: str
    reasoning: str = ""
    source_patterns: list[str] = []
    status: str = "pending"
    created_at: Optional[datetime] = None


class BatchSuggestionUpdateRequest(BaseModel):
    status: str


# --- Tokens ---


class TokenCreateRequest(BaseModel):
    guest_name: str


class TokenCreateResponse(BaseModel):
    token: str
    link: str


class TokenValidationResponse(BaseModel):
    property_id: str
    guest_name: Optional[str] = None
    conversation_id: Optional[str] = None


# --- Knowledge Base Suggestions ---


class KBSuggestion(BaseModel):
    suggestion_id: str
    property_id: str
    title: str
    content: str
    category: str = "general"
    source_escalation_ids: list[str] = []
    status: str = "pending"
    created_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None


class KBSuggestionApproveRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None


# --- Aggregation ---


class AggregationTriggerResponse(BaseModel):
    status: str
    property_id: str
    run_id: str = ""


class AggregationProgressEvent(BaseModel):
    phase: int = 0
    phase_name: str = ""
    status: str = "idle"
    percent: int = 0
    detail: str = ""
    overall_percent: int = 0


class AggregationStatusResponse(BaseModel):
    status: str
    property_id: str
    progress: Optional[AggregationProgressEvent] = None
