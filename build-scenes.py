#!/usr/bin/env python3
"""Build the static scene guide and its readable handout. No business access."""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FIELDS = [('moment', '遇到的情况'), ('inputs', '需要准备的资料'), ('watch', '怎样发现问题'), ('act', '昭回可以帮什么'), ('deliver', '具体例子'), ('learn', '怎样根据反馈改进'), ('human', '需要你确认的事情'), ('metric', '怎样判断有没有帮助')]
MODE_LABELS = {'file': '可先用文件尝试', 'read': '需要最新店铺资料'}
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
<details id="scene-{num}"><summary><div class="scene-meta"><span class="scene-number">{num}</span><span class="mode mode-{s['mode']}">{MODE_LABELS[s['mode']]}</span></div><h3>{esc(s['title'])}</h3><p class="scene-ask">{esc(s['ask'])}</p><span class="scene-open-hint">查看准备步骤和例子 <b aria-hidden="true">＋</b></span></summary>
<div class="scene-body"><p class="platform-note">可能适用的平台：{esc(' / '.join(s['platforms']))}。使用前仍要确认店铺允许读取哪些资料。</p>{fields}<div class="scene-evidence">参考资料 {refs(s['sources'])}</div></div></details>
<div class="scene-actions"><button type="button" class="add-scene" data-add="{s['id']}" aria-pressed="false" aria-label="加入场景 {num}：{esc(s['title'])}">加入我的方案 <span aria-hidden="true">＋</span></button><a href="#scene-{num}" aria-label="查看场景 {num}">#{num}</a></div></article>'''

def preset_card(p, scenes):
    links = ' '.join(f'<a class="scene-jump" href="#scene-{i:02}" title="{esc(scenes[i]["title"])}">{i:02}</a>' for i in p['ids'])
    return f'''<article class="preset-card"><p class="micro">{esc(p['who'])}</p><h3>{esc(p['name'])}</h3><p>{esc(p['goal'])}</p><div class="preset-path">{esc(p['path'])}</div><details><summary>需要准备什么</summary><p><strong>准备资料：</strong>{esc(p['start'])}</p><p><strong>使用限制：</strong>{esc(p['boundary'])}</p></details><div class="preset-footer"><div class="preset-scenes">{links}</div><button class="preset-add" data-preset="{esc(p['id'])}" type="button">加入这套组合 ＋</button></div></article>'''

def source_item(s):
    title = esc(s.get('display_title', s['title']))
    if s.get('url'):
        assert s['url'].startswith('https://')
        title = f'<a href="{esc(s["url"])}" target="_blank" rel="noopener noreferrer">{title} ↗</a>'
    return f'<article class="source-item" id="evidence-{s["id"]}" data-evidence-type="{s["type"]}"><span>{s["id"]}</span><div><h4>{title}</h4><p>{esc(s["note"])}</p><p class="micro">{esc(s["level"])} · {esc(s["date"])}</p></div></article>'

def markdown_report(groups, sources, presets):
    lines = ['# 昭回 · 电商日常工作的 60 种 AI 用法', '', '昭回是一款 AI 助手。这份手册介绍怎样用它整理店铺待办、准备客服回复、核对商品资料和跟进售后。', '', '这里的场景是使用建议，需要结合店铺资料逐项尝试。先整理资料和草稿，发送消息、发布内容、修改库存等操作需要另外确认是否支持和是否允许。付款、退款和结算不在本方案范围内。', '', '标为“可先用文件尝试”的场景，可以先提供允许使用的表格和说明，遮去无关个人信息，再检查结果是否适合店铺。', '', '标为“需要最新店铺资料”的场景，要先确认能否读取当前订单、库存或聊天。旧文件只能说明导出时的情况，不能保证当前状态。', '', '## 常用组合', '']
    for p in presets:
        lines += [f'### {p["name"]}', p['who'], '', p['goal'], '', p['path'], '', '相关场景：' + '、'.join(f'{i:02}' for i in p['ids']), '', '准备资料：' + p['start'], '', '使用限制：' + p['boundary'], '']
    for g in groups:
        lines += [f'## {g["name"]}', '', g['intro'], '']
        for s in g['scenes']:
            lines += [f'### {s["id"]:02} · {s["title"]}', '', '**可以这样提出需求：**' + s['ask'], '', '准备方式：' + MODE_LABELS[s['mode']], '', '可能适用的平台：' + ' / '.join(s['platforms']) + '。使用前仍要确认店铺允许读取哪些资料。', '']
            for key, label in FIELDS:
                lines += [f'**{label}：**{s[key]}', '']
            lines += ['参考资料：' + ' '.join(f'[{i}]({BASE_URL}#evidence-{i})' for i in s['sources']), '']
    lines += ['## 参考资料', '', '以下资料说明相关经营问题和已有功能，具体组合办法是本手册的建议。部分来源只读到了摘要或入口，具体平台规则和店铺权限还要另行确认。例子用于说明方法，不是真实商家业绩。', '']
    for s in sources:
        title = s.get('display_title', s['title'])
        title = f'[{title}]({s["url"]})' if s.get('url') else title
        lines += [f'### {s["id"]} · {title}', s['level'] + ' · ' + s['date'], '', s['note'], '']
    lines += ['## 怎样开始使用', '', '向昭回说明要处理什么、涉及哪些店铺、可以提供什么资料、希望多久检查一次，以及哪些事情需要先问你。', '', '先确认条件，再用一份真实资料尝试。检查结果正确、有用以后，由你决定是否安排定时处理。本网页保存的方案只是需求说明，不会直接启动任务，也不会获得店铺权限。', '', '后续可以保存人工修改和处理进展，让昭回提出改进建议。正式商品说明、客服规则和读取工具的变化，需要确认和测试以后再使用。']
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
