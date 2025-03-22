from pydantic import BaseModel
from typing import List, Dict, Any

class LearningChatRequest(BaseModel):
    user_input: str
    email: str
    situation: str

class TriggerReplacementRequest(BaseModel):
    user_input: str
    email: str

# Old SaveReplacementRequest is replaced by the following:
class ReplacementCardRequest(BaseModel):
    email: str
    replacement: str

class UpdateCardRequest(BaseModel):
    email: str
    title: str
    option_selected: str
