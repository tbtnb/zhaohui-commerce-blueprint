#!/usr/bin/env python3
"""Build the scene-first public report. Standard library only; no business access."""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FIELDS = [('moment', '遇到什么事'), ('inputs', '先准备什么'), ('watch', '昭回怎么发现'), ('act', '先替你做到哪一步'), ('deliver', '你会拿到什么'), ('learn', '下一轮怎么改进'), ('human', '什么时候交给人'), ('metric', '怎样判断有用')]
MODE_LABELS = {'file': '文件可试搭', 'read': '需核验新鲜读取'}
PLATFORMS = ['淘宝天猫', '拼多多', '抖店', '小红书', '京东', '快手', '微信小店', '1688采购']
BASE_URL = 'https://tbtnb.github.io/zhaohui-commerce-blueprint/'

def esc(value):
    return html.escape(str(value), quote=True)

def refs(ids):
    return ' '.join(f'<a class="evidence-link" href="#evidence-{esc(i)}">[{esc(i)}]</a>' for i in ids)

def scene_card(s, category):
    num = f'{s["id"]:02}'
    fields = ''.join(f'<div class="scene-field field-{key}"><h4>{label}</h4><p>{esc(s[key])}</p></div>' for key, label in FIELDS)
    return f'''<article class="scene-card" data-scene-id="{s['id']}" data-category="{esc(category)}" data-mode="{s['mode']}" data-platforms="{esc('|'.join(s['platforms']))}">
<details id="scene-{num}"><summary><div class="scene-meta"><span class="scene-number">{num}</span><span class="mode mode-{s['mode']}">{MODE_LABELS[s['mode']]}</span></div><h3>{esc(s['title'])}</h3><p class="scene-ask">“{esc(s['ask'])}”</p><span class="scene-open-hint">展开应用与改进路径 <b aria-hidden="true">＋</b></span></summary>
<div class="scene-body"><p class="platform-note">适用经营情境：{esc(' / '.join(s['platforms']))}。不是平台已接通标识。</p>{fields}<div class="scene-evidence">经营参考与能力边界 {refs(s['sources'])}</div></div></details>
<div class="scene-actions"><button type="button" class="add-scene" data-add="{s['id']}" aria-pressed="false" aria-label="加入场景{num}：{esc(s['title'])}">加入我的方案 <span aria-hidden="true">＋</span></button><a href="#scene-{num}" aria-label="定位场景{num}">#{num}</a></div></article>'''

def preset_card(p, scenes):
    links = ' '.join(f'<a class="scene-jump" href="#scene-{i:02}" title="{esc(scenes[i]["title"])}">{i:02}</a>' for i in p['ids'])
    return f'''<article class="preset-card"><p class="micro">{esc(p['who'])}</p><h3>{esc(p['name'])}</h3><p>{esc(p['goal'])}</p><div class="preset-path">{esc(p['path'])}</div><details><summary>第一份资料与使用边界</summary><p><strong>从这里开始：</strong>{esc(p['start'])}</p><p><strong>需要确认：</strong>{esc(p['boundary'])}</p></details><div class="preset-footer"><div class="preset-scenes">{links}</div><button class="preset-add" data-preset="{esc(p['id'])}" type="button">加入这套组合 ＋</button></div></article>'''

def source_item(s):
    title = esc(s['title'])
    if s.get('url'):
        assert s['url'].startswith('https://')
        title = f'<a href="{esc(s["url"])}" target="_blank" rel="noopener noreferrer">{title} ↗</a>'
    location = f'<code>{esc(s["path"])}</code>' if s.get('path') else ''
    return f'<article class="source-item" id="evidence-{s["id"]}" data-evidence-type="{s["type"]}"><span>{s["id"]}</span><div><h4>{title}</h4><p>{esc(s["note"])}</p>{location}<p class="micro">{esc(s["level"])} · {esc(s["date"])}</p></div></article>'

def markdown_report(groups, sources, presets):
    lines = ['# 昭回 · 60个国内电商AI应用场景', '', '研究日期：2026-09-14。场景设计与静态方案组合器，不是60个已安装功能。', '', '默认只读、工作区清单与草稿，不接财务，不自动发货、改价、发布、退款或群发。具体数据授权与场景运行必须验证。', '', '文件可试搭：先用商家合法提供的脱敏文件、工作区状态和已具备的Timer/文件Listener；不等于已经完成场景验收。', '', '需核验新鲜读取：时效型用途必须取得目标平台/ERP/通道的当前授权与真实回执；文件版只能给截至导出时的结果。', '', '## 从一套组合开始', '']
    for p in presets:
        lines += [f'### {p["name"]}', p['who'], '', p['goal'], '', p['path'], '', '场景：' + '、'.join(f'{i:02}' for i in p['ids']), '', '准备：' + p['start'], '', '边界：' + p['boundary'], '']
    for g in groups:
        lines += [f'## {g["name"]}', '', g['intro'], '']
        for s in g['scenes']:
            lines += [f'### {s["id"]:02} · {s["title"]}', '', '**用户可以这样说：**' + s['ask'], '', '起步方式：' + MODE_LABELS[s['mode']], '', '适用情境：' + ' / '.join(s['platforms']) + '（不代表平台已接通）', '']
            for key, label in FIELDS:
                lines += [f'**{label}：**{s[key]}', '']
            lines += ['依据：' + ' '.join(f'[{i}]({BASE_URL}#evidence-{i})' for i in s['sources']), '']
    lines += ['## 研究依据与限制', '', '来源只支持相应的经营问题或能力边界；每条场景的组合方式、产物与迭代方法是本报告设计。索引摘要/入口不等于完整规则或账号权限。', '']
    for s in sources:
        title = f'[{s["title"]}]({s["url"]})' if s.get('url') else s['title']
        lines += [f'### {s["id"]} · {title}', s['level'] + ' · ' + s['date'], '', s['note'], '', s.get('path', ''), '']
    lines += ['## 交给昭回的任务说明应包含', '', '经营目标、店铺范围、资料位置、数据时效、触发节奏、所选场景、期望产物、人工批准边界、反馈与验收条件。', '', '先盘点现有能力并做一次真实资料试跑。之后才根据授权注册Timer/Listener。导出的组合说明不是当前App的运行配置，也不授予任何平台权限。', '', '自我迭代先自动记录观察与形成候选；正式政策、SKU映射、客服知识和生产连接器变更需人工批准、对照验证，再观察实际结果。']
    return '\n'.join(lines) + '\n'

