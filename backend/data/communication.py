# get prompts
# get login details for email address
# get chat history for email address
# update chat history for email address
# get learned data for email address
# updated learned data for email address


import json
import os

def get_prompt(identifier, replacements):
    """
    Retrieves a prompt template by its identifier from data/prompts.json,
    replaces placeholders with provided values, and returns the complete prompt.
    
    Args:
        identifier (str): The prompt identifier (e.g., "SUMMARIZE_MEMORY_INSTRUCTION").
        replacements (dict): A dictionary where keys correspond to the parameter names
                             (e.g., "userMessage", "retrievedChunks") and values are the strings
                             to replace the placeholders with.
                             
    Returns:
        str: The complete prompt with placeholders replaced by their respective values.
    
    Raises:
        ValueError: If the identifier is not found in the JSON file.
    """
    file_path = os.path.join("data", "prompts.json")
    with open(file_path, "r", encoding="utf-8") as f:
        prompts = json.load(f)
    
    if identifier not in prompts:
        raise ValueError(f"Prompt identifier '{identifier}' not found in prompts.json")
    
    # Assuming English template ("en")
    prompt_template = prompts[identifier]["prompt"]["en"]
    
    for key, value in replacements.items():
        placeholder = f"[[{key}]]"
        prompt_template = prompt_template.replace(placeholder, value)
    
    return prompt_template

def get_authentication(email):
    """
    Retrieves the password associated with the given email from data/auth.json.
    
    Args:
        email (str): The email address for which the password is needed.
    
    Returns:
        str: The password corresponding to the provided email.
    
    Raises:
        ValueError: If the email is not found in the authentication data.
    """
    file_path = os.path.join("data", "auth.json")
    with open(file_path, "r", encoding="utf-8") as f:
        auth_data = json.load(f)
    
    for entry in auth_data:
        if entry.get("email") == email:
            return entry.get("password")
    
    raise ValueError(f"Email '{email}' not found in authentication data")

def get_chat_history(email):
    """
    Retrieves the chat history for the given email address from data/chat_history.json.
    
    Args:
        email (str): The email address for which to retrieve the chat history.
    
    Returns:
        list: A list of dictionaries (each with "message" and "source") for the given email.
              If the email is not found or the file does not exist, an empty list is returned.
    """
    file_path = os.path.join("data", "chat_history.json")
    
    if not os.path.exists(file_path):
        return []
    
    with open(file_path, "r", encoding="utf-8") as f:
        chat_history = json.load(f)
    
    return chat_history.get(email, [])

def update_chat_history(email, messages):
    """
    Updates the chat history for the given email address in data/chat_history.json.
    
    Args:
        email (str): The email address for which to update the chat history.
        messages (list): A list of dictionaries, each containing "message" and "source".
    
    This function overwrites the existing history for the email with the provided messages.
    """
    file_path = os.path.join("data", "chat_history.json")
    
    # Load existing chat history or initialize if the file doesn't exist
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            chat_history = json.load(f)
    else:
        chat_history = {}
    
    chat_history[email] = messages
    
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(chat_history, f, indent=4)

if __name__ == "__main__":
    # Example usage for get_prompt:
    prompt_replacements = {
        "userMessage": "How can I integrate new modules into my system?",
        "retrievedChunks": "Module integration was discussed in the previous conversation."
    }
    try:
        complete_prompt = get_prompt("SUMMARIZE_MEMORY_INSTRUCTION", prompt_replacements)
        print("Completed Prompt:")
        print(complete_prompt)
    except ValueError as e:
        print(e)
    
    # Example usage for get_authentication:
    try:
        email = "ankit@gmail.com"
        password = get_authentication(email)
        print(f"\nPassword for {email}: {password}")
    except ValueError as e:
        print(e)
    
    # Example usage for get_chat_history:
    chat_email = "ankit@gmail.com"
    history = get_chat_history(chat_email)
    print(f"\nChat history for {chat_email}:")
    print(history)
    
    # Example usage for update_chat_history:
    new_messages = [
        {"message": "New message from user", "source": "user"},
        {"message": "New message from AI", "source": "ai"}
    ]
    update_chat_history(chat_email, new_messages)
    
    # Confirm update
    updated_history = get_chat_history(chat_email)
    print(f"\nUpdated chat history for {chat_email}:")
    print(updated_history)
