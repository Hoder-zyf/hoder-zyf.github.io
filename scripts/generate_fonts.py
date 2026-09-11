#!/usr/bin/env python3
"""Generate local Latin WOFF2 subsets. Requires fonttools[woff].

Sources are versioned in fonts/sources.json. Original licenses are in fonts/.
"""
import io
import json
from pathlib import Path
from urllib.request import urlopen
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
UNICODES = 'U+0000-024F,U+0300-036F,U+1E00-1EFF,U+2000-206F,U+20A0-20CF,U+2100-214F,U+2190-21FF,U+2212,U+FEFF,U+FFFD'


def main():
    rules = []
    for source in json.loads((ROOT / 'fonts/sources.json').read_text()):
        with urlopen(source['url'], timeout=30) as response:
            font = TTFont(io.BytesIO(response.read()))
        # The modified IBM subset must not retain its reserved font name.
        if source['family'] == 'Homepage Mono':
            for record in font['name'].names:
                if record.nameID in (1, 3, 4, 6, 16):
                    value = 'HomepageMono-' + source['weight'] if record.nameID in (3, 6) else 'Homepage Mono'
                    record.string = value.encode(record.getEncoding())
        options = subset.Options()
        options.name_IDs = ['*']
        subsetter = subset.Subsetter(options=options)
        subsetter.populate(unicodes=subset.parse_unicodes(UNICODES))
        subsetter.subset(font)
        font.flavor = 'woff2'
        target = ROOT / 'fonts' / source['file']
        font.save(target)
        rules.append("@font-face {\n"
                     f"    font-family: '{source['family']}';\n"
                     f"    font-style: {source['style']};\n"
                     f"    font-weight: {source['weight']};\n"
                     "    font-display: swap;\n"
                     f"    src: url('{source['file']}') format('woff2');\n"
                     "}\n")
        print(f'{target.name}: {target.stat().st_size:,} bytes')
    (ROOT / 'fonts/fonts.css').write_text('/* Local Latin subsets; see README.md and OFL licenses. */\n' + '\n'.join(rules))


if __name__ == '__main__':
    main()
