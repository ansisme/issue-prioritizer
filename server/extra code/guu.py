import pickle
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import re
import os

app = Flask(__name__)
CORS(app)

# Get the access token
access_token = os.getenv("GITHUB_ACCESS_TOKEN")

# Load the pre-trained model
model = pickle.load(open('model.pkl', 'rb'))


def clean_data(data):
    illegal_char_pattern = re.compile(r'\W')
    for key in data:
        if isinstance(data[key], str):
            data[key] = illegal_char_pattern.sub(' ', data[key])
        elif isinstance(data[key], list):
            data[key] = [illegal_char_pattern.sub(' ', element) for element in data[key]]


def extract_subfields(issue):
    return {
        'assignee_names': [assignee['login'] for assignee in issue['assignees']],
        'assignee_count': len(issue['assignees']),
        'label_names': [label['name'] for label in issue['labels']],
        'label_count': len(issue['labels'])
    }


def has_associated_pull_request(issue):
    return 1 if 'pull_request' in issue else 0


def fetch_issues_from_repo(repo_owner, repo_name, state='all', per_page=10, max_issues=10):
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
    issues_saved = 0

    while issues_saved < max_issues:
        response = requests.get(base_url, params=params, headers=headers)

        if response.status_code == 200:
            new_issues = response.json()

            for issue in new_issues:
                if issues_saved < max_issues:
                    data = {
                        'id': issue['id'],
                        'title': issue['title'],
                        'priority': '',
                    }
                    data.update(extract_subfields(issue))
                    data['pr_associated'] = has_associated_pull_request(issue)
                    issues.append(data)
                    issues_saved += 1

            if 'rel="next"' not in response.headers.get('Link', ''):
                break
            params['page'] += 1
        else:
            print(f"Failed to retrieve issues. Status code: {response.status_code}")
            print(f"Response content: {response.content}")
            break

    return issues


def predict_priority(issue):
    try:
        clean_data(issue)

        subfields = extract_subfields(issue)
        issue.update(subfields)

        # Handle missing 'assignees' field
        assignees = issue.get('assignees', [])
        assignee_count = len(assignees)

        issue['assignees'] = assignees
        issue['assignee_count'] = assignee_count
        issue['pr_associated'] = has_associated_pull_request(issue)

        # Filter the DataFrame to include only relevant columns
        columns_to_keep = ['comments','assignee_count', 'label_count', 'pr_associated', 'comment_priority', 'Top_label_1', 'Top_label_2', 'Top_label_3']
        issue_data = pd.DataFrame([issue])[columns_to_keep]

        # Load the trained model
        loaded_model = pickle.load(open('model.pkl', 'rb'))

        # Predict priority using the loaded model
        predicted_priority = loaded_model.predict(issue_data)[0]

        # Print only the required information
        print(f"Issue Title: {issue['title']}")
        print(f"Issue ID: {issue['id']}")
        print(f"Predicted Priority: {int(predicted_priority)}")
        print("-----")

        return issue

    except Exception as e:
        print(f"Exception in predict_priority for issue {issue['id']}: {str(e)}")
        raise



@app.route('/fetch', methods=['POST'])
def fetch():
    try:
        if request.is_json:
            data = request.get_json()
            repo_owner = data.get('repo_owner')
            repo_name = data.get('repo_name')

            issues = fetch_issues_from_repo(repo_owner, repo_name)

            return jsonify({"issues": issues})
        else:
            return jsonify({"error": "The request payload is not in JSON"})
    except Exception as e:
        return jsonify({'error': str(e)})


@app.route('/predict', methods=['POST'])
def predict():
    try:
        if request.is_json:
            data = request.get_json()
            repo_owner = data.get('repo_owner')
            repo_name = data.get('repo_name')

            issues = fetch_issues_from_repo(repo_owner, repo_name)

            issues_with_predictions = [predict_priority(issue) for issue in issues]

            return jsonify({"issues": issues_with_predictions})
        else:
            return jsonify({"error": "The request payload is not in JSON"})
    except Exception as e:
        return jsonify({'error': str(e)})


if __name__ == '__main__':
    app.run(debug=True)
