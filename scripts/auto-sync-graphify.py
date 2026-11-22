#!/usr/bin/env python3
import sys
import json
import os
import subprocess

IGNORE_PATTERNS = [
    'graphify-out',
    '.git',
    '.agents',
    '.gemini',
    '.system_generated',
    'node_modules',
    '.env',
    '.log'
]

VALID_EXTENSIONS = (
    '.js', '.mjs', '.cjs',
    '.ts', '.tsx',
    '.json',
    '.md',
    '.puml',
    '.html',
    '.css',
    '.sh',
    '.py'
)

def should_update_graph(file_path):
    if not file_path:
        return False
    
    # Check ignore patterns
    for pat in IGNORE_PATTERNS:
        if pat in file_path:
            return False
            
    # Check if supported extension
    return file_path.endswith(VALID_EXTENSIONS)

def main():
    try:
        raw_input = sys.stdin.read()
        if raw_input.strip():
            payload = json.loads(raw_input)
            tool_call = payload.get('toolCall', {})
            args = tool_call.get('args', {})
            file_path = args.get('Path') or args.get('path') or ''
            cwd = payload.get('cwd') or os.getcwd()

            if should_update_graph(file_path):
                # Run graphify update asynchronously or with timeout
                graphify_bin = os.path.expanduser('~/.local/bin/graphify')
                if not os.path.exists(graphify_bin):
                    graphify_bin = 'graphify'

                result = subprocess.run(
                    [graphify_bin, 'update', cwd],
                    cwd=cwd,
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                if result.returncode == 0:
                    sys.stderr.write(f'[auto-sync-graphify] Updated knowledge graph for {file_path}\n')
                else:
                    sys.stderr.write(f'[auto-sync-graphify] Warning: graphify update exited {result.returncode}: {result.stderr}\n')
    except Exception as e:
        sys.stderr.write(f'[auto-sync-graphify] Hook error: {e}\n')
    finally:
        # PostToolUse requires empty JSON on stdout
        print('{}')

if __name__ == '__main__':
    main()
