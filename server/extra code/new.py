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
    'pr_associated',  
    'comment_priority',  
    'top_labels',  
    'Top_label_1',  
    'Top_label_2',  
    'Top_label_3',  
    'priority'  
]

# def clean_data(data):
#     illegal_char_pattern = re.compile(r'\W')
#     for key in data:
#         if isinstance(data[key], str):
#             data[key] = illegal_char_pattern.sub(' ', data[key])

def clean_data(data):
    illegal_char_pattern = re.compile(r'\W')
    for key in data:
        if isinstance(data[key], str):
            # Exclude the 'assignees' field from cleaning
            if key != 'assignees':
                data[key] = illegal_char_pattern.sub(' ', data[key])
        elif isinstance(data[key], list):
            # Clean each string element in the list
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
    

# def consolidate_priority(issues, label_mapping, include_priority_labels):
#     for issue in issues:
#         issue['priority'] = ''  # Set the "priority" field to an empty string for all issues
#     return issues

def consolidate_priority(issues):
    filtered_issues = []
    for issue in issues:
        # labels = [label for label in issue['label_names']]
        # has_priority_label = any(label in labels for label in include_priority_labels)
        # if has_priority_label:
            for priority in issue['priority']:
                # if any(label in labels for label in label_categories):
                issue['priority'] = priority
                filtered_issues.append(issue)
                break
    return filtered_issues
# Function to preprocess data and make predictions
def predict_priority(issue,predicted_priorities):
    # Clean data
    clean_data(issue)
    
    # Extract subfields
    subfields = extract_subfields(issue)
    issue.update(subfields)
    
    # Check for associated pull request
    issue['pr_associated'] = has_associated_pull_request(issue)
    
    # Align with the training data (drop irrelevant columns)
    columns_to_drop = ['id', 'updated_at', 'created_at', 'closed_at', 'title', 'state', 'assignee_names', 'label_names']
    issue_data = pd.DataFrame([issue])
    issue_data = issue_data.drop(columns=columns_to_drop)
    
    # Use the trained model for prediction
    X_sample = issue_data.drop('priority', axis=1)
    predicted_priority = model.predict(X_sample)
    
    # Map the predicted priority to the range [1, 2, 3]
    predicted_priority = int(predicted_priority[0]) 

    # Add the predicted priority to the issue
    issue['predicted_priority'] = int(predicted_priority[0])
    # predicted_priorities.append(issue['predicted_priority'])
    # issue['predicted_priority'] = mapped_priority
    
    print(f"Predicted priority for issue {issue['id']}: {issue['predicted_priority']}")
    return issue

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
    predicted_priorities = [] 
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
    # predict_priority(issues)
     # Make predictions for each issue
    issues_with_predictions = [predict_priority(issue, predicted_priorities) for issue in issues]
     # Print predicted priorities separately
    print("Predicted Priorities:")
    for i, issue in enumerate(issues_with_predictions):
        print(f"Issue {i+1} - Predicted Priority: {issue['predicted_priority']}")
    # print(f"Predicted priorities for all issues: {predicted_priorities}")

    return issues_with_predictions
    # return issues

# Endpoint for predicting priority based on issues from a repository
@app.route('/predict', methods=['POST'])
def predict():
    try:
        if request.is_json:
            # Get repository owner and name from the JSON payload
            data = request.get_json()
            repo_owner = data.get('repo_owner')
            repo_name = data.get('repo_name')
            # print('1')
            # Fetch issues from the specified repository
            issues = fetch_issues_from_repo(repo_owner, repo_name)
            predicted_priorities = consolidate_priority(issues)
            # if issues:
                # # Preprocess the data
                # df = pd.DataFrame(issues)
                # clean_data(df)
                # print('2')
                # # Align the columns with the training data
                # columns_to_drop = ['id', 'updated_at', 'created_at', 'closed_at', 'title', 'state', 'assignee_names', 'label_names']
                # df = df.drop(columns=columns_to_drop)
                # print('3')
                # # Use the trained model for prediction
                # X_sample = df.drop('priority', axis=1)
                # predicted_priority = model.predict(X_sample)
                # print('4')
                # # Add the predicted priorities to the issues
                # for i, priority in enumerate(predicted_priority):
                #     issues[i]['predicted_priority'] = int(priority)
                #     print(f"Predicted priority for issue {i+1}: {priority}")
                #     print('5')
                #  # Print or log the issues with predicted priorities
                # print(f"Issues with predicted priorities: {issues}") 
                # return jsonify({"issues": issues})
                 # Make predictions for each issue
            issues_with_predictions = [predict_priority(issue) for issue in issues]
            print(f"Issues with predicted priorities: {issues_with_predictions}") 
                
            return jsonify({"issues": issues_with_predictions})
                # Print or log the issues with predicted priorities
                # print(f"Issues with predicted priorities: {issues_with_predictions}") 
            # else:
            #     return jsonify({"error": "No issues found for the specified repository"})
        else:
            return jsonify({"error": "The request payload is not in JSON"})
    except Exception as e:
        return jsonify({'error': str(e)})
    
if __name__ == '__main__':
    app.run(debug=True)



