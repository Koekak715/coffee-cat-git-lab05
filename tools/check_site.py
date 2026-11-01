"""Validate this buildless site using only the Python standard library."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'site'


class SiteParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids, self.refs, self.images, self.categories = [], [], [], []
        self.lang = None
        self.h1 = 0

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag == 'html':
            self.lang = attrs.get('lang')
        if tag == 'h1':
            self.h1 += 1
        for key in ('src', 'href'):
            if key in attrs:
                self.refs.append((tag, key, attrs[key]))
        for key in ('aria-labelledby', 'aria-controls'):
            for value in attrs.get(key, '').split():
                self.refs.append((tag, key, '#' + value))
        if tag == 'img':
            self.images.append(attrs)
        if tag == 'article' and 'data-category' in attrs:
            self.categories.append(attrs['data-category'])


def validate():
    parser = SiteParser()
    parser.feed((SITE / 'index.html').read_text(encoding='utf-8-sig'))
    assert parser.lang == 'ru', 'Page language must be Russian'
    assert parser.h1 == 1, 'Exactly one main heading is required'
    duplicates = [key for key, count in Counter(parser.ids).items() if count > 1]
    assert not duplicates, f'Duplicate IDs: {duplicates}'
    ids = set(parser.ids)
    resources = set()
    for tag, key, ref in parser.refs:
        url = urlsplit(ref)
        if url.scheme or url.netloc:
            assert key != 'src' and tag != 'link', f'External runtime resource: {ref}'
            continue
        if url.fragment and not url.path:
            assert unquote(url.fragment) in ids, f'Unknown fragment or ARIA ID: {ref}'
        if url.path:
            target = (SITE / unquote(url.path)).resolve()
            assert target.is_relative_to(SITE.resolve()), f'Path escapes site: {ref}'
            assert target.is_file(), f'Missing resource: {ref}'
            resources.add(target)
    assert len(parser.images) == 11, 'Expected eight original and three guide photographs'
    for img in parser.images:
        assert img.get('alt', '').strip(), f'Missing image description: {img}'
        assert int(img.get('width', 0)) > 0 and int(img.get('height', 0)) > 0
    assert Counter(parser.categories) == {'coffee': 5, 'without-coffee': 1}
    css = (SITE / 'styles.css').read_text(encoding='utf-8-sig')
    assert '@import' not in css, 'No network font imports allowed'
    for value in re.findall(r'url\([\'\"]?([^\)\'\"]+)', css):
        assert not value.startswith(('http:', 'https:', '//')), 'Remote CSS resource'
    for path in sorted(SITE.rglob('*.jpg')):
        assert path.read_bytes().startswith(b'\xff\xd8\xff'), f'Invalid JPEG: {path.name}'
    assert (ROOT / '.github/workflows/ci.yml').is_file()
    print(f'PASS: ru page, one h1, {len(ids)} unique IDs, {len(resources)} local resources, '
          f'{len(parser.images)} described photos, categories 5/1, no external runtime resources')


if __name__ == '__main__':
    validate()
