import pickle
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from datetime import datetime
import re
import statistics
import os

app = Flask(__name__)
CORS(app)
#get the access token
access_token = os.getenv("GITHUB_ACCESS_TOKEN")

# Load the pre-trained model
model = pickle.load(open('model.pkl', 'rb'))


# Define the desired fields and subfields for issues
desired_fields = [
    'id',
    'title',
    'state',
    'created_at',
    'updated_at',
    'closed_at',
    'comments',
    'assignees',
    'labels',
    'pr_associated',  # New column for PR association
    'comment_priority',  # New column for comment priority
    'top_labels',  # New column for top 3 labels
    'Top_label_1',  # New column for label 1 encoding
    'Top_label_2',  # New column for label 2 encoding
    'Top_label_3',  # New column for label 3 encoding
    'priority'  # New column for consolidated priority levels (1 for high, 2 for normal, 3 for low)
]

def clean_data(data):
    illegal_char_pattern = re.compile(r'\W')
    for key in data:
        if isinstance(data[key], str):
            # Exclude the 'assignees' field from cleaning
            # if key != 'assignees':
            data[key] = illegal_char_pattern.sub(' ', data[key])
        elif isinstance(data[key], list):
            # Clean each string element in the list
            data[key] = [illegal_char_pattern.sub(' ', element) for element in data[key]]


def extract_subfields(issue):
    assignees = issue.get('assignees', [])
    return {
        'assignee_names': [assignee['login'] for assignee in issue['assignees']],
        'assignee_count': len(issue['assignees']),
        'label_names': [label['name'] for label in issue['labels']],
        'label_count': len(issue['labels'])
    }

def has_associated_pull_request(issue):
    return 1 if 'pull_request' in issue else 0

def calculate_comment_priority(issues):
    comment_counts = [issue['comments'] for issue in issues]
    
    # Print or log the comment_counts list
    # print(f"Comment Counts: {comment_counts}")
    
    if not comment_counts or len(comment_counts) == 0:
        # Handle the case when there are no comments
        for issue in issues:
            issue['comment_priority'] = 3
        return

    median_comments = statistics.median(comment_counts)
    
    for issue in issues:
        if issue['comments'] > median_comments:
            issue['comment_priority'] = 1
        elif issue['comments'] == median_comments:
            issue['comment_priority'] = 2
        else:
            issue['comment_priority'] = 3

    for issue in issues:
        print(f"Comment priority for issue {issue['id']}: {issue['comment_priority']}")


def calculate_top_labels(issues):
    label_counts = {}
    for issue in issues:
        for label in issue['label_names']:
            if label in label_counts:
                label_counts[label] += 1
            else:
                label_counts[label] = 1

    top_labels = sorted(label_counts, key=label_counts.get, reverse=True)[:3]

    for issue in issues:
        issue['top_labels'] = top_labels
        for i, label in enumerate(top_labels):
            issue[f'Top_label_{i+1}'] = 1 if label in issue['label_names'] else 0

    for issue in issues:
        print(f"Top labels for issue {issue['id']}: {issue['top_labels']}")



# Function to fetch issues from a repository
def fetch_issues_from_repo(repo_owner, repo_name, state='all', per_page=10, max_issues=10):
    # Same logic as your data retrieval script
    base_url = f'https://api.github.com/repos/{repo_owner}/{repo_name}/issues'
    params = {
        'state': state,
        'per_page': per_page,
        'page': 1
    }
    headers = {
        'Authorization': f'token {access_token}'
    }
    issues = []
    # predicted_priorities = [] 
    issues_saved = 0

    while issues_saved < max_issues:
        response = requests.get(base_url, params=params, headers=headers)

        if response.status_code == 200:
            new_issues = response.json()
            
            for issue in new_issues:
                created_at = datetime.strptime(issue['created_at'], '%Y-%m-%dT%H:%M:%SZ')
                if issues_saved < max_issues:
                    data = {
                        'id': issue['id'],
                        'title': issue['title'],
                        'state': issue['state'],
                        'created_at': issue['created_at'],
                        'updated_at': issue['updated_at'],
                        'closed_at': issue['closed_at'],
                        'comments': issue['comments'],
                        #new 
                        'priority': '',
                    }
                    data.update(extract_subfields(issue))
                    data['pr_associated'] = has_associated_pull_request(issue)
                    issues.append(data)
                    issues_saved += 1
                    # Print or log only the relevant fields
                    print(f"Issue {issues_saved}: {data}")

                if 'rel="next"' not in response.headers.get('Link', ''):
                    print("No next link found. Breaking out of loop.")
                    break
            params['page'] += 1
        else:
            print(f"Failed to retrieve issues. Status code: {response.status_code}")
            print(f"Response content: {response.content}")
            break

    calculate_comment_priority(issues)
    calculate_top_labels(issues)
    # print_priority(issues)
    for issue in issues:
        predicted = predict_priority(issue)
        print(f"Priority for issue {issue['id']}: {predicted}")

# Function to preprocess data and make predictions
# def print_priority(issue):
#     print(f"Priority for issue {issue['id']}: {issue['priority']}")  

def predict_priority(issue):
    # Define the columns for input features
    input_columns = ['comments', 'assignee_count', 'label_count', 'pr_associated', 'comment_priority', 'Top_label_1', 'Top_label_2', 'Top_label_3']

    # Define the columns for output feature
    output_column = 'priority'
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
            # Get repository owner and name from the JSON payload
            data = request.get_json()
            repo_owner = data.get('repo_owner')
            repo_name = data.get('repo_name')

            # Fetch issues from the specified repository
            issues = fetch_issues_from_repo(repo_owner, repo_name)

            # Use the model to predict priorities for each issue

            # Use the model to predict priorities for each issue
            issues_with_predictions = [predict_priority(issue) for issue in issues]
            # for issue in issues:
            #     predicted = predict_priority(issue)
            #     print(f"Priority for issue {issue['id']}: {predicted}")

            return jsonify({"issues": issues_with_predictions})

        else:
            return jsonify({"error": "The request payload is not in JSON"})
    except Exception as e:
        return jsonify({'error': str(e)})
    


if __name__ == '__main__':
    app.run(debug=True)