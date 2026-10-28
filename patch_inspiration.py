with open('src/app/conscious/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

old = """          <div className="space-y-4">
            <span className="text-[11px] font-semibold tracking-[0.2em] text-[#666666] uppercase">
              OUR INSPIRATION
            </span>
            <h3 className="font-sans text-xl font-normal tracking-wide text-[#000000] sm:text-2xl">
              Inspired by Andalusia. Made for Everyday Life.
            </h3>
            <p className="text-xs leading-relaxed text-[#333333] sm:text-sm">
              There is something timeless about Andalusia\u2014the warmth of its architecture, the rhythm of its courtyards, the intricate patterns of its tiles, and the effortless beauty found in the simplest details.
            </p>
            <p className="text-xs leading-relaxed text-[#333333] sm:text-sm">
              Inspired by the cities of Sevilla and Granada, our aesthetic celebrates warm tones, graceful forms, and quiet sophistication. Rather than recreating the past, we take these inspirations into the present, translating their spirit into modestwear made for the way we live today.
            </p>
            <div className="pt-2 text-xs italic text-[#666666]">
              &ldquo;A little Mediterranean warmth. A little everyday simplicity. A style that feels entirely your own.&rdquo;
            </div>
          </div>"""

new = """          <div className="space-y-4">
            <span className="text-[10px] font-semibold tracking-[0.2em] text-[#666666] uppercase">
              OUR INSPIRATION
            </span>
            <h3 className="font-sans text-base font-normal tracking-wide text-[#000000] sm:text-lg">
              Inspired by Andalusia. Made for the Woman You Are Becoming.
            </h3>
            <p className="text-xs leading-relaxed text-[#333333]">
              There is something timeless about Andalusia\u2014the warmth of its architecture, the rhythm of its courtyards, the intricate patterns of its tiles, and the quiet beauty found in the simplest details.
            </p>
            <p className="text-xs leading-relaxed text-[#333333]">
              Inspired by Sevilla and Granada, our aesthetic draws from warm Mediterranean tones, graceful forms, and a deep appreciation for thoughtful design. With a background in architecture, we see clothing much like the spaces we inhabit: every proportion, detail, and material has a purpose.
            </p>
            <p className="text-xs leading-relaxed text-[#333333]">
              We translate this inspiration into modestwear for contemporary women\u2014pieces that feel timeless yet relevant, elegant yet effortless, and beautiful without sacrificing the ease of everyday life.
            </p>
            <div className="pt-2 text-[10px] font-medium tracking-wide text-[#555555] italic">
              Rooted in heritage. Designed for the life ahead.
            </div>
          </div>"""

if old in c:
    c = c.replace(old, new)
    with open('src/app/conscious/page.tsx', 'w', encoding='utf-8') as f:
        f.write(c)
    print('Done!')
else:
    # Try finding the section manually
    idx = c.find('OUR INSPIRATION')
    if idx != -1:
        print('Found OUR INSPIRATION at', idx)
        # Find enclosing div
        div_start = c.rfind('<div className="space-y-4">', 0, idx)
        div_end = c.find('</div>\n        </div>', idx)
        print('Div start:', div_start, 'Div end:', div_end)
        print(repr(c[div_start:div_start+200]))
    else:
        print('Not found')
