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

def get_learned_data(email):
    """
    Retrieves all learned data for the specified email from data/user_data.json.
    
    Args:
        email (str): The email address for which to retrieve learned data.
    
    Returns:
        list: A list of dictionaries representing the learned data for the email.
              If the file doesn't exist or the email isn't found, returns an empty list.
    """
    file_path = os.path.join("data", "user_data.json")
    
    if not os.path.exists(file_path):
        return []
    
    with open(file_path, "r", encoding="utf-8") as f:
        user_data = json.load(f)
    
    return user_data.get(email, [])


def add_learned_data(email, data_to_add):
    """
    Appends new learned data for the specified email in data/user_data.json.
    
    Args:
        email (str): The email address for which to add learned data.
        data_to_add (list): A list of dictionaries (each containing learned data fields
                            like "type", "title", "description", "question", "answer",
                            "available_timedate", and "visit_count").
    """
    file_path = os.path.join("data", "user_data.json")
    
    # Load existing user data or initialize if the file doesn't exist
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            user_data = json.load(f)
    else:
        user_data = {}
    
    # If the email does not exist in user_data, initialize it with an empty list
    if email not in user_data:
        user_data[email] = []
    
    # Extend the user's data with the new entries
    user_data[email].extend(data_to_add)
    
    # Write the updated data back to the JSON file
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(user_data, f, indent=4)

def update_learned_data(email, title, available_timedate, visit_count):
    """
    Updates an existing learned data entry for a specified email and title,
    changing its available_timedate and visit_count values.

    Args:
        email (str): The email address for which to update learned data.
        title (str): The title identifying which item to update.
        available_timedate (str): The new available date/time string.
        visit_count (int): The new visit count value.

    Returns:
        str: "Update Successful" if the item was found and updated,
             otherwise "Update Failed: Item not found."
    """
    file_path = os.path.join("data", "user_data.json")
    
    # Load existing user data or initialize if the file doesn't exist
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            user_data = json.load(f)
    else:
        return "Update Failed: No user_data.json file found."

    # Check if this email exists in user_data
    if email not in user_data:
        return "Update Failed: Email not found."

    # Find the item with the matching title
    updated = False
    for item in user_data[email]:
        if item.get("title") == title:
            # Update the needed fields
            item["available_timedate"] = available_timedate
            item["visit_count"] = visit_count
            updated = True
            break

    if not updated:
        return "FAIL"

    # Write updated data back to JSON
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(user_data, f, indent=4)

    return "SUCCESS"


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

    # Get all learned data for a user
    email_to_retrieve = "ankit2@gmail.com"
    learned_data = get_learned_data(email_to_retrieve)
    print(f"Learned data for {email_to_retrieve}:")
    print(learned_data)
    
    # Add new learned data for a user
    new_data = [
        {
            "type": "Vocabulary",
            "title": "Das Buch",
            "description": "Replacing 'book' with its German equivalent.",
            "question": "He reads a book.",
            "answer": "He reads a Buch.",
            "available_timedate": "2025-03-26 10:00:00",
            "visit_count": 1
        }
    ]
    add_learned_data(email_to_retrieve, new_data)
    
    # Verify that the new data has been appended
    updated_learned_data = get_learned_data(email_to_retrieve)
    print(f"\nUpdated learned data for {email_to_retrieve}:")
    print(updated_learned_data)
