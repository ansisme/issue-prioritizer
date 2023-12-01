import pickle
import pandas as pd
from flask import Flask, request, jsonify

app = Flask(__name__)

# Load the pre-trained model
model = pickle.load(open('model.pkl', 'rb'))

# Define the columns for input features
input_columns = ['comments', 'assignee_count', 'label_count', 'pr_associated', 'comment_priority', 'Top_label_1', 'Top_label_2', 'Top_label_3']

# Define the columns for output feature
output_column = 'priority'

# Function to preprocess data and make predictions
def predict_priority(issue):
    try:
        # Align with the training data (drop irrelevant columns)
        columns_to_drop = ['id', 'updated_at', 'created_at', 'closed_at', 'title', 'state', 'assignee_names', 'label_names', 'top_labels']
        issue_data = pd.DataFrame([issue])
        issue_data = issue_data.drop(columns=columns_to_drop)

        # Use the trained model for prediction
        predicted_priority = model.predict(issue_data[input_columns])[0]

        # Add the predicted priority to the issue
        issue[output_column] = int(predicted_priority)

        return issue

    except Exception as e:
        print(f"Exception in predict_priority for issue {issue['id']}: {str(e)}")
        raise  # Re-raise the exception to stop further execution

# Endpoint for predicting priority based on issues from a repository
@app.route('/predict', methods=['POST'])
def predict():
    try:
        if request.is_json:
            # Get issues data from the JSON payload
            data = request.get_json()

            # Assume 'issues' is a list of dictionaries, each representing an issue
            issues = data.get('issues', [])

            # Use the model to predict priorities for each issue
            issues_with_predictions = [predict_priority(issue) for issue in issues]
            
            return jsonify({"issues": issues_with_predictions})
            

        else:
            return jsonify({"error": "The request payload is not in JSON"})
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)
