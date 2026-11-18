#!/usr/bin/env python3
import sys
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
    with open(puml_path, 'r', encoding='utf-8') as f:
        content = f.read()

    encoded = plantuml_encode(content)
    url = f'https://www.plantuml.com/plantuml/svg/{encoded}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)'})
    
    with urllib.request.urlopen(req, timeout=15) as resp:
        svg_data = resp.read().decode('utf-8')

    os.makedirs(os.path.dirname(output_svg_path), exist_ok=True)
    with open(output_svg_path, 'w', encoding='utf-8') as f:
        f.write(svg_data)
    print(f'Compiled {puml_path} -> {output_svg_path} ({len(svg_data)} bytes)')

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: compile-plantuml.py <input.puml> <output.svg>")
        sys.exit(1)
    compile_puml_to_svg(sys.argv[1], sys.argv[2])
