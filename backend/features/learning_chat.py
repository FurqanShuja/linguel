from data import (
    get_prompt,
    get_chat_history,
    update_chat_history,
    get_learned_data
)
from features import get_response
import json

def analyze_message_content(message: str) -> dict:
    """
    Analyze a message (user or AI) and extract German vocabulary and grammar elements.
    
    Args:
        message (str): The message to analyze
        
    Returns:
        dict: A dictionary with 'grammar' and 'vocabulary' fields containing German elements and their English translations
    """
    try:
        prompt_analyze = get_prompt(
            identifier="ANALYZE_MESSAGE_CONTENT",
            replacements={
                "message": message
            }
        )
        
        # Get response from LLM
        response = get_response(prompt_analyze)
        print(f"Raw LLM response for analysis: {response}")
        
        # Try to parse the JSON response
        try:
            # Clean the response - remove any potential markdown formatting
            cleaned_response = response.strip()
            if cleaned_response.startswith('```json'):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.endswith('```'):
                cleaned_response = cleaned_response[:-3]
            cleaned_response = cleaned_response.strip()
            
            print(f"Cleaned response: {cleaned_response}")
            
            analysis = json.loads(cleaned_response)
            # Ensure the response has the expected structure
            if not isinstance(analysis, dict) or 'grammar' not in analysis or 'vocabulary' not in analysis:
                print("Invalid analysis structure, returning empty analysis")
                return {"grammar": {}, "vocabulary": {}}
            
            print(f"Parsed analysis: {analysis}")
            return analysis
        except json.JSONDecodeError as e:
            # If JSON parsing fails, return empty structure
            print(f"JSON decode error: {e}")
            print(f"Failed to parse response: {response}")
            return {"grammar": {}, "vocabulary": {}}
            
    except ValueError as e:
        print(f"Error analyzing message content: {e}")
        return {"grammar": {}, "vocabulary": {}}

def learning_chat_with_analysis(user_input: str, email: str, situation: str) -> dict:
    """
    Performs the learning chat sequence with analysis.
    1. Retrieve the user's existing chat history.
    2. Fetch all learned data, parse out Vocabulary vs. Grammar titles.
    3. Generate a first response using the prompt 'GENERATE_RESPONSE'.
    4. Generate a second response using the prompt 'REPLACE_RESPONSE'.
    5. Analyze both user input and AI response for German content.
    6. Update chat history with the final messages including analysis.
    7. Return the final response along with analysis data.
    
    Args:
        user_input (str): The user's question or statement.
        email (str): The email address identifying the user.
        situation (str): The learning or conversational context.
    
    Returns:
        dict: A dictionary containing the AI response, user analysis, and AI analysis
    """
    # Get chat history
    chat_history = get_chat_history(email)
    
    # Get learned data
    learned_items = get_learned_data(email)
    vocabulary_titles = [item["title"] for item in learned_items if item["type"] == "Vocabulary"]
    grammar_titles    = [item["title"] for item in learned_items if item["type"] == "Grammar"]
    
    vocab_string   = ", ".join(vocabulary_titles)
    grammar_string = ", ".join(grammar_titles)
    
    # Generate first response
    try:
        prompt_generate = get_prompt(
            identifier="GENERATE_RESPONSE",
            replacements={
                "userMessage": user_input,
                "situation": situation
            }
        )
        print(f"Prompt generate: {prompt_generate}")
    except ValueError as e:
        return {"error": f"Error retrieving prompt: {e}"}
    
    first_response = get_response(prompt_generate)
    
    # Generate final response
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
        return {"error": f"Error retrieving prompt: {e}"}
    
    final_response = get_response(prompt_replace)
    print(f"Final model response: {final_response}")
    
    # Analyze message content
    user_analysis = analyze_message_content(user_input)
    ai_analysis = analyze_message_content(final_response)
    
    # Update chat history
    new_messages = chat_history + [
        {
            "message": user_input, 
            "source": "user",
            "grammar": user_analysis.get("grammar", {}),
            "vocabulary": user_analysis.get("vocabulary", {})
        },
        {
            "message": final_response, 
            "source": "ai",
            "grammar": ai_analysis.get("grammar", {}),
            "vocabulary": ai_analysis.get("vocabulary", {})
        }
    ]
    update_chat_history(email, new_messages)
    
    return {
        "response": final_response,
        "user_analysis": user_analysis,
        "ai_analysis": ai_analysis
    }

# --------------------------------------------------------------------------------
# Command-Line Usage Example
# --------------------------------------------------------------------------------
if __name__ == "__main__":
    test_user_input = "How do I form the perfect tense in German?"
    test_email = "test_user@gmail.com"
    test_situation = "Learning basic German grammar"

    result = learning_chat_with_analysis(user_input=test_user_input, email=test_email, situation=test_situation)
    print("\n----- End of learning_chat_with_analysis script -----")
    print(f"Final output:\n{result}")
