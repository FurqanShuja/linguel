# trigger_replacement.py
from datetime import datetime
import json
import re
from data import (
    get_prompt,
    get_learned_data,
    add_learned_data
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

def create_card_for_replacement(trigger_replacement_str: str, email: str) -> str:
    """
    Generates a learned data flashcard from a replacement suggestion string provided by LLM, 
    enriches it with the current timestamp and visit count, then saves it using add_learned_data.

    Args:
        trigger_replacement_str (str): The replacement suggestion string (e.g., "Vocabulary: want -> möchte").
        email (str): The user's email address to associate the new card with.

    Returns:
        str: Success or error message.
    """
    try:
        prompt_generate = get_prompt(
            identifier="REPLACEMENT_TO_CARD",
            replacements={"trigger_replacement_str": trigger_replacement_str}
        )
    except ValueError as e:
        return f"Error retrieving prompt: {e}"

    # Generate the flashcard JSON using the large language model
    card_json_response = get_response(prompt_generate)
    print(f"LLM JSON response:\n{card_json_response}\n")

    # Remove markdown backticks and language annotations if present
    card_json_response = re.sub(r'^```json', '', card_json_response.strip())
    card_json_response = re.sub(r'```$', '', card_json_response.strip()).strip()

    try:
        # Parse the cleaned JSON response from the LLM
        card_data = json.loads(card_json_response)
    except json.JSONDecodeError as e:
        return f"Error parsing JSON response: {e}"

    # Ensure card_data is a dictionary
    if not isinstance(card_data, dict):
        return "Error: Card data is not a valid dictionary."

    # Add additional required fields
    card_data["available_timedate"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    card_data["visit_count"] = 0

    # Save the card data for the user
    add_learned_data(email, [card_data])

    return "Card created successfully!"

if __name__ == "__main__":
    # Example usage:
    test_user_input = "Please correct this sentence with my known vocabulary and grammar."
    test_email = "test_user@gmail.com"
    
    result = trigger_replacement(test_user_input, test_email)
    print("\n--- trigger_replacement result ---")
    print(result)
