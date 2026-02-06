from datetime import datetime
from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime | None = None


class ChatRequest(BaseModel):
    message: str
    project_id: int | None = None
    file_id: int | None = None  # Optional file context


class ChatResponse(BaseModel):
    message: str
    model: str


class ChatStreamStart(BaseModel):
    type: str = "start"
    model: str


class ChatStreamToken(BaseModel):
    type: str = "token"
    content: str


class ChatStreamEnd(BaseModel):
    type: str = "end"
    full_response: str


class ModelInfo(BaseModel):
    model: str
    version: str
    description: str
    capabilities: list[str]
