"""Assembles the website demo pages (index.html, products.html, in the folder above) from the parts in this folder.
Run: python source/build.py   (set DEMO_SITE=http://localhost:8089 to link to a local copy of the site instead).
The icon sprite is read from the application's own _SiteSprite.cshtml, plus the two icons the demo adds."""
import os, re

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)
SITE = os.environ.get('DEMO_SITE', 'https://www.csvcop.com')   # the live site, for the pages this demo does not replace
SPRITE_SRC = r'D:\CsvCop 2.0\CSVCOP-handover\web\CsvCop.Web\CsvCop.Web\Views\Shared\_SiteSprite.cshtml'
NEW_SYMBOLS = '''  <symbol id="i-x" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></symbol>
  <symbol id="i-share" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></symbol>
'''

def read(name):
    with open(os.path.join(HERE, name), encoding='utf-8-sig') as f:
        return f.read()

sprite = open(SPRITE_SRC, encoding='utf-8-sig').read()
sprite = re.sub(r'^@\*.*?\*@\s*', '', sprite, flags=re.S)
sprite = sprite.replace('</svg>', NEW_SYMBOLS + '</svg>')

cards = read('cards.html')
parts = {}
for key in ('CARD_A', 'CARD_B', 'SHARED'):
    m = re.search(r'<!-- %s -->\n(.*?)(?=\n<!-- [A-Z_]+ -->|\Z)' % key, cards, flags=re.S)
    parts[key] = m.group(1).rstrip()

shell = read('shell.html')
pages = [
    ('index.html', 'home.html', 'Windows workstation lockdown and micro-segmentation for regulated laboratories',
     'CSVCOP protects laboratory Windows workstations with two modules: 21 CFR Part 11 Controls and Micro-segmentation.', 'home'),
    ('products.html', 'products.html', 'Products',
     'The two CSVCOP modules: 21 CFR Part 11 Controls locks the workstation down; Micro-segmentation decides which programs may talk to which machines.', 'products'),
]
for out_name, body_name, title, desc, page in pages:
    body = read(body_name)
    for key, value in parts.items():
        body = body.replace('{{%s}}' % key, value)
    html = (shell.replace('{{BODY}}', body)
                 .replace('{{SPRITE}}', sprite)
                 .replace('{{TITLE}}', title)
                 .replace('{{DESCRIPTION}}', desc)
                 .replace('{{ON_HOME}}', 'active' if page == 'home' else '')
                 .replace('{{ON_PRODUCTS}}', 'active' if page == 'products' else '')
                 .replace('{{PRODUCTS}}', 'products.html')
                 .replace('{{SITE}}', SITE))
    left = re.findall(r'\{\{[A-Z_]+\}\}', html)
    assert not left, (out_name, left)
    with open(os.path.join(OUT, out_name), 'w', encoding='utf-8') as f:
        f.write(html)
    print('wrote', out_name, len(html))
