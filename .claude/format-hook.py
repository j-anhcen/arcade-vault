import sys
import json
import re
import subprocess
import os

data = json.load(sys.stdin)
file_path = data.get("tool_input", {}).get("file_path", "")

if not re.search(r"\.(tsx|jsx|ts|md)$", file_path):
    sys.exit(0)

# Derive project root from this script's location (.claude/ → project root)
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

subprocess.run(["npx", "prettier", "--write", file_path], cwd=root)

if re.search(r"\.(tsx|jsx|ts)$", file_path):
    subprocess.run(["npx", "eslint", "--fix", file_path], cwd=root)
