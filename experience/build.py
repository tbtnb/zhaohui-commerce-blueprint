#!/usr/bin/env python3
"""Build this independent walkthrough without modifying the main report homepage."""
import html
import json
import re
from pathlib import Path
ROOT=Path(__file__).resolve().parent

def esc(value):return html.escape(str(value),quote=True)

def main():
    source=ROOT/'journeys.json'
    # First build snapshots reviewed scene data; subsequent builds use this directory only.
    bundle=json.loads((source if source.exists() else ROOT.parent/'journeys.json').read_text(encoding='utf-8'))
    scenes=bundle['scenes']
    assert len(scenes)==60 and [s['id'] for s in scenes]==list(range(1,61))
    assert len({s['kind'] for s in scenes})==60
    for s in scenes:
        assert all(len(s[k])==3 for k in ['objects','before','after','steps'])
        assert len(s['choices'])==2 and len(s['details'])==2
    bundle['sourceGuide']='../guide.html#evidence'
    bundle['edition']='guided-experience-v4'
    lanes=[]
    for lane in range(6):
        subset=scenes[lane*10:(lane+1)*10]
        chips=''.join(f'<button type="button" class="idea-chip" data-pick="{s["id"]}"><span class="idea-spark" aria-hidden="true">✦</span>{esc(s["thought"])}<span class="idea-arrow" aria-hidden="true">↗</span></button>' for s in subset)
        repeat=''.join(f'<span class="idea-chip decorative" data-pick="{s["id"]}" aria-hidden="true"><span class="idea-spark">✦</span>{esc(s["thought"])}</span>' for s in subset)
        lanes.append(f'<div class="idea-lane lane-{lane}" style="--lane:{lane}"><div class="idea-track">{chips}{repeat}</div></div>')
    stars=''.join(f'<i style="--x:{(i*37+11)%100}%;--y:{(i*61+9)%100}%;--d:{i%7}s;--s:{1+i%3}px"></i>' for i in range(48))
    filters='<button type="button" data-category="all" class="category active" aria-pressed="true">全部 <span>60</span></button>'+''.join(f'<button type="button" data-category="{g["id"]}" class="category" aria-pressed="false">{esc(g["name"])}</button>' for g in bundle['categories'])
    library='\n'.join(f'<article class="library-card" data-id="{s["id"]}" data-category="{s["category"]}"><div class="library-art motif-{s["category"]}" aria-hidden="true"><span class="mini-item"></span><span class="mini-item"></span><span class="mini-item"></span><i></i></div><div class="library-info"><span class="library-number">{s["id"]:02} / {esc(s["categoryName"])}</span><h3>{esc(s["thought"])}</h3><p>{esc(s["title"])}</p><a href="../guide.html#scene-{s["id"]:02}" data-pick="{s["id"]}">从这个想法开始 <span aria-hidden="true">↗</span></a></div></article>' for s in scenes)
    serialized=json.dumps(bundle,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026')
    page=(ROOT/'journey-template.html').read_text(encoding='utf-8')
    for k,v in {'STARS':stars,'IDEA_LANES':'\n'.join(lanes),'CATEGORY_FILTERS':filters,'LIBRARY':library,'DATA':serialized}.items():page=page.replace('{{'+k+'}}',v)
    assert not re.search(r'\{\{[A-Z_]+\}\}',page)
    ids=re.findall(r'(?<![-\w])id="([^"\s]+)"',page)
    assert len(ids)==len(set(ids))
    assert set(re.findall(r'href="#([^"\s]+)"',page))<=set(ids)
    (ROOT/'index.html').write_text(page,encoding='utf-8')
    (ROOT/'journeys.json').write_text(json.dumps(bundle,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'built':True,'destination':'experience/index.html','scenes':60,'distinct_motion_scripts':60,'bytes':len(page.encode()),'root_homepage_changed':False}))
if __name__=='__main__':main()
