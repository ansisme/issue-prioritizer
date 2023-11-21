from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from collections import defaultdict
import pickle

app = Flask(__name__)
CORS(app)

model = pickle.load(open('model.pkl', 'rb'))

# Sample data for prediction
sample_data = {
    "id": 1,
    "title": "Sample Issue 1",
    "state": "open",
    "created_at": "2023-11-21T12:00:00Z",
    "updated_at": "2023-11-21T14:30:00Z",
    "closed_at": None,
    "comments": 5,
    "assignee_names": [{"login": "user1"}, {"login": "user2"}],
    "assignees_count": 2,
    "label_names": [{"name": "bug"}, {"name": "enhancement"}],
    "label_count": 2,
    "pr_associated": 1,
    "comment_priority": 2,
    "top_labels": ["bug", "enhancement"],
    "Top_label_1": 1,
    "Top_label_2": 1,
    "Top_label_3": 0,
    # "priority":  # The actual priority will be predicted
}

# Preprocess the sample data
sample_df = pd.DataFrame(sample_data, index=[0])

@app.route('/predict_sample', methods=['GET'])
def predict_sample():
    try:
        # Predict priority for the sample data
        X_sample = sample_df.drop('priority', axis=1)
        predicted_priority = model.predict(X_sample)

        return jsonify({"predicted_priority": int(predicted_priority[0])})
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)
