from data import (
    get_prompt,
    get_chat_history,
    update_chat_history,
    get_learned_data
)
from features import get_response

def learning_chat(user_input: str, email: str, situation: str) -> str:
    """
    1. Retrieve authentication for the user (as an example).
    2. Get the user's existing chat history (if needed).
    3. Fetch all learned data, parse out Vocabulary vs. Grammar titles.
    4. Generate a first response using the prompt 'GENERATE_RESPONSE'.
    5. Generate a second response using the prompt 'REPLACE_RESPONSE'.
    6. Optionally update chat history with the final messages.
    7. Return the final response.

    Args:
        user_input (str): The user's question or statement.
        email (str): The email address identifying the user.
        situation (str): The learning or conversational context.

    Returns:
        str: The final response generated after the second model call.
    """

    # --------------------------------------------------------------------------------
    # B) (Optional) Retrieve the user's existing chat history (example usage).
    # --------------------------------------------------------------------------------
    chat_history = get_chat_history(email)
    print(f"Current chat history for {email}: {chat_history}")

    # --------------------------------------------------------------------------------
    # C) Retrieve the user's learned data and separate titles by type.
    # --------------------------------------------------------------------------------
    learned_items = get_learned_data(email)
    vocabulary_titles = [item["title"] for item in learned_items if item["type"] == "Vocabulary"]
    grammar_titles    = [item["title"] for item in learned_items if item["type"] == "Grammar"]

    # Convert the lists to comma-separated strings for easy prompt insertion
    vocab_string   = ", ".join(vocabulary_titles)
    grammar_string = ", ".join(grammar_titles)

    # --------------------------------------------------------------------------------
    # D) Prompt 1: 'GENERATE_RESPONSE'
    # --------------------------------------------------------------------------------
    try:
        prompt_generate = get_prompt(
            identifier="GENERATE_RESPONSE",
            replacements={
                "userMessage": user_input,
                "situation": situation
            }
        )
    except ValueError as e:
        return f"Error retrieving prompt: {e}"

    # Generate the first response using the large language model
    first_response = get_response(prompt_generate)
    print(f"First model response:\n{first_response}\n")

    # --------------------------------------------------------------------------------
    # E) Prompt 2: 'REPLACE_RESPONSE'
    # Incorporate the first response and the user's learned Vocabulary/Grammar titles.
    # --------------------------------------------------------------------------------
    try:
        prompt_replace = get_prompt(
            identifier="REPLACE_RESPONSE",
            replacements={
                "previousResponse": first_response,
                "vocabularyString": vocab_string,
                "grammarString": grammar_string
            }
        )
    except ValueError as e:
        return f"Error retrieving prompt: {e}"

    final_response = get_response(prompt_replace)
    print(f"Final model response:\n{final_response}\n")

    # --------------------------------------------------------------------------------
    # F) (Optional) Update chat history with the new conversation data.
    # --------------------------------------------------------------------------------
    # We could, for example, append these messages to the existing history.
    new_messages = chat_history + [
        {"message": user_input, "source": "user"},
        {"message": first_response, "source": "ai"},
        {"message": final_response, "source": "ai"}
    ]
    update_chat_history(email, new_messages)

    # Return the final response from the second prompt
    return final_response

# --------------------------------------------------------------------------------
# H) Command-Line Usage Example
# --------------------------------------------------------------------------------
if __name__ == "__main__":
    test_user_input = "How do I form the perfect tense in German?"
    test_email = "test_user@gmail.com"
    test_situation = "Learning basic German grammar"

    result = learning_chat(user_input=test_user_input, email=test_email, situation=test_situation)
    print("\n----- End of learning_chat script -----")
    print(f"Final output:\n{result}")
