import requests
import time
import json
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8081/api"
DATA_SOURCE_ID = "YOUR_DATA_SOURCE_ID"  # Replace with actual ID

def log_processing_run(data_source_id, status, metrics=None):
    """
    Logs a processing run to the TracerTrail API.
    """
    url = f"{API_BASE_URL}/processing-runs"
    
    payload = {
        "data_source_id": data_source_id,
        "status": status,
        "started_at": datetime.utcnow().isoformat(),
        # "finished_at": ... (add when done)
    }
    
    if metrics:
        payload.update(metrics)
        
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        run_data = response.json()
        print(f"Logged run {run_data.get('id')} with status: {status}")
        return run_data
    except requests.exceptions.RequestException as e:
        print(f"Error logging run: {e}")
        return None

def update_datasource_metrics(data_source_id, metrics):
    """
    Updates the data source with new metrics (e.g., after a run).
    """
    url = f"{API_BASE_URL}/datasources/{data_source_id}"
    
    try:
        response = requests.put(url, json=metrics)
        response.raise_for_status()
        print(f"Updated metrics for data source {data_source_id}")
    except requests.exceptions.RequestException as e:
        print(f"Error updating data source: {e}")

def log_issue(data_source_id, title, description, severity="medium"):
    """
    Logs an issue found during processing.
    """
    url = f"{API_BASE_URL}/issues"
    
    payload = {
        "title": title,
        "description": description,
        "status": "open",
        "priority": severity,
        "related_entity_type": "datasource",
        "related_entity_id": data_source_id
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        issue = response.json()
        print(f"Logged issue: {issue.get('id')} - {title}")
        return issue
    except requests.exceptions.RequestException as e:
        print(f"Error logging issue: {e}")
        return None

# --- Example Usage in a Jupyter Notebook ---

if __name__ == "__main__":
    print("--- Starting Data Processing Job ---")
    
    # 1. Start the run
    run = log_processing_run(DATA_SOURCE_ID, "running")
    run_id = run.get('id') if run else None
    
    # Simulate processing work
    time.sleep(2)
    records_processed = 1500
    records_failed = 5
    
    # 2. Log an issue if failures detected
    if records_failed > 0:
        log_issue(
            DATA_SOURCE_ID, 
            "Data Quality Warning", 
            f"Found {records_failed} records with null emails during ingestion.",
            severity="low"
        )
    
    # 3. Update Data Source stats
    update_datasource_metrics(DATA_SOURCE_ID, {
        "status": "active",
        "records_processed": records_processed,
        "last_run_date": datetime.utcnow().isoformat()
    })
    
    # 4. Finish the run
    # (In a real scenario, you'd update the existing run, but for now we just log a completion or could update if PUT /processing-runs/{id} existed)
    # Since we implemented a basic POST, we can just log a "completed" event or similar, 
    # OR better, if we had PUT, we'd update it. 
    # For this example, let's assume we just wanted to log the start. 
    # If we want to log completion, we can create another entry or extend the API to support updates.
    # Given the current API, let's just print success.
    
    print("--- Job Completed ---")