def main():
    groups = [json.loads(p.read_text(encoding='utf-8')) for p in sorted((ROOT / 'scene-data').glob('*.json'))]
    sources = json.loads((ROOT / 'scene-sources.json').read_text(encoding='utf-8'))
    config = json.loads((ROOT / 'scene-config.json').read_text(encoding='utf-8'))
    scenes = {s['id']: s for g in groups for s in g['scenes']}
    assert len(groups) == 10 and set(scenes) == set(range(1,61))
    assert sum(len(g['scenes']) for g in groups) == 60
    evidence_ids = {s['id'] for s in sources}
    assert len(evidence_ids) == len(sources)
    for s in scenes.values():
        assert s['mode'] in MODE_LABELS and set(s['platforms']) <= set(PLATFORMS)
        assert all(isinstance(s[key], str) and len(s[key]) >= 12 for key,_ in FIELDS)
        assert set(s['sources']) <= evidence_ids
        if 49 <= s['id'] <= 52 and 'R19' not in s['sources']:
            s['sources'].append('R19')
    for p in config['presets']:
        assert set(p['ids']) <= set(scenes) and len(p['ids']) == len(set(p['ids']))
    bundle = {**config, 'status': 'scenario_design_not_installed_features', 'groups': groups, 'sources': sources}
    serialized = json.dumps(bundle, ensure_ascii=False, separators=(',', ':'))
    fragments = {
      'CATEGORY_FILTERS': '<button class="category-filter active" data-category="all" type="button" aria-pressed="true">全部场景 <span>60</span></button>' + ''.join(f'<button class="category-filter" data-category="{g["id"]}" type="button" aria-pressed="false">{esc(g["name"])} <span>{len(g["scenes"])}</span></button>' for g in groups),
      'PLATFORM_OPTIONS': ''.join(f'<option value="{esc(p)}">{esc(p)}</option>' for p in PLATFORMS),
      'SCENE_GROUPS': '\n'.join(f'<section class="scene-group" id="group-{g["id"]}" data-group="{g["id"]}"><div class="group-heading"><span class="micro">{i+1:02} /</span><h3>{esc(g["name"])}</h3><p>{esc(g["intro"])}</p></div><div class="scene-grid">' + '\n'.join(scene_card(s, g['id']) for s in g['scenes']) + '</div></section>' for i,g in enumerate(groups)),
      'PRESETS': '\n'.join(preset_card(p, scenes) for p in config['presets']),
      'SOURCES': '\n'.join(source_item(s) for s in sources),
      'SOURCE_COUNT': str(len(sources)),
      'REPORT_JSON': serialized.replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026'),
      'FILE_COUNT': str(sum(s['mode'] == 'file' for s in scenes.values())),
      'READ_COUNT': str(sum(s['mode'] == 'read' for s in scenes.values()))
    }
    page = (ROOT / 'scene-template.html').read_text(encoding='utf-8')
    for key,value in fragments.items():
        page = page.replace('{{'+key+'}}', value)
    assert not re.search(r'\{\{[A-Z_]+\}\}',page), 'Unresolved template fragment'
    ids = re.findall(r'(?<![-\w])id="([^"\s]+)"',page)
    targets = re.findall(r'href="#([^"\s]+)"',page)
    assert len(ids) == len(set(ids)), 'Duplicate IDs'
    assert set(targets) <= set(ids), sorted(set(targets) - set(ids))
    (ROOT / 'index.html').write_text(page,encoding='utf-8')
    (ROOT / 'scenarios.json').write_text(json.dumps(bundle,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (ROOT / 'scenarios.md').write_text(markdown_report(groups,sources,config['presets']),encoding='utf-8')
    print(json.dumps({'built':True,'scenes':len(scenes),'groups':len(groups),'presets':len(config['presets']),'sources':len(sources),'file_start':fragments['FILE_COUNT'],'fresh_read_required':fragments['READ_COUNT'],'html_bytes':len(page.encode())},ensure_ascii=False))

if __name__ == '__main__':
    main()
