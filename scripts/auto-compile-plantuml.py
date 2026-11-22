#!/usr/bin/env python3
import sys
import json
import os
import zlib
import urllib.request

def encode6bit(b):
    if b < 10: return chr(48 + b)
    b -= 10
    if b < 26: return chr(65 + b)
    b -= 26
    if b < 26: return chr(97 + b)
    b -= 26
    if b == 0: return '-'
    if b == 1: return '_'
    return '?'

def append3bytes(b1, b2, b3):
    c1 = b1 >> 2
    c2 = ((b1 & 0x3) << 4) | (b2 >> 4)
    c3 = ((b2 & 0xF) << 2) | (b3 >> 6)
    c4 = b3 & 0x3F
    return encode6bit(c1 & 0x3F) + encode6bit(c2 & 0x3F) + encode6bit(c3 & 0x3F) + encode6bit(c4 & 0x3F)

def plantuml_encode(text):
    data = text.encode('utf-8')
    z = zlib.compress(data)[2:-4]
    res = []
    i = 0
    while i < len(z):
        b1 = z[i]
        b2 = z[i+1] if i+1 < len(z) else 0
        b3 = z[i+2] if i+2 < len(z) else 0
        res.append(append3bytes(b1, b2, b3))
        i += 3
    return ''.join(res)

def compile_puml_to_svg(puml_path, output_svg_path):
    if not os.path.exists(puml_path):
        return
    with open(puml_path, 'r', encoding='utf-8') as f:
        content = f.read()

    encoded = plantuml_encode(content)
    urls = [
        f'https://www.plantuml.com/plantuml/svg/{encoded}',
        f'https://www.planttext.com/plantuml/svg/{encoded}'
    ]
    
    svg_data = None
    last_err = None
    for url in urls:
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)'})
            with urllib.request.urlopen(req, timeout=20) as resp:
                svg_data = resp.read().decode('utf-8')
            if svg_data and '<svg' in svg_data:
                break
        except Exception as e:
            last_err = e
            continue

    if not svg_data:
        sys.stderr.write(f'[auto-compile-plantuml] Failed to compile {puml_path}: {last_err}\n')
        return

    os.makedirs(os.path.dirname(output_svg_path), exist_ok=True)
    with open(output_svg_path, 'w', encoding='utf-8') as f:
        f.write(svg_data)
    sys.stderr.write(f'[auto-compile-plantuml] Compiled {puml_path} -> {output_svg_path} ({len(svg_data)} bytes)\n')

def get_target_svg_paths(puml_path):
    # Normalize path
    norm_path = os.path.abspath(puml_path)
    targets = []

    # Map RUP/ -> images/
    if '/RUP/' in norm_path:
        target_svg = norm_path.replace('/RUP/', '/images/').rsplit('.', 1)[0] + '.svg'
        targets.append(target_svg)

        # Handle RUP naming variations/aliases in images/
        filename = os.path.basename(puml_path)
        dirname = os.path.dirname(target_svg)
        if filename == 'actoresCasosUsoAdmin.puml':
            targets.append(os.path.join(dirname, 'actoresCasosUsoAdministrador.svg'))
        elif filename == 'diagrama-de-contexto.puml':
            targets.append(os.path.join(dirname, 'diagramaContextoAdmin.svg'))
    else:
        targets.append(norm_path.rsplit('.', 1)[0] + '.svg')

    return targets

def main():
    try:
        raw_input = sys.stdin.read()
        if raw_input.strip():
            payload = json.loads(raw_input)
            tool_call = payload.get('toolCall', {})
            args = tool_call.get('args', {})
            file_path = args.get('Path') or args.get('path') or ''

            if file_path.endswith('.puml'):
                for target_svg in get_target_svg_paths(file_path):
                    try:
                        compile_puml_to_svg(file_path, target_svg)
                    except Exception as e:
                        sys.stderr.write(f'[auto-compile-plantuml] Error compiling {file_path}: {e}\n')
    except Exception as e:
        sys.stderr.write(f'[auto-compile-plantuml] Hook error: {e}\n')
    finally:
        # PostToolUse requires empty JSON on stdout
        print('{}')

if __name__ == '__main__':
    main()
