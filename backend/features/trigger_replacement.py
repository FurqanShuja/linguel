# trigger_replacement.py

from data import (
    get_prompt,
    get_learned_data
)
from features import get_response

def trigger_replacement(user_input: str, email: str) -> str:
    """
    1. Retrieve the user's learned data from get_learned_data.
    2. Separate titles for Vocabulary and Grammar into comma-separated lists.
    3. Build a prompt using the 'TRIGGER_REPLACEMENT' identifier, 
       filling in the user_input, vocab, and grammar strings.
    4. Send the prompt to get_response and return the final output.
    
    Args:
        user_input (str): The user's input text.
        email (str): The user's email address (used to find learned data).
    
    Returns:
        str: The model's final output after applying 'TRIGGER_REPLACEMENT'.
    """
    # 1) Retrieve learned data for the user
    learned_items = get_learned_data(email)
    
    # 2) Separate titles by type
    vocabulary_titles = [item["title"] for item in learned_items if item["type"] == "Vocabulary"]
    grammar_titles    = [item["title"] for item in learned_items if item["type"] == "Grammar"]
    
    # Convert to comma-separated strings
    vocab_string   = ", ".join(vocabulary_titles)
    grammar_string = ", ".join(grammar_titles)
    
    # 3) Prepare the prompt for 'TRIGGER_REPLACEMENT'
    try:
        prompt_text = get_prompt(
            identifier="TRIGGER_REPLACEMENT",
            replacements={
                "userMessage": user_input,
                "vocabularyString": vocab_string,
                "grammarString": grammar_string
            }
        )
    except ValueError as exc:
        return f"Error retrieving prompt: {exc}"
    
    # 4) Get the model response for the constructed prompt
    final_output = get_response(prompt_text)
    
    # Return the final model response
    return final_output

if __name__ == "__main__":
    # Example usage:
    test_user_input = "Please correct this sentence with my known vocabulary and grammar."
    test_email = "test_user@gmail.com"
    
    result = trigger_replacement(test_user_input, test_email)
    print("\n--- trigger_replacement result ---")
    print(result)
