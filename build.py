#!/usr/bin/env python3
"""Render an independently authored static report using the standard library."""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
NAV = [('reality','现实判断'),('platforms','平台接入'),('systems','系统分工'),('workflows','运营流程'),('architecture','架构与数据'),('onboarding','自动接入'),('lab','异常演示'),('observability','监控恢复'),('roadmap','实施路线'),('guardrails','自治边界'),('research','调研洞察'),('sources','证据索引')]

def esc(value):
    return html.escape(str(value), quote=True)

def refs(items):
    return ' '.join('<a class="ref" href="#source-' + esc(x) + '">[' + esc(x) + ']</a>' for x in items)

def render_platform(p):
    fields = [('建议接入路径','route'),('监听与补采','listen'),('准入与核验门槛','gate'),('不要承诺','boundary')]
    rows = ''.join('<dt>' + title + '</dt><dd>' + esc(p[key]) + '</dd>' for title,key in fields)
    return f'<details class="platform" data-region="{esc(p["region"])}"><summary><span class="tag {esc(p["tone"])}">{esc(p["tag"])}</span><h3>{esc(p["name"])}</h3><p>{esc(p["summary"])}</p></summary><div class="platform-body"><dl>{rows}</dl><div class="refs">{refs(p["refs"])}</div></div></details>'

def render_system(p):
    return f'<article class="system"><div class="system-top"><h3>{esc(p["name"])}</h3><span class="tag">{esc(p["label"])}</span></div><p>{esc(p["text"])}</p><p><strong>边界：</strong>{esc(p["limit"])} {refs(p["refs"])}</p><span class="fit">{esc(p["fit"])}</span></article>'

def render_flows(items):
    tabs, panels = [], []
    for i,p in enumerate(items):
        name = esc(p['id'])
        selected = str(i == 0).lower()
        tabs.append(f'<button type="button" role="tab" id="tab-{name}" aria-controls="flow-{name}" aria-selected="{selected}" tabindex="{0 if i == 0 else -1}"><span>{i+1:02}</span>{esc(p["name"])}</button>')
        fields = [('触发条件','trigger'),('依赖事实','facts'),('建议自动化范围','auto'),('人工与业务边界','human'),('验收与恢复','verify'),('对应项目落点','modules')]
        rows = ''.join('<dt>'+title+'</dt><dd>'+esc(p[key])+'</dd>' for title,key in fields)
        panels.append(f'<article class="flow-panel" id="flow-{name}" role="tabpanel" aria-labelledby="tab-{name}" tabindex="0"><p class="print-only">场景 {i+1:02} / {esc(p["name"])}</p><h3>{esc(p["title"])}</h3><p class="flow-lead">{esc(p["lead"])}</p><div class="flow-path">{esc(p["path"])}</div><dl>{rows}</dl><div class="flow-result"><b>观测指标</b>{esc(p["metric"])} {refs(p["refs"])}</div></article>')
    return '\n'.join(tabs), '\n'.join(panels)

def render_source(p):
    title = esc(p['title'])
    if p.get('url'):
        assert p['url'].startswith('https://')
        title = f'<a href="{esc(p["url"])}" target="_blank" rel="noopener noreferrer">{title} ↗</a>'
    path = '<p><code>'+esc(p['path'])+'</code></p>' if p.get('path') else ''
    return f'<article class="source" id="source-{esc(p["id"])}" data-type="{esc(p["type"])}"><span class="source-no">{esc(p["id"])}</span><div><h4>{title}</h4><p>{esc(p["note"])}</p>{path}<div class="source-meta">{esc(p["level"])} · {esc(p["date"])}</div></div></article>'

def main():
    data = json.loads((ROOT/'content.json').read_text(encoding='utf-8'))
    evidence = {x['id'] for x in data['sources']}
    assert len(evidence) == len(data['sources'])
    for group in ('platforms','systems','workflows'):
        for entry in data[group]:
            assert set(entry['refs']) <= evidence
    contract = {'capability':'commerce.product_facts.read','status':'proposed_not_implemented','scope':['tenant','shop','product_or_variant'],'effect':'data.read','transport':'official_api_or_approved_read_adapter','quality':['identity','provenance','freshness','coverage'],'failure':['needs_auth','stale','ambiguous','rate_limited'],'release':{'version':'candidate','writes':'deny'}}
    contract_text = json.dumps(contract,ensure_ascii=False,indent=2)
    (ROOT/'capability-example.json').write_text(contract_text+'\n',encoding='utf-8')
    tabs,panels = render_flows(data['workflows'])
    fragments = {
      'TOC': ''.join(f'<a href="#{x}"><span>{i+1:02}</span>{y}</a>' for i,(x,y) in enumerate(NAV)),
      'MOBILE_NAV': ''.join(f'<option value="{x}">{i+1:02} / {y}</option>' for i,(x,y) in enumerate(NAV)),
      'PLATFORMS': '\n'.join(map(render_platform,data['platforms'])),
      'SYSTEMS': '\n'.join(map(render_system,data['systems'])),
      'WORKFLOW_TABS':tabs,'WORKFLOWS':panels,
      'ENGINEERING':(ROOT/'engineering.html').read_text(encoding='utf-8'),
      'SOURCE_COUNT':str(len(evidence)),
      'SOURCES':'\n'.join(map(render_source,data['sources'])),
      'CONTRACT':esc(contract_text)
    }
    page = (ROOT/'template.html').read_text(encoding='utf-8')
    for key,value in fragments.items():
        page = page.replace('{{'+key+'}}',value)
    assert '{{' not in page and '}}' not in page
    ids = re.findall(r'id="([^"\s]+)"',page)
    targets = re.findall(r'href="#([^"\s]+)"',page)
    assert len(ids) == len(set(ids)), 'Duplicate IDs'
    assert set(targets) <= set(ids), 'Broken anchors'
    (ROOT/'index.html').write_text(page,encoding='utf-8')
    (ROOT/'.nojekyll').touch()
    from report_text import write_report
    write_report(ROOT,page)
    print(json.dumps({'built':True,'platforms':len(data['platforms']),'workflows':len(data['workflows']),'evidence':len(evidence),'html_bytes':len(page.encode()),'internal_anchors':len(targets)},ensure_ascii=False))

if __name__ == '__main__':
    main()
