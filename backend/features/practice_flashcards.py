#1. send a request with bool (fresh_start: true means the user opened first time) and previous_action: AGAIN/HARD/GOOD/EASY and previous_id: 'itemid'
#2. middle login: if fresh start is to be shown, randomly show the one which is within time bound. if fresh_start is false, check the previous id and action and update the next available time (again:1 hard:10 good:100 easy:1000 x count *in minutes*) and count++ and then show the item randomly which is available
#3. output a json of the new item (type, english word, german word, example OR english phrase, german phrase, example)


'''
new_card:
input: email address
action: get_learned_data, select the first card which is available and return
output: select a card and return

update_card:
input: email address, title, option_selected: AGAIN/HARD/GOOD/EASY
action: get_learned_data, based on option_selected time_available will be (again:1 hard:10 good:100 easy:1000 x count *in minutes*) and count++, then update_learned_data
output: SUCCESS or FAIL
'''