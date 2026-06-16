import requests
import base64
import pandas as pd
import os

# 🔧 CONFIG
ORG = "NOVAChemicalsDevOps"
PROJECT = "Information Technology"
PAT = os.getenv("AZURE_DEVOPS_PAT")

if not PAT:
    raise ValueError("Set AZURE_DEVOPS_PAT in your environment before running this script.")

# Encode PAT
auth = base64.b64encode(f":{PAT}".encode()).decode()

# Step 1: Get Work Item IDs
wiql_url = f"https://dev.azure.com/{ORG}/{PROJECT}/_apis/wit/wiql?api-version=7.0"

query = {
    "query": """
    SELECT [System.Id]
    FROM WorkItems
    """
}

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Basic {auth}"
}

response = requests.post(wiql_url, json=query, headers=headers)
data = response.json()

ids = [item["id"] for item in data["workItems"]]

# Step 2: Get full details
ids_string = ",".join(map(str, ids))

details_url = f"https://dev.azure.com/{ORG}/_apis/wit/workitems?ids={ids_string}&api-version=7.0"

response = requests.get(details_url, headers=headers)
details = response.json()

rows = []

for item in details["value"]:
    fields = item["fields"]

    rows.append({
        "ID": item["id"],
        "Title": fields.get("System.Title"),
        "AssignedTo": fields.get("System.AssignedTo", {}).get("displayName"),
        "OriginalEstimate": fields.get("Microsoft.VSTS.Scheduling.OriginalEstimate"),
        "CompletedWork": fields.get("Microsoft.VSTS.Scheduling.CompletedWork"),
        "State": fields.get("System.State"),
        "Iteration": fields.get("System.IterationPath")
    })

df = pd.DataFrame(rows)

# Save to Excel
df.to_excel("devops_data.xlsx", index=False)

print("✅ Data exported to devops_data.xlsx")