#!/usr/bin/env python3
"""Regenerate web-sized assets from originals: python3 scripts/generate_images.py.

Requires Pillow with WebP support. Originals remain available for full-size links.
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / 'img' / 'optimized'
PAPERS = ('ai4ai.png', 'gome.jpg', 'FT-Dojo.png', 'RDAgent.png', 'AI_Trader.png',
          'TwinMarket.jpg', 'UCFE.png', 'true_gold.png', 'xiuqi.png', 'finllava.png', 'yxyz.jpg')


def generate(name, widths, lossless=False):
    source = ROOT / 'img' / name
    with Image.open(source) as original:
        original = ImageOps.exif_transpose(original)
        for width in sorted({min(w, original.width) for w in widths}):
            height = round(original.height * width / original.width)
            image = original.resize((width, height), Image.Resampling.LANCZOS)
            if image.mode not in ('RGB', 'RGBA'):
                image = image.convert('RGB')
            target = OUTPUT / f'{source.stem}-{width}.webp'
            image.save(target, 'WEBP', quality=85, method=6, lossless=lossless)
            print(f'{target.relative_to(ROOT)}: {width}x{height}, {target.stat().st_size:,} bytes')


if __name__ == '__main__':
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name in PAPERS:
        generate(name, (480, 960))
    generate('pic_image.png', (132, 264))
    generate('wechat.png', (560,), lossless=True)
    generate('cuhksz.png', (48,))
