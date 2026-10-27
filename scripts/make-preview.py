"""Создаёт один автономный HTML для просмотра без папки assets. Python 3."""
from pathlib import Path
import re
import base64
import mimetypes

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT.parent / 'wedding-preview.html'

def data_url(relative):
    path = ROOT / relative
    mime = {'.woff': 'font/woff', '.webp': 'image/webp', '.svg': 'image/svg+xml'}.get(path.suffix, mimetypes.guess_type(path)[0] or 'application/octet-stream')
    return 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode('ascii')

html = (ROOT / 'index.html').read_text(encoding='utf-8')
css = (ROOT / 'styles.css').read_text(encoding='utf-8')
css = re.sub(r"url\('([^']+)'\)", lambda m: "url('" + data_url(m[1]) + "')", css)
html = re.sub(r'\s*<link rel="preload"[^>]*>', '', html)
html = html.replace('<link rel="stylesheet" href="styles.css">', '<style>' + css + '</style>')
html = re.sub(r'\s*<script src="[^"]+" defer></script>', '', html)
html = re.sub(r'\s+(?:srcset|sizes)="[^"]*"', '', html)
html = re.sub(r'((?:src|href|data-lightbox)=")(assets/[^"]+)(")', lambda m: m[1] + data_url(m[2]) + m[3], html)
scripts = '\n'.join('<script>\n' + (ROOT / name).read_text(encoding='utf-8').replace('</script', '<\\/script') + '\n</script>' for name in ['config.js', 'core.js', 'app.js'])
html = html.replace('</body>', scripts + '\n</body>')
OUT.write_text(html, encoding='utf-8')
print(OUT)
