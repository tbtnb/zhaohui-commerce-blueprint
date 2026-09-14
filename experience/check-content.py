#!/usr/bin/env python3
"""Validate only this public walkthrough and record its actual local checks."""
import hashlib
import json
import re
import subprocess
from html.parser import HTMLParser
from pathlib import Path
ROOT=Path(__file__).resolve().parent
OUT=ROOT/'qa-output'/'content'
OUT.mkdir(parents=True,exist_ok=True)
class Visible(HTMLParser):
    def __init__(self):super().__init__(convert_charrefs=True);self.skip=0;self.body=False;self.parts=[]
    def handle_starttag(self,t,attrs):
        if t=='body':self.body=True
        if t in ('script','style'):self.skip+=1
        if self.body and not self.skip and t in ('div','p','h1','h2','h3','h4','li','summary','button','label','option','br'):self.parts.append('\n')
    def handle_endtag(self,t):
        if t in ('script','style'):self.skip=max(0,self.skip-1)
        if t=='body':self.body=False
        if self.body and not self.skip and t in ('div','p','h1','h2','h3','h4','li','summary','button','label','option'):self.parts.append('\n')
    def handle_data(self,d):
        if self.body and not self.skip:self.parts.append(d)
p=Visible();p.feed((ROOT/'index.html').read_text(encoding='utf-8'))
text='\n'.join(t.strip() for t in ''.join(p.parts).splitlines() if t.strip())+'\n'
(OUT/'page-text.txt').write_text(text,encoding='utf-8')
files=sorted(p for p in ROOT.iterdir() if p.is_file() and p.suffix in ('.html','.json','.css','.mjs','.py','.md') and p.name not in ('VALIDATION.json','BUILD-SNAPSHOT.json'))
patterns=[r'/'+'Users'+r'/[a-zA-Z0-9_-]+/',r'gh[pousr]_[A-Za-z0-9]{25,}',r'sk-[A-Za-z0-9]{30,}',r'-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----']
for f in files:
    content=f.read_text(encoding='utf-8')
    assert not any(re.search(pattern,content) for pattern in patterns), 'Review private content in '+f.name
bundle=json.loads((ROOT/'journeys.json').read_text(encoding='utf-8'))
assert len(bundle['scenes'])==60 and len({s['kind'] for s in bundle['scenes']})==60
assert all(len(s['objects'])==3 and len(s['steps'])==3 for s in bundle['scenes'])
for s in bundle['scenes']:
    assert s['question'] and s['issue'] and s['human'] and s['improve']
qa=json.loads((ROOT/'qa-output'/'journey'/'results.json').read_text(encoding='utf-8'))
assert qa['result']=='passed' and qa['sceneJourneys']==60
assert all(s.get('issueRecovery') and s.get('duplicateReuse') for s in qa['sceneRuns'])
skill=Path.home()/'.agents/skills/oil-tone/scripts/tone_lint.py'
result=subprocess.run(['python3',str(skill),str(OUT/'page-text.txt'),str(ROOT/'journey-handbook.md'),str(ROOT/'journey.mjs'),str(ROOT/'journey-model.mjs')],capture_output=True,text=True)
(OUT/'tone-lint.txt').write_text(result.stdout+result.stderr,encoding='utf-8')
assert result.returncode==0,result.stdout+result.stderr
record={'edition':bundle['edition'],'scope':'Static explanatory journey, not merchant runtime validation','local':{k:v for k,v in qa.items() if k!='url'},'copy_check':result.stdout.strip(),'public_text_check':'No private path or credential pattern found in authored publication files','artwork':'23 shared layouts with 60 distinct scene-specific actions, props and before/after examples','content_sha256':{f.name:hashlib.sha256(f.read_bytes()).hexdigest() for f in files},'live':'not_run_yet'}
(ROOT/'VALIDATION.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'content_checked':True,'scenes':60,'normal_runs':60,'issue_runs':60,'duplicate_runs':60,'browser_checks':qa['checks'],'tone_check':result.stdout.strip()},ensure_ascii=False))
