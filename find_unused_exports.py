import os
import re

def get_exports(file_path):
    exports = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            # Match export const/let/var X = ...
            # Match export function X(...)
            # Match export type/interface X =/ {
            # Match export { X, Y as Z }
            
            # Simple regexes for common export patterns
            matches = re.findall(r'export\s+(?:const|let|var|function|type|interface|enum|class)\s+([a-zA-Z0-9_]+)', content)
            exports.extend(matches)
            
            # Named exports in braces: export { a, b, c as d }
            braced = re.findall(r'export\s*\{([^}]+)\}', content)
            for b in braced:
                items = b.split(',')
                for item in items:
                    item = item.strip()
                    if ' as ' in item:
                        exports.append(item.split(' as ')[1].strip())
                    else:
                        exports.append(item.strip())
    except Exception:
        pass
    return list(set(exports))

all_files = []
for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith(('.ts', '.tsx', '.js', '.jsx')) and not file.endswith('.d.ts'):
            all_files.append(os.path.join(root, file))

export_map = {}
for f in all_files:
    exports = get_exports(f)
    if exports:
        export_map[f] = exports

print("Checking exports in " + str(len(export_map)) + " files...")

# For each export, check if it's used in any OTHER file
# This is slow, so let's only do it for files that are themselves used
# But for simplicity, we'll do it for all and user can decide

unused_exports = []
for f, exports in export_map.items():
    for exp in exports:
        # Search for exp in all other files
        found = False
        # Heuristic: search for the word 'exp' (whole word)
        # We use a combined grep for all files to be faster
        # But here we'll just do it in python
        # To optimize, we read each file once
        
        # Actually, let's use grep project-wide for each export
        # This is also slow. 
        # Better: Read all files into memory once and search.
        pass

# Refined approach:
all_contents = {}
for f in all_files:
    try:
        with open(f, 'r', encoding='utf-8') as file:
            all_contents[f] = file.read()
    except:
        pass

for f, exports in export_map.items():
    for exp in exports:
        count = 0
        pattern = re.compile(r'\b' + re.escape(exp) + r'\b')
        for other_f, content in all_contents.items():
            if pattern.search(content):
                count += 1
        # count will be at least 1 (the export itself)
        if count == 1:
            unused_exports.append((f, exp))

for f, exp in sorted(unused_exports):
    print(f"{f}: export {exp} is unused")

