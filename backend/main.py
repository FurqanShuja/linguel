from fastapi import FastAPI

app = FastAPI()

# Endpoint 1: Learning Chat
'''
1. send the scenario
2. middle login: fetch prompt for scenario for normal chat and chat response - lookup existing vocab/grammar list and replace if found - generate response
3. output str

It will also save chat history
'''

# Endpoint 2: Trigger Replacement
'''
1. send the user message
2. middle login: get the most similar german replacement vocab/grammar
3. output str
'''

# Endpoint 2: Save Replacement
'''
1. send the replacement text
2. middle login: generate its values and save in json format in json
3. output str
'''

# Endpoint 3: Check Practice Chat
'''
1. send the username/email address/user uuid
2. middle login: check if minimum vocabulary/grammer 100:100 ratio is acheived
3. output bool: true or false
'''

# Endpoint 4: Practice Chat
'''
1. send the user input
2. middle login: create output using only available list of vocabulary and grammer from a single call for now
3. output str
'''

# Endpoint 5: show card
'''
1. send a request with bool (fresh_start: true means the user opened first time) and previous_action: AGAIN/HARD/GOOD/EASY and previous_id: 'itemid'
2. middle login: if fresh start is to be shown, randomly show the one which is within time bound. if fresh_start is false, check the previous id and action and update the next available time (again:1 hard:10 good:100 easy:1000 x count *in minutes*) and count++ and then show the item randomly which is available
3. output a json of the new item (type, english word, german word, example OR english phrase, german phrase, example)
'''

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
