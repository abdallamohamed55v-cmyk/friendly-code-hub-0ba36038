import os
import subprocess

def run_command(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout.strip().split('\n') if result.returncode == 0 else []

def is_referenced(search_term, search_dirs, exclude_file=None):
    if not search_term: return True
    
    # We check src/ and index.html by default
    # For public assets, we also check site.webmanifest
    targets = " ".join(search_dirs)
    
    cmd = f'rg -F "{search_term}" {targets}'
    if exclude_file:
        cmd += f' -g "!{exclude_file}"'
    
    output = run_command(cmd)
    return any(line.strip() for line in output)

def main():
    dead_files = []

    # 1. src/**/*.{ts,tsx}
    src_files = run_command('find src -name "*.ts" -o -name "*.tsx"')
    # Filter out shadcn, entry points, and tests (though user didn't explicitly say skip tests, usually they are dead if they don't import things, but here they are the ones importing)
    # Actually, the check is "zero external imports". If a test is not imported, it's fine? No, a test IS an entry point for the test runner.
    # So I should skip .test.ts and .test.tsx
    
    skip_list = ['src/App.tsx', 'src/main.tsx', 'src/vite-env.d.ts', 'src/jsx.d.ts']
    
    for f in src_files:
        if not f: continue
        if any(f == s for s in skip_list): continue
        if 'src/components/ui/' in f: continue
        if '.test.' in f: continue
        if f.endswith('index.ts') or f.endswith('index.tsx'): continue
        
        basename = os.path.splitext(os.path.basename(f))[0]
        # Check re-export in index.ts in same dir
        dir_path = os.path.dirname(f)
        index_ts = os.path.join(dir_path, 'index.ts')
        index_tsx = os.path.join(dir_path, 'index.tsx')
        re_exported = False
        for idx in [index_ts, index_tsx]:
            if os.path.exists(idx):
                with open(idx, 'r') as i:
                    if f'"{basename}"' in i.read() or f"'{basename}'" in i.read():
                        re_exported = True
                        break
        if re_exported: continue

        if not is_referenced(basename, ['src/', 'index.html'], exclude_file=f):
            dead_files.append((f, f'rg "{basename}" src/ index.html'))

    # 5. supabase/functions/*/index.ts
    func_dirs = run_command('ls -d supabase/functions/*/')
    config_toml = ""
    if os.path.exists('supabase/config.toml'):
        with open('supabase/config.toml', 'r') as c:
            config_toml = c.read()

    for d in func_dirs:
        if not d: continue
        func_name = os.path.basename(d.rstrip('/'))
        if func_name in ['node_modules', '_shared']: continue
        
        # Reference in src/ (invoke) or config.toml
        if not is_referenced(func_name, ['src/', 'supabase/config.toml']):
            dead_files.append((f'supabase/functions/{func_name}/index.ts', f'rg "{func_name}" src/ supabase/config.toml'))

    # 6. public/ assets
    public_files = run_command('find public -type f')
    for f in public_files:
        if not f: continue
        basename = os.path.basename(f)
        if basename in ['.headers', '_headers', '_redirects', 'robots.txt', 'sitemap.xml', 'sitemap-index.xml', 'site.webmanifest', 'llms.txt', 'security.txt']:
            continue
        
        # Search in src, index.html, AND public/site.webmanifest
        if not is_referenced(basename, ['src/', 'index.html', 'public/site.webmanifest']):
            dead_files.append((f, f'rg "{basename}" src/ index.html'))

    for f, v in dead_files:
        print(f"{f} | {v}")

if __name__ == "__main__":
    main()
