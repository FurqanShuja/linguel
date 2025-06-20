from fastapi import FastAPI, Body, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from typing import List, Dict, Any
import os
from dotenv import load_dotenv
import requests
import jwt
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

from schemas import (
    LearningChatRequest,
    TriggerReplacementRequest,
    ReplacementCardRequest,
    UpdateCardRequest
)

# Import your business logic functions
from data import get_chat_history, add_learned_data
from features import get_response, new_card, update_card, trigger_replacement, create_card_for_replacement, learning_chat_with_analysis

app = FastAPI()

# Add CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your Vite dev server address
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Google OAuth configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

@app.get("/auth/google")
def google_auth():
    """
    Initiates Google OAuth flow by redirecting to Google's authorization server.
    """
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/auth?"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={GOOGLE_REDIRECT_URI}&"
        f"scope=openid email profile&"
        f"response_type=code&"
        f"access_type=offline"
    )
    return {"auth_url": google_auth_url}

@app.get("/auth/callback")
def google_callback(code: str):
    """
    Handles the callback from Google OAuth and exchanges code for tokens.
    """
    try:
        # Exchange authorization code for access token
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": GOOGLE_REDIRECT_URI,
        }
        
        token_response = requests.post(token_url, data=token_data)
        token_response.raise_for_status()
        tokens = token_response.json()
        
        # Get user info from Google
        access_token = tokens["access_token"]
        user_info_url = f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={access_token}"
        user_response = requests.get(user_info_url)
        user_response.raise_for_status()
        user_data = user_response.json()
        
        # Extract email from user data
        email = user_data.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Email not found in Google response")
        
        # Create a simple JWT token for session management (optional)
        jwt_token = jwt.encode(
            {"email": email, "exp": datetime.utcnow() + timedelta(hours=24)},
            "your-secret-key",  # Use a proper secret key in production
            algorithm="HS256"
        )
        
        # Redirect back to root path with success parameters
        return RedirectResponse(url=f"http://localhost:5173/?token={jwt_token}&email={email}")
        
    except Exception as e:
        return RedirectResponse(url=f"http://localhost:5173/?error={str(e)}")

@app.get("/authenticate")
def endpoint_authenticate(email: str = None, token: str = None):
    """
    Endpoint for validating authentication.
    Now supports both legacy email lookup and JWT token validation.
    """
    try:
        if token:
            # Validate JWT token
            try:
                payload = jwt.decode(token, "your-secret-key", algorithms=["HS256"])
                email = payload.get("email")
                if not email:
                    return {"error": "Invalid token"}
                return {"email": email, "authenticated": True}
            except jwt.ExpiredSignatureError:
                return {"error": "Token expired"}
            except jwt.InvalidTokenError:
                return {"error": "Invalid token"}
        
        elif email:
            # For backward compatibility - you can remove this if you want to force OAuth
            # This would be the legacy authentication method
            return {"error": "Please use Google OAuth authentication"}
        
        else:
            return {"error": "No authentication method provided"}
            
    except Exception as e:
        return {"error": str(e)}

@app.post("/learning_chat_with_analysis")
def endpoint_learning_chat_with_analysis(request: LearningChatRequest):
    """
    Endpoint for performing the learning_chat sequence with analysis.
    Returns both the response and analysis data for immediate display.
    """
    result = learning_chat_with_analysis(user_input=request.user_input, email=request.email, situation=request.situation)
    return result

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
