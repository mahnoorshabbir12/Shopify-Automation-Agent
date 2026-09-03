from typing import Any, Dict, Optional
from pydantic import BaseModel, Field

class RetellCallDetails(BaseModel):
    call_id: str = Field(..., description="Unique call ID from Retell")
    agent_id: Optional[str] = None
    call_type: Optional[str] = None
    disconnection_reason: str = Field(..., description="Reason call ended (e.g. no_answer, busy, user_hangup, dial_failed)")
    duration_ms: Optional[int] = Field(0, description="Call duration in milliseconds")
    transcript: Optional[str] = None
    retell_llm_dynamic_variables: Optional[Dict[str, Any]] = Field(default_factory=dict)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class RetellCallEndedWebhook(BaseModel):
    event: str = Field("call_ended", description="Event name, usually 'call_ended' or 'call_analyzed'")
    call: RetellCallDetails

class CallOutcomeResponse(BaseModel):
    order_id: str
    previous_status: str
    new_status: str
    retry_scheduled: bool
    attempt_count: int
    message: str
