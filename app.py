import streamlit as st
import requests
from datetime import datetime

# Adjust this base URL as needed for your FastAPI
BASE_URL = "http://127.0.0.1:8000"

# ------------------------------------------------------------------
# Helper Functions (API calls)
# ------------------------------------------------------------------
def authenticate_user(email: str, password: str) -> bool:
    try:
        resp = requests.get(f"{BASE_URL}/authenticate", params={"email": email})
        data = resp.json()
        return data.get("password") == password
    except Exception as e:
        st.error(f"Error calling /authenticate: {e}")
        return False

def get_chat_history(email: str):
    try:
        resp = requests.get(f"{BASE_URL}/chat_history", params={"email": email})
        data = resp.json()
        return data.get("history", [])
    except Exception as e:
        st.error(f"Error calling /chat_history: {e}")
        return []

def call_learning_chat(user_input: str, email: str, situation: str) -> str:
    payload = {
        "user_input": user_input,
        "email": email,
        "situation": situation,
    }
    try:
        resp = requests.post(f"{BASE_URL}/learning_chat", json=payload)
        data = resp.json()
        return data.get("result", "No response received")
    except Exception as e:
        st.error(f"Error calling /learning_chat: {e}")
        return "Error processing your request. Please try again."

def call_trigger_replacement(user_input: str, email: str) -> str:
    payload = {"user_input": user_input, "email": email}
    try:
        resp = requests.post(f"{BASE_URL}/trigger_replacement", json=payload)
        data = resp.json()
        return data.get("result", "")
    except Exception as e:
        st.error(f"Error calling /trigger_replacement: {e}")
        return "Error processing replacement. Please try again."

def call_show_card(email: str) -> dict:
    """
    Calls the /show_card endpoint to retrieve the first available flashcard.
    Returns a dictionary or string (e.g. 'No available cards').
    """
    try:
        resp = requests.get(f"{BASE_URL}/show_card", params={"email": email})
        data = resp.json()
        return data.get("card", "No card received")
    except Exception as e:
        st.error(f"Error calling /show_card: {e}")
        return "Error showing card."

def call_update_card(email: str, title: str, option_selected: str) -> str:
    """
    Calls the /update_card endpoint to update the selected flashcard's schedule.
    option_selected must be one of 'AGAIN', 'HARD', 'GOOD', 'EASY'.
    Returns the endpoint's response as a string.
    """
    payload = {
        "email": email,
        "title": title,
        "option_selected": option_selected
    }
    try:
        resp = requests.post(f"{BASE_URL}/update_card", json=payload)
        data = resp.json()
        return data.get("result", "FAIL")
    except Exception as e:
        st.error(f"Error calling /update_card: {e}")
        return "FAIL"

