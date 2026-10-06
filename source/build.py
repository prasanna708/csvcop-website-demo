"""Builds the CSVCOP website: every page in the folder above, from the parts in this folder.

    python source/build.py

shell.html is the frame of every page; pages/*.html are the pages' contents; partials/*.html are pieces
used on more than one page, written into a page as [[name]]. Three more shortcuts:

    [[screen file="ms-rules" alt="..." class="light" eager="yes"]]          a real screen in a window
    [[carousel class="light" items="file|a|Title|Text||file|b|Title|Text"]]  the 3D carousel (a/b = module)
    [[stack items="file|Title||file|Title"]]                                a stack of screens that deals itself
"""
import os, re, html

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)

PAGES = [
    ('index', 'CSVCOP: 21 CFR Part 11 Controls and Micro-segmentation for laboratory workstations',
     'Lock laboratory Windows workstations down, decide what they may talk to, and prove it to your auditor. Fully offline.'),
    ('products', 'Products · CSVCOP', 'Two modules for one workstation: 21 CFR Part 11 Controls and Micro-segmentation.'),
    ('overview', 'How it works · CSVCOP', 'An application decides, a service enforces, an agent guards the session, and Windows Firewall carries the network policy.'),
    ('features', 'Features · CSVCOP', 'What each CSVCOP module does, at a glance: the 97 controls, self-healing, USB, and every part of Micro-segmentation.'),
    ('pricing', 'Pricing · CSVCOP', 'CSVCOP is licensed per workstation and sold through our authorised distributor, SEK RAW Business Services.'),
    ('faq', 'FAQ · CSVCOP', 'Short answers about CSVCOP, its two modules, compliance evidence and offline licensing.'),
    ('contact', 'Contact · CSVCOP', 'Book a demonstration of CSVCOP, send your audit checklist, or ask a technical question.'),
    ('404', 'Page not found · CSVCOP', 'This page does not exist.'),
]

SIZES = {'ms-rule-dialog': (574, 719)}
DEFAULT = (1350, 781)
TITLE_BAR = ('<div class="screen-bar"><span class="app"><img src="img/favicon.png" alt="" width="14" height="14">CSVCOP</span>'
             '<span class="win" aria-hidden="true"><i>&#8211;</i><i>&#9633;</i><i>&#10005;</i></span></div>')


def read(*parts):
    with open(os.path.join(HERE, *parts), encoding='utf-8-sig') as f:
        return f.read()


def attrs(text):
    return dict(re.findall(r'(\w+)="([^"]*)"', text))


def picture(f, alt, eager=False):
    w, h = SIZES.get(f, DEFAULT)
    load = 'fetchpriority="high"' if eager else 'loading="lazy"'
    return ('<picture><source srcset="img/screens/%s.webp" type="image/webp">'
            '<img src="img/screens/%s.png" alt="%s" width="%d" height="%d" %s decoding="async"></picture>' % (f, f, alt, w, h, load))


def screen(a, extra=''):
    cls = ('screen ' + a.get('class', '')).strip()
    zoom = '' if a.get('zoom') == 'no' else ' data-zoom'
    return '<figure class="%s"%s%s>%s%s</figure>' % (cls, zoom, extra, TITLE_BAR, picture(a['file'], a.get('alt', ''), a.get('eager') == 'yes'))


def carousel(a):
    items = [i.split('|') for i in a['items'].split('||')]
    slides = ''.join(
        '<div class="c-item" role="group" aria-roledescription="slide" aria-label="%d of %d" data-mod="%s" data-title="%s" data-text="%s">%s</div>'
        % (k + 1, len(items), mod, title, text, screen({'file': f, 'alt': title + ': ' + text, 'class': a.get('screen', '')}))
        for k, (f, mod, title, text) in enumerate(items))
    return ('<div class="carousel %s" data-carousel role="region" aria-roledescription="carousel" aria-label="Screens of the CSVCOP application" tabindex="0">'
            '<div class="carousel-view"><div class="carousel-track">%s</div></div>'
            '<div class="carousel-ui"><button class="c-btn c-prev" type="button" aria-label="Previous screen"><svg class="i"><use href="#i-arrow-left"/></svg></button>'
            '<div class="c-caption" aria-live="polite"></div>'
            '<button class="c-btn c-next" type="button" aria-label="Next screen"><svg class="i"><use href="#i-arrow"/></svg></button></div>'
            '<div class="c-dots"></div></div>' % (a.get('class', ''), slides))


def stack(a):
    items = [i.split('|') for i in a['items'].split('||')]
    cards = ''.join(screen({'file': f, 'alt': title, 'class': 'light'}, ' data-title="%s"' % title) for f, title in items)
    return ('<div class="stack" data-stack data-tilt="6"><div class="stack-inner tilt-inner">%s</div></div>'
            '<p class="stack-label"><b>%s</b></p>' % (cards, items[0][1]))


def expand(text, depth=0):
    def repl(m):
        name, rest = m.group(1), attrs(m.group(2) or '')
        if name == 'screen':
            return screen(rest)
        if name == 'carousel':
            return carousel(rest)
        if name == 'stack':
            return stack(rest)
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
    # Every link and picture must lead somewhere inside the site, anchors included.
    for name, page in built.items():
        for target, anchor in re.findall(r'(?:href|src|srcset)="([^"#:]*?)(?:#([^"]*))?"', page):
            if not target and not anchor:
                continue
            path = target or name + '.html'
            if not os.path.exists(os.path.join(OUT, path)):
                print('  missing file:', name, '->', path)
            elif anchor and anchor not in ('portal', 'main') and path.endswith('.html'):
                if not re.search(r'id="%s"' % re.escape(anchor), built.get(path[:-5]) or ''):
                    print('  missing anchor:', name, '->', path + '#' + anchor)


if __name__ == '__main__':
    build()
