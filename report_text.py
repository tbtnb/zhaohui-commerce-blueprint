"""Generate a complete readable Markdown copy of the authored main content."""
import re
from html.parser import HTMLParser

class ReportParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.active = False
        self.skip = 0
        self.parts = []
        self.links = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'main':
            self.active = True
        if not self.active:
            return
        if tag in ('button', 'select'):
            self.skip += 1
        if self.skip:
            return
        if tag in ('h1', 'h2', 'h3', 'h4'):
            self.parts.append('\n\n' + '#' * int(tag[1]) + ' ')
        elif tag in ('p', 'article', 'section', 'details', 'dl', 'div'):
            self.parts.append('\n\n')
        elif tag == 'dt':
            self.parts.append('\n\n**')
        elif tag == 'dd':
            self.parts.append('\n')
        elif tag == 'br':
            self.parts.append(' ')
        elif tag == 'li':
            self.parts.append('\n\n- ')
        elif tag == 'pre':
            self.parts.append('\n\n```json\n')
        elif tag == 'a':
            href = a.get('href', '')
            if href.startswith('#source-'):
                href = 'https://tbtnb.github.io/zhaohui-commerce-blueprint/architecture.html' + href
            self.links.append(href)
            self.parts.append('[')
        elif tag in ('td', 'th'):
            self.parts.append(' | ')
        elif tag == 'tr':
            self.parts.append('\n')

    def handle_endtag(self, tag):
        if tag == 'main':
            self.active = False
        if not self.active:
            return
        if tag in ('button', 'select'):
            self.skip = max(0, self.skip - 1)
            return
        if self.skip:
            return
        if tag == 'dt':
            self.parts.append('**')
        elif tag == 'a' and self.links:
            self.parts.append('](' + self.links.pop() + ')')
        elif tag == 'pre':
            self.parts.append('\n```\n\n')
        elif tag in ('p', 'article', 'section', 'details', 'dl', 'div', 'tr'):
            self.parts.append('\n\n')

    def handle_data(self, data):
        if self.active and not self.skip:
            self.parts.append(data)

def write_report(root, page):
    parser = ReportParser()
    parser.feed(page)
    text = re.sub(r'\n[ \t]*\n(?:[ \t]*\n)+', '\n\n', ''.join(parser.parts))
    prefix = '# 昭回 · 电商自治蓝图\n\n研究基线：2026-09-14。\n\n这是架构与运营研究，不是商家生产系统；不接入财务，不执行资金动作。所有演示为合成数据。\n\n'
    (root / 'research.md').write_text(prefix + text.strip() + '\n', encoding='utf-8')
