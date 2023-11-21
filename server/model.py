from collections import defaultdict
import pickle
import pandas as pd
import numpy as np
from sklearn.model_selection import LeaveOneOut
from sklearn.metrics import accuracy_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

df = pd.read_excel('combined_issues.xlsx')
df.head()
df.info()
df.describe()
print("Missing Values:")
print(df.isnull().sum())
columns_to_drop = ['id', 'updated_at', 'created_at','closed_at','title','top_labels', 'state', 'assignee_names', 'label_names']
df = df.drop(columns=columns_to_drop)

labeled_data = df[df['priority'].notnull()]
unlabeled_data = df[df['priority'].isnull()]
X = df.drop('priority', axis=1)
Y = labeled_data['priority']
X_train, X_test, Y_train, Y_test = train_test_split(X, Y, test_size=0.2, random_state=101)
model = RandomForestClassifier(n_estimators=100, random_state=101)
model.fit(X_train, Y_train)

pred = model.predict(X_test)

# Evaluate the model
accuracy = accuracy_score(Y_test, pred)
classification_rep = classification_report(Y_test, pred)

print(f"Accuracy: {accuracy:.2f}")
print("Classification Report:\n", classification_rep)

unlabeled_data = pd.read_excel('unlabelledData.xlsx')
unlabeled_data.shape

print("Missing Values:")
print(unlabeled_data.isnull().sum())

columns_to_drop = ['id', 'updated_at', 'created_at','closed_at','title','top_labels', 'state', 'assignee_names', 'label_names']
unlabeled_data = unlabeled_data.drop(columns=columns_to_drop)
unlabeled_data

df = df.reset_index(drop=True)
from sklearn.metrics import classification_report, confusion_matrix


num_iterations = 3

for iteration in range(num_iterations):
    #Pseudo-Labeling
    unlabeled_features = unlabeled_data.drop('priority', axis=1)
    pseudo_labels = model.predict(unlabeled_features)

    #new DataFrame for pseudo-labeled data
    pseudo_labeled_data = unlabeled_data.copy()
    pseudo_labeled_data['priority'] = pseudo_labels

    # Combine pseudo-labeled data with the labeled data for the next iteration
    combined_data = pd.concat([labeled_data, pseudo_labeled_data], ignore_index=True)
 


X_train_combined = combined_data.drop('priority', axis=1)
y_train_combined = combined_data['priority']


model = RandomForestClassifier(random_state=101)
model.fit(X_train_combined , y_train_combined)


X_eval = df.drop('priority', axis=1)
y_eval = df['priority']

newpred = model.predict(X_eval)
accuracy = accuracy_score(y_eval, newpred)
print(f'Iteration {iteration + 1} - Model Accuracy: {accuracy}')

print(confusion_matrix(y_eval, newpred))
print('\n')
print(classification_report(y_eval, newpred))

combined_data.tail()
combined_data.info()



# Define the number of folds for cross-validation
n_splits = 5

# Dictionary to store accuracy scores
accuracy_scores = defaultdict(list)

# Models to evaluate
models = {
    'RandomForestClassifier': RandomForestClassifier(),
}


# Leave-One-Out Cross-Validation

loo = LeaveOneOut()
accuracy_scores = {
    ('RandomForestClassifier', 'LeaveOneOut'): [],
   
}

# Fit the models outside the loop
for model in models.values():
    model.fit(X_train_combined, y_train_combined)

for train_index, test_index in loo.split(X_train_combined):
    X_train, X_test = X_train_combined.iloc[train_index], X_train_combined.iloc[test_index]
    y_train, y_test = y_train_combined.iloc[train_index], y_train_combined.iloc[test_index]

    for model_name, model in models.items():
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        accuracy_scores[(model_name, 'LeaveOneOut')].append(accuracy)

# Print average accuracy results
for (model_name, cv_type), accuracies in accuracy_scores.items():
    average_accuracy = sum(accuracies) / len(accuracies)
    print(f'{model_name} - {cv_type} - Average Accuracy: {average_accuracy:.2f}')

# Save model using pickle
pickle.dump(model, open('model.pkl','wb'))