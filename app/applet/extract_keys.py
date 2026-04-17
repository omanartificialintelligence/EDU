import re

with open("components/SupervisorDashboard.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "key=" in line:
        key_str = re.search(r'key=({[^}]*}|"[^"]*"|\'[^\']*\')', line)
        if key_str:
            print(f"Line {i+1}: {key_str.group(1).strip()}")
