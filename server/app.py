from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import LeaveOneOut, train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from collections import defaultdict
import pickle

app = Flask(__name__)
CORS(app)


model = pickle.load(open('model.pkl', 'rb'))

def preprocess_data(df):
    columns_to_drop = ['id', 'updated_at', 'created_at', 'closed_at', 'title', 'top_labels', 'state', 'assignee_names', 'label_names']
    df = df.drop(columns=columns_to_drop)

    labeled_data = df[df['priority'].notnull()]
    unlabeled_data = df[df['priority'].isnull()]

    X = df.drop('priority', axis=1)
    Y = labeled_data['priority']

    return X, Y, labeled_data, unlabeled_data

def train_model(X_train_combined, y_train_combined, model):
    model.fit(X_train_combined, y_train_combined)
    return model

def predict_with_trained_model(model, X_eval):
    return model.predict(X_eval)

def map_priority_to_label(prediction):
    if prediction == 1:
        return "High"
    elif prediction == 2:
        return "Medium"
    elif prediction == 3:
        return "Low"
    else:
        return "Unknown"
def evaluate_model(y_eval, newpred):
    accuracy = accuracy_score(y_eval, newpred)
    confusion_mat = confusion_matrix(y_eval, newpred)
    classification_rep = classification_report(y_eval, newpred)
    return accuracy, confusion_mat, classification_rep

def leave_one_out_cv(models, X_train_combined, y_train_combined):
    loo = LeaveOneOut()
    accuracy_scores = defaultdict(list)

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

    return accuracy_scores

@app.route('/check', methods=['GET'])
def hi():
    return jsonify({"Success": "Granted"})

@app.route('/train_and_evaluate', methods=['POST'])
def train_and_evaluate_model():
    try:
         # Set the content type to JSON
        if request.is_json:
            data = request.get_json()
        else:
            return jsonify({"error": "Invalid content type. Use 'application/json'."}), 415
        # Get the data from the request
        data = request.get_json()
        df = pd.DataFrame(data)
        print('Dataframe shape: ', df.shape)
        print("received data: ", df.head)
        print(df.head())
        # Preprocess the data
        X, Y, labeled_data, unlabeled_data = preprocess_data(df)

        # Train the initial model on labeled data
        initial_model = RandomForestClassifier(n_estimators=100, random_state=101)
        X_train, X_test, Y_train, Y_test = train_test_split(X, Y, test_size=0.2, random_state=101)
        initial_model.fit(X_train, Y_train)

        # Pseudo-Labeling and Model Update
        num_iterations = 3
        predicted_priorities = [] 
        for iteration in range(num_iterations):
            unlabeled_features = unlabeled_data.drop('priority', axis=1)
            pseudo_labels = initial_model.predict(unlabeled_features)

            pseudo_labeled_data = unlabeled_data.copy()
            pseudo_labeled_data['priority'] = pseudo_labels

            combined_data = pd.concat([labeled_data, pseudo_labeled_data], ignore_index=True)

            X_train_combined = combined_data.drop('priority', axis=1)
            y_train_combined = combined_data['priority']

            # Train the model with the combined data
            initial_model = train_model(X_train_combined, y_train_combined, initial_model)

        # Evaluate the model
        X_eval = df.drop('priority', axis=1)
        y_eval = df['priority']
        newpred = predict_with_trained_model(initial_model, X_eval)
        print("Predictions:", newpred)
        accuracy, confusion_mat, classification_rep = evaluate_model(y_eval, newpred)
        predicted_priorities.extend(newpred)
        # Cross-Validation
        n_splits = 5
        models_to_evaluate = {'RandomForestClassifier': RandomForestClassifier()}
        cv_results = leave_one_out_cv(models_to_evaluate, X_train_combined, y_train_combined)

        
        # Map the predicted priority to labels
        # priority_label = map_priority_to_label(newpred[0])
        priority_labels = [map_priority_to_label(priority) for priority in predicted_priorities]
        print("Predicted Priority Label:", priority_labels)

        return jsonify({'priority_label': priority_labels})

    except Exception as e:
        return jsonify({'error': str(e)})


if __name__ == '__main__':
    app.run(debug=True)
