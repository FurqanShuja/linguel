# practice_flashcards.py

import datetime
from dateutil import parser  # pip install python-dateutil if needed

# Import your existing functions from the data module
from data import (
    get_learned_data,
    update_learned_data
)

def new_card(email: str):
    """
    Retrieves the first 'available' card for the given email address.
    A card is considered 'available' if the current datetime is >=
    the 'available_timedate' of the card.

    Args:
        email (str): The user's email address.

    Returns:
        dict or str:
            - A dictionary representing the first available learned data item,
              if found.
            - "No available cards" if none are currently available.
            - "No learned data" if the user has no data at all.
    """
    learned_items = get_learned_data(email)
    if not learned_items:
        return "No learned data"

    # Current time
    now = datetime.datetime.now()

    for item in learned_items:
        # Parse the available_timedate from string to datetime
        try:
            available_time = parser.parse(item.get("available_timedate", ""))
        except (parser.ParserError, TypeError):
            # If there's an error parsing, treat this item as not available
            continue

        # If the card is now available or overdue, return it
        if available_time <= now:
            return item

    # If no item meets the availability requirement
    return "No available cards"

def update_card(email: str, title: str, option_selected: str) -> str:
    """
    Updates a learned data card based on the user's recall quality.
    The next availability time is calculated as:
        base_minutes = (AGAIN=1, HARD=10, GOOD=100, EASY=1000)
        next_interval = base_minutes * (visit_count + 1) [in minutes]
    
    Steps:
        - Find the card by its title.
        - Increment its visit_count.
        - Set its available_timedate to the current time + next_interval minutes.
        - Use update_learned_data to save changes.

    Args:
        email (str): The user's email address.
        title (str): The title of the learned data to update.
        option_selected (str): One of "AGAIN", "HARD", "GOOD", or "EASY".

    Returns:
        str: "SUCCESS" if the update was successful, or "FAIL" if the card wasn't found.
    """
    # Map user choices to base minutes
    option_map = {
        "AGAIN": 1,
        "HARD": 10,
        "GOOD": 100,
        "EASY": 1000
    }

    # Default to 1 minute if the provided option is invalid
    base_minutes = option_map.get(option_selected.upper(), 1)

    learned_items = get_learned_data(email)
    if not learned_items:
        return "FAIL"

    # Find the target item
    for item in learned_items:
        if item.get("title") == title:
            old_count = item.get("visit_count", 0)
            new_count = old_count + 1

            # Calculate new availability
            now = datetime.datetime.now()
            next_interval_minutes = base_minutes * new_count
            new_available_time = now + datetime.timedelta(minutes=next_interval_minutes)
            
            # Format as ISO string (YYYY-MM-DD HH:MM:SS) or your preferred format
            new_available_str = new_available_time.strftime("%Y-%m-%d %H:%M:%S")

            # Update the data
            result = update_learned_data(
                email=email,
                title=title,
                available_timedate=new_available_str,
                visit_count=new_count
            )
            return result

    return "FAIL"

# Example usage
if __name__ == "__main__":
    user_email = "test_user@gmail.com"

    # 1) Retrieve a new card
    card = new_card(user_email)
    print(f"New card for {user_email}: {card}")

    # 2) Update the card with a user's recall quality
    if isinstance(card, dict):
        update_result = update_card(
            email=user_email,
            title=card["title"],
            option_selected="GOOD"  # or AGAIN / HARD / EASY
        )
        print(f"Update result: {update_result}")