# ------------------------------------------------------------------
# Page Configuration and State Management
# ------------------------------------------------------------------
st.set_page_config(
    page_title="Language Learning App",
    page_icon="🗣️",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Initialize session state variables
if "current_page" not in st.session_state:
    st.session_state.current_page = "main"
if "authenticated" not in st.session_state:
    st.session_state.authenticated = False
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []
if "trigger_output" not in st.session_state:
    st.session_state.trigger_output = ""
if "button_clicked" not in st.session_state:
    st.session_state.button_clicked = False
# Store the current flashcard in session state
if "current_flashcard" not in st.session_state:
    st.session_state.current_flashcard = None

# Custom CSS for better styling
st.markdown("""
    <style>
    .main-header {
        font-size: 2.5rem;
        margin-bottom: 2rem;
        color: #1E88E5;
    }
    .sub-header {
        font-size: 1.8rem;
        margin-bottom: 1rem;
        color: #424242;
    }
    .chat-container {
        border: 1px solid #e0e0e0;
        border-radius: 10px;
        padding: 20px;
        margin-bottom: 20px;
        background-color: #f9f9f9;
        max-height: 400px;
        overflow-y: auto;
    }
    .user-message {
        background-color: #212121;
        color: white;
        padding: 10px;
        border-radius: 10px;
        margin: 5px 0;
        text-align: right;
        border: 1px solid #424242;
    }
    .ai-message {
        background-color: #212121;
        color: white;
        padding: 10px;
        border-radius: 10px;
        margin: 5px 0;
        border: 1px solid #424242;
    }
    .trigger-suggestion {
        background-color: #212121;
        color: white;
        padding: 10px;
        border-radius: 5px;
        margin-top: 10px;
        border: 1px solid #424242;
    }
    .stButton button {
        width: 100%;
        border-radius: 5px;
        font-weight: 600;
    }
    /* Hide Streamlit elements that may cause white boxes */
    .stAlert {
        display: none;
    }
    </style>
""", unsafe_allow_html=True)

# Function to navigate between pages
def change_page(page):
    st.session_state.current_page = page
    st.rerun()

# ------------------------------------------------------------------
# Main Screen (Login and Navigation)
# ------------------------------------------------------------------
def main_page():
    st.markdown("<h1 class='main-header'>Language Learning Assistant</h1>", unsafe_allow_html=True)

    if not st.session_state.authenticated:
        col1, col2 = st.columns([1, 1])
        
        with col1:
            st.markdown("<h2 class='sub-header'>Welcome!</h2>", unsafe_allow_html=True)
            st.markdown("""
            Improve your language skills through interactive 
            conversations and personalized feedback.
            
            * Practice real-world scenarios
            * Get instant corrections
            * Track your progress
            """)
            
        with col2:
            st.markdown("<h2 class='sub-header'>Login</h2>", unsafe_allow_html=True)
            with st.form("login_form"):
                email = st.text_input("Email", key="login_email")
                password = st.text_input("Password", type="password", key="login_password")
                submit_button = st.form_submit_button("Login")
                
                if submit_button:
                    if authenticate_user(email, password):
                        st.session_state.authenticated = True
                        st.session_state.email = email
                        st.session_state.chat_history = get_chat_history(email)
                        st.success("Logged in successfully!")
                        st.rerun()
                    else:
                        st.error("Invalid email or password.")
        return

    # After login, display dashboard
    st.markdown("<h2 class='sub-header'>Dashboard</h2>", unsafe_allow_html=True)
    st.markdown(f"Welcome back, **{st.session_state.email}**! Choose a feature to continue your learning journey.")
    
    col1, col2, col3 = st.columns(3)
    with col1:
        if st.button("Practice Conversation", key="goto_chat", use_container_width=True):
            change_page("chat")
    with col2:
        if st.button("Vocabulary Flashcards", key="goto_flashcards", use_container_width=True):
            change_page("flashcards")
    with col3:
        st.button("Progress Report (Coming Soon!)", disabled=True, use_container_width=True)

# ------------------------------------------------------------------
# Chat Page
# ------------------------------------------------------------------
def chat_page():
    # Header with navigation
    col1, col2 = st.columns([6, 1])
    with col1:
        st.markdown("<h1 class='main-header'>Practice Conversation</h1>", unsafe_allow_html=True)
    with col2:
        if st.button("← Back", key="back_button"):
            change_page("main")
    
    # Scenario selection
    scenario = st.selectbox(
        "Choose scenario:",
        ["You are in a cafe ordering from a waiter", 
         "You are asking for directions", 
         "You are introducing yourself to a new colleague"],
        index=0
    )
    
    situation_mapping = {
        "You are in a cafe ordering from a waiter": "You are in a waiter in a cafe and conversing with the user to take his order",
        "You are asking for directions": "You are helping someone find their way in the city",
        "You are introducing yourself to a new colleague": "You are meeting a new colleague at work"
    }
    
    # Create a placeholder for chat messages
    chat_container = st.container()
    
    # Input area
    with st.form(key="chat_form"):
        user_input = st.text_area("Your message:", key="user_message", height=100)
        colA, colB = st.columns(2)
        
        with colA:
            send_button = st.form_submit_button("Send Message", use_container_width=True)
        with colB:
            trigger_button = st.form_submit_button("Suggest Improvement", use_container_width=True)
        
        if send_button and user_input.strip():
            # Add user message to chat history
            new_message = {"message": user_input, "source": "user", "timestamp": datetime.now().isoformat()}
            st.session_state.chat_history.append(new_message)
            
            # If a trigger_output is present, check if its replacement (text after "->" or your chosen delimiter) exists in the user_input.
            if st.session_state.trigger_output:
                # Example: user uses comma (,) or arrow (->). Adjust based on your LLM's format:
                # "Vocabulary: the house -> das haus"
                # We'll assume you use comma separation or arrow. 
                # For demonstration, let's parse with "->".
                if "->" in st.session_state.trigger_output:
                    replacement_text = st.session_state.trigger_output.split("->")[-1].strip()
                    if replacement_text.lower() in user_input.lower():
                        payload = {"email": st.session_state.email, "replacement": st.session_state.trigger_output}
                        resp = requests.post(f"{BASE_URL}/save_replacement", json=payload)
                        st.success("Replacement data saved!")
                        st.session_state.trigger_output = ""

            # Now get AI response
            ai_response = call_learning_chat(
                user_input, 
                st.session_state.email, 
                situation_mapping.get(scenario, situation_mapping["You are in a cafe ordering from a waiter"])
            )
            new_ai_message = {"message": ai_response, "source": "ai", "timestamp": datetime.now().isoformat()}
            st.session_state.chat_history.append(new_ai_message)
            st.rerun()

        if trigger_button and user_input.strip():
            # Get suggestion without adding to chat history
            replacement = call_trigger_replacement(user_input, st.session_state.email)
            st.session_state.trigger_output = replacement
            st.rerun()
    
    # Display chat messages after form submission to prevent duplication
    with chat_container:
        st.markdown("<div class='chat-container'>", unsafe_allow_html=True)
        if not st.session_state.chat_history:
            st.markdown("<div style='text-align:center; padding:20px;'>Start the conversation by typing a message below!</div>", unsafe_allow_html=True)
        else:
            for msg in st.session_state.chat_history:
                if msg["source"] == "user":
                    st.markdown(f"<div class='user-message'><strong>You:</strong> {msg['message']}</div>", unsafe_allow_html=True)
                else:
                    st.markdown(f"<div class='ai-message'><strong>AI:</strong> {msg['message']}</div>", unsafe_allow_html=True)
        st.markdown("</div>", unsafe_allow_html=True)
    
    # Display suggestion if available
    if st.session_state.trigger_output:
        st.markdown(
            f"<div class='trigger-suggestion'><strong>Suggested improvement:</strong> {st.session_state.trigger_output}</div>", 
            unsafe_allow_html=True
        )
        if st.button("Clear Suggestion"):
            st.session_state.trigger_output = ""
            st.rerun()

# ------------------------------------------------------------------
# Flashcards Page
# ------------------------------------------------------------------
def flashcards_page():
    # Header with navigation
    col1, col2 = st.columns([6, 1])
    with col1:
        st.markdown("<h1 class='main-header'>Vocabulary Flashcards</h1>", unsafe_allow_html=True)
    with col2:
        if st.button("← Back", key="back_button_flashcards"):
            change_page("main")

    st.write("Below are your available flashcards. Pick an option to update its schedule.")

    # If we don't have a card loaded, or user requested a new one, fetch from API
    if not st.session_state.current_flashcard or st.session_state.button_clicked:
        st.session_state.button_clicked = False
        card_response = call_show_card(st.session_state.email)
        if isinstance(card_response, dict):
            # We have a card
            st.session_state.current_flashcard = card_response
        else:
            # Could be "No learned data" or "No available cards"
            st.session_state.current_flashcard = None
            st.info(str(card_response))

    # Display the current flashcard if available
    if st.session_state.current_flashcard and isinstance(st.session_state.current_flashcard, dict):
        card = st.session_state.current_flashcard
        with st.container():
            st.subheader(f"Type: {card.get('type', '')}")
            st.write(f"**Title**: {card.get('title', '')}")
            st.write(f"**Description**: {card.get('description', '')}")
            st.write(f"**Question**: {card.get('question', '')}")
            st.write(f"**Answer**: {card.get('answer', '')}")

        st.write("### How well did you recall this card?")

        # Create columns for the four recall options
        colA, colB, colC, colD = st.columns(4)
        with colA:
            if st.button("AGAIN", key="flash_again"):
                update_result = call_update_card(st.session_state.email, card["title"], "AGAIN")
                st.session_state.button_clicked = True
                st.rerun()
        with colB:
            if st.button("HARD", key="flash_hard"):
                update_result = call_update_card(st.session_state.email, card["title"], "HARD")
                st.session_state.button_clicked = True
                st.rerun()
        with colC:
            if st.button("GOOD", key="flash_good"):
                update_result = call_update_card(st.session_state.email, card["title"], "GOOD")
                st.session_state.button_clicked = True
                st.rerun()
        with colD:
            if st.button("EASY", key="flash_easy"):
                update_result = call_update_card(st.session_state.email, card["title"], "EASY")
                st.session_state.button_clicked = True
                st.rerun()

# ------------------------------------------------------------------
# Run the appropriate page based on session state
# ------------------------------------------------------------------
if st.session_state.current_page == "main":
    main_page()
elif st.session_state.current_page == "chat":
    chat_page()
elif st.session_state.current_page == "flashcards":
    flashcards_page()
