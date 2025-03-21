import os
import time
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables from the .env file in the current directory.
load_dotenv()

# Configuration for the generation model
generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",
}

# Load the three API keys from the .env file
api_keys = [
    os.environ.get("GEMINI_API_KEY_1"),
    os.environ.get("GEMINI_API_KEY_2"),
    os.environ.get("GEMINI_API_KEY_3"),
]

# Global rate limit configuration (maximum requests per minute per API key)
max_req_per_minute = 10  # Change this value as needed

# Dictionary to track usage for each API key.
# Each entry holds the count and the reset time (in epoch seconds).
usage_stats = {
    0: {"count": 0, "reset_time": time.time() + 60},
    1: {"count": 0, "reset_time": time.time() + 60},
    2: {"count": 0, "reset_time": time.time() + 60},
}

def _update_usage_stats(key_index):
    """
    Checks and resets the counter for the given key index if the minute has passed.
    Then increments the usage count for that key.
    """
    current_time = time.time()
    if current_time > usage_stats[key_index]["reset_time"]:
        # Reset the counter and update the reset time to one minute from now.
        usage_stats[key_index]["count"] = 0
        usage_stats[key_index]["reset_time"] = current_time + 60
    usage_stats[key_index]["count"] += 1

def get_response(user_input):
    """
    Sends the user input to the Gemini model and returns the response text.
    It cycles through three API keys based on per-minute request limits.
    
    Args:
        user_input (str): The input message to send to the model.
    
    Returns:
        str: The response text from the model, or an error message if rate limits are exceeded.
    """
    global api_keys, usage_stats, max_req_per_minute

    # Try each API key in order
    for idx, api_key in enumerate(api_keys):
        current_time = time.time()
        # Reset usage count if the current time has passed the reset time
        if current_time > usage_stats[idx]["reset_time"]:
            usage_stats[idx]["count"] = 0
            usage_stats[idx]["reset_time"] = current_time + 60

        if usage_stats[idx]["count"] < max_req_per_minute:
            # Configure the API client with the selected key
            genai.configure(api_key=api_key)
            
            # Create the model and chat session using the current key
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash-8b",
                generation_config=generation_config,
            )
            chat_session = model.start_chat(history=[])
            
            # Send the message and update the usage stats
            response = chat_session.send_message(user_input)
            _update_usage_stats(idx)
            
            return response.text

    # If none of the keys can be used, return an error message
    return "ERROR: REQUESTS PER MINUTE EXCEEDED"

# Example usage:
if __name__ == "__main__":
    # Replace with your input text
    user_input = "INSERT_INPUT_HERE"
    
    result = get_response(user_input)
    print(result)
