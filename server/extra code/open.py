import pickle
with open('model.pkl', 'rb') as file:
    my_object = pickle.load(file)
    print(my_object)