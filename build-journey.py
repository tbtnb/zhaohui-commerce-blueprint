#!/usr/bin/env python3
"""Build a static, self-contained journey from the reviewed 60 scene scripts."""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
KEYS = ['id','thought','question','choices','detailQuestion','details','source','trigger','when','kind','objects','before','after','steps','result','improve','issue']

def esc(value):
    return html.escape(str(value), quote=True)

def main():
    guide = json.loads((ROOT/'scenarios.json').read_text(encoding='utf-8'))
    originals = {s['id']: {**s, 'category': g['id'], 'categoryName': g['name']} for g in guide['groups'] for s in g['scenes']}
    rows = [row for path in sorted((ROOT/'journey-data').glob('*.json')) for row in json.loads(path.read_text(encoding='utf-8'))]
    assert len(rows) == 60 and all(len(row) == len(KEYS) for row in rows)
    scenes = []
    for row in rows:
        s = dict(zip(KEYS, row))
        o = originals[s['id']]
        s.update({k:o[k] for k in ['title','platforms','human','metric','sources','category','categoryName']})
        s['choices'] = [{'label':label,'items':items} for label,items in s['choices']]
        assert s['trigger'] in ('clock','chat','file')
        assert all(len(s[k]) == 3 for k in ('objects','before','after','steps'))
        assert len(s['details']) == 2 and len(s['choices']) == 2
        assert all(c['items'] and set(c['items']) <= {0,1,2} for c in s['choices'])
        scenes.append(s)
    assert [s['id'] for s in scenes] == list(range(1,61))
    assert len({s['kind'] for s in scenes}) == 60
    bundle = {'edition':'guided-journeys-v4','demo':True,'sceneCount':60,'scenes':scenes,'categories':[{'id':g['id'],'name':g['name']} for g in guide['groups']], 'sourceGuide':'guide.html#evidence', 'motionReferences':['https://motionsites.ai/','https://motionsites.ai/lesson/build-scroll-animated-website-with-ai']}
    lanes=[]
    # Each distinct thought is keyboard-accessible once; repeated scenery is decorative.
    for lane in range(6):
        subset=[scenes[(lane*10+i*7)%60] for i in range(10)]
        # Modular strides above decorate the lanes; use contiguous membership to ensure all 60 ideas.
        subset=scenes[lane*10:(lane+1)*10]
        chips=''.join(f'<button type="button" class="idea-chip" data-pick="{s["id"]}" style="--tone:{s["id"]%4}"><span class="idea-spark" aria-hidden="true">✦</span>{esc(s["thought"])}<span class="idea-arrow" aria-hidden="true">↗</span></button>' for s in subset)
        repeat=''.join(f'<span class="idea-chip decorative" aria-hidden="true" style="--tone:{s["id"]%4}"><span class="idea-spark">✦</span>{esc(s["thought"])}</span>' for s in subset)
        lanes.append(f'<div class="idea-lane lane-{lane}" style="--lane:{lane}"><div class="idea-track">{chips}{repeat}</div></div>')
    stars=''.join(f'<i style="--x:{(i*37+11)%100}%;--y:{(i*61+9)%100}%;--d:{i%7}s;--s:{1+i%3}px"></i>' for i in range(48))
    filters='<button type="button" data-category="all" class="category active" aria-pressed="true">全部 <span>60</span></button>'+''.join(f'<button type="button" data-category="{g["id"]}" class="category" aria-pressed="false">{esc(g["name"])}</button>' for g in bundle['categories'])
    library='\n'.join(f'<article class="library-card" data-id="{s["id"]}" data-category="{s["category"]}"><div class="library-art motif-{s["category"]}" aria-hidden="true"><span class="mini-item"></span><span class="mini-item"></span><span class="mini-item"></span><i></i></div><div class="library-info"><span class="library-number">{s["id"]:02} / {esc(s["categoryName"])}</span><h3>{esc(s["thought"])}</h3><p>{esc(s["title"])}</p><a href="./guide.html#scene-{s["id"]:02}" data-pick="{s["id"]}">从这个想法开始 <span aria-hidden="true">↗</span></a></div></article>' for s in scenes)
    data=json.dumps(bundle,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026')
    page=(ROOT/'journey-template.html').read_text(encoding='utf-8')
    for key,value in {'STARS':stars,'IDEA_LANES':'\n'.join(lanes),'CATEGORY_FILTERS':filters,'LIBRARY':library,'DATA':data}.items():
        page=page.replace('{{'+key+'}}',value)
    assert not re.search(r'\{\{[A-Z_]+\}\}',page)
    ids=re.findall(r'(?<![-\w])id="([^"\s]+)"',page)
    assert len(ids)==len(set(ids))
    targets=re.findall(r'href="#([^"\s]+)"',page)
    assert set(targets)<=set(ids)
    (ROOT/'index.html').write_text(page,encoding='utf-8')
    (ROOT/'journeys.json').write_text(json.dumps(bundle,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'built':True,'scenes':len(scenes),'distinct_business_animations':len({s['kind'] for s in scenes}),'hero_choices':60,'html_bytes':len(page.encode())},ensure_ascii=False))

if __name__=='__main__':main()
