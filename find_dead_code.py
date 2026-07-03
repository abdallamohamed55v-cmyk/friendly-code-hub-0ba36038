import os
import re

def get_imports(file_path):
    imports = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            # Match: from "..." or from '...' or import("...") or import('...')
            matches = re.findall(r'from\s+["\']([^"\']+)["\']', content)
            matches += re.findall(r'import\s*\(["\']([^"\']+)["\']\)', content)
            for m in matches:
                if m.startswith('.'):
                    # Relative import
                    dir_name = os.path.dirname(file_path)
                    target = os.path.normpath(os.path.join(dir_name, m))
                    imports.append(target)
                elif m.startswith('@/'):
                    # Alias import
                    target = os.path.join('src', m[2:])
                    imports.append(target)
                else:
                    # External or other
                    pass
    except Exception:
        pass
    return imports

def resolve_file(base_path):
    # Try .tsx, .ts, /index.tsx, /index.ts
    for ext in ['.tsx', '.ts', '.jsx', '.js']:
        if os.path.isfile(base_path + ext):
            return base_path + ext
    if os.path.isdir(base_path):
        for ext in ['/index.tsx', '/index.ts', '/index.jsx', '/index.js']:
            if os.path.isfile(base_path + ext):
                return base_path + ext
    return None

all_files = []
for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith(('.ts', '.tsx', '.js', '.jsx')) and not file.endswith('.d.ts'):
            all_files.append(os.path.join(root, file))

graph = {}
for f in all_files:
    imports = get_imports(f)
    resolved_imports = []
    for imp in imports:
        res = resolve_file(imp)
        if res:
            resolved_imports.append(res)
    graph[f] = resolved_imports

reachable = set()
def walk(f):
    if f in reachable:
        return
    reachable.add(f)
    for imp in graph.get(f, []):
        walk(imp)

if os.path.exists('src/main.tsx'):
    walk('src/main.tsx')
if os.path.exists('src/App.tsx'):
    walk('src/App.tsx')

print("--- UNUSED FILES ---")
for f in sorted(all_files):
    if f not in reachable:
        # Ignore main and App as they are entry points
        if f in ['src/main.tsx', 'src/App.tsx']: continue
        print(f)

