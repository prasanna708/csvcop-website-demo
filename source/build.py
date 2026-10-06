"""Builds the CSVCOP website demo: every page in the folder above, from the parts in this folder.

    python source/build.py

shell.html is the frame of every page (head, header, footer); pages/*.html are the pages' contents;
partials/*.html are pieces used on more than one page, written into a page as [[name]].
Two more shortcuts:
    [[shot file="ms-rules" alt="..." caption="..."]]        a real screenshot in a window frame
    [[gallery mod="b" title="..." items="file|Tab|Caption||file|Tab|Caption"]]   tabs of screenshots
"""
import os, re, html

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)

PAGES = [
    ('index', 'Windows workstation lockdown and micro-segmentation for regulated laboratories',
     'CSVCOP protects laboratory Windows workstations with two modules: 21 CFR Part 11 Controls and Micro-segmentation.'),
    ('products', 'Products',
     'The two CSVCOP modules: 21 CFR Part 11 Controls locks the workstation down; Micro-segmentation decides which programs may talk to which machines.'),
    ('overview', 'Overview',
     'How CSVCOP works: an application decides, a service enforces, an agent guards the session, and Windows Firewall carries the network policy.'),
    ('features', 'Features',
     'Everything the two CSVCOP modules do, in detail: the 97 controls, self-healing, the session guard, USB, and every part of Micro-segmentation.'),
    ('pricing', 'Pricing', 'CSVCOP is licensed per workstation and sold through our authorised distributor, SEK RAW Business Services.'),
    ('faq', 'FAQ', 'Questions about CSVCOP, its two modules, compliance evidence and offline licensing, answered.'),
    ('contact', 'Contact', 'Ask for a demonstration of CSVCOP, send your audit checklist, or ask a technical question.'),
]

# Every screenshot is the application's own window area, drawn at 1366 x 820 and cut to 1350 x 781.
SIZES = {'ms-rule-dialog': (574, 719)}
DEFAULT_SIZE = (1350, 781)


def read(*parts):
    with open(os.path.join(HERE, *parts), encoding='utf-8-sig') as f:
        return f.read()


def attrs(text):
    return dict(re.findall(r'(\w+)="([^"]*)"', text))


WINDOW_BAR = ('<div class="shot-bar"><span class="app"><img class="app-ico" src="img/favicon.png" alt="">CSVCOP</span>'
              '<span class="win" aria-hidden="true"><i>&#8211;</i><i>&#9633;</i><i>&#10005;</i></span></div>')


def shot(a):
    f = a['file']
    w, h = SIZES.get(f, DEFAULT_SIZE)
    cls = 'shot' + (' ' + a['class'] if a.get('class') else '')
    bar = '' if a.get('bar') == 'no' else WINDOW_BAR
    return ('<figure class="%s" data-zoom>%s<img src="img/screens/%s.png" alt="%s" data-caption="%s" width="%d" height="%d" loading="lazy">'
            '<span class="zoom-hint"><svg class="i i-sm"><use href="#i-zoom"/></svg>Click to enlarge</span></figure>'
            % (cls, bar, f, a.get('alt', ''), a.get('caption', a.get('alt', '')), w, h))


def gallery(a):
    items = [i.split('|') for i in a['items'].split('||')]
    tabs = ''.join('<button class="gal-tab" type="button" role="tab" data-caption="%s">%s<span class="bar"></span></button>' % (cap, tab)
                   for f, tab, cap in items)
    imgs = ''.join('<img src="img/screens/%s.png" alt="%s" data-caption="%s" width="1350" height="781" loading="lazy">' % (f, tab, cap)
                   for f, tab, cap in items)
    return ('<div class="gallery %s reveal">'
            '<div class="gal-head"><h3>%s</h3><div class="gal-tabs" role="tablist">%s</div></div>'
            '<div class="gal-stage"><figure class="shot" data-zoom>%s<div class="imgs">%s</div>'
            '<span class="zoom-hint"><svg class="i i-sm"><use href="#i-zoom"/></svg>Click to enlarge</span></figure></div>'
            '<p class="gal-cap"></p></div>' % (a.get('mod', 'a'), a.get('title', ''), tabs, WINDOW_BAR, imgs))


def expand(text, depth=0):
    def repl(m):
        name, rest = m.group(1), attrs(m.group(2) or '')
        if name == 'shot':
            return shot(rest)
        if name == 'gallery':
            return gallery(rest)
        return expand(read('partials', name + '.html'), depth + 1)
    if depth > 5:
        raise RuntimeError('partials nest too deep')
    return re.sub(r'\[\[([\w-]+)((?:\s+\w+="[^"]*")*)\s*\]\]', repl, text)


def build():
    shell, sprite = read('shell.html'), read('sprite.svg')
    built = {}
    for name, title, desc in PAGES:
        body = expand(read('pages', name + '.html'))
        page = shell.replace('{{BODY}}', body).replace('{{SPRITE}}', sprite)
        page = page.replace('{{TITLE}}', html.escape(title, quote=False)).replace('{{DESCRIPTION}}', html.escape(desc))
        for other, _, _ in PAGES:
            page = page.replace('{{ON_%s}}' % other, 'active' if other == name else '')
        left = re.findall(r'\{\{[A-Za-z_]+\}\}|\[\[[\w-]+', page)
        assert not left, (name, left)
        with open(os.path.join(OUT, name + '.html'), 'w', encoding='utf-8') as f:
            f.write(page)
        print('wrote %-14s %6d bytes' % (name + '.html', len(page)))
        built[name] = page
    # Every link and picture must lead somewhere inside the demo, anchors included.
    for name, page in built.items():
        for target, anchor in re.findall(r'(?:href|src)="([^"#:]*?)(?:#([^"]*))?"', page):
            if target.startswith(('mailto', 'tel', 'http')):
                continue
            path = target or name + '.html'
            if not os.path.exists(os.path.join(OUT, path)):
                print('  missing file:', name, '->', path)
            elif anchor and anchor != 'portal' and path.endswith('.html'):
                other = built.get(path[:-5]) or ''
                if not re.search(r'id="%s"' % re.escape(anchor), other):
                    print('  missing anchor:', name, '->', path + '#' + anchor)


if __name__ == '__main__':
    build()
