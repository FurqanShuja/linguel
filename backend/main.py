from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
from schemas import (
    LearningChatRequest,
    TriggerReplacementRequest,
    ReplacementCardRequest,
    UpdateCardRequest
)

# Import your business logic functions
from data import get_chat_history, add_learned_data, get_authentication
from features import get_response, learning_chat, new_card, update_card, trigger_replacement, create_card_for_replacement

app = FastAPI()

# Add CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your Vite dev server address
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/authenticate")
def endpoint_authenticate(email: str):
    """
    Endpoint for retrieving authentication details for a given email.
    Returns the password for the provided email.
    """
    try:
        password = get_authentication(email)
        return {"email": email, "password": password}
    except ValueError as e:
        return {"error": str(e)}

@app.post("/learning_chat")
def endpoint_learning_chat(request: LearningChatRequest):
    """
    Endpoint for performing the learning_chat sequence.
    Calls the 'learning_chat' function directly.
    """
    result = learning_chat(user_input=request.user_input, email=request.email, situation=request.situation)
    return {"result": result}

@app.post("/trigger_replacement")
def endpoint_trigger_replacement(request: TriggerReplacementRequest):
    """
    Endpoint for triggering a replacement operation on the user input.
    Calls the 'trigger_replacement' function directly.
    """
    output = trigger_replacement(user_input=request.user_input, email=request.email)
    return {"result": output}

@app.post("/save_replacement")
def endpoint_add_learned_data(request: ReplacementCardRequest):
    """
    Endpoint for adding a new learned data card.
    Accepts a replacement string (from the trigger replacement) and the email,
    creates a card using the LLM, and saves it with add_learned_data.
    """
    card_result = create_card_for_replacement(request.replacement, request.email)
    return {"status": "success", "message": card_result}

@app.get("/show_card")
def endpoint_show_card(email: str):
    """
    Endpoint to retrieve the first available card for the user.
    """
    card = new_card(email)
    return {"card": card}

@app.post("/update_card")
def endpoint_update_card(request: UpdateCardRequest):
    """
    Endpoint to update a learned-data card.
    """
    result = update_card(request.email, request.title, request.option_selected)
    return {"result": result}

@app.get("/chat_history")
def endpoint_get_chat_history(email: str):
    """
    Endpoint for retrieving the user's chat history.
    """
    history = get_chat_history(email)
    return {"history": history}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
