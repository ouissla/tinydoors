import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function app() {
  const context = vm.createContext({ URL, URLSearchParams, structuredClone,
    location: { search: '', href: 'https://tinydoors.test/' }, navigator: { languages: ['en'] },
    document: { documentElement: {} }, localStorage: { getItem: () => null, setItem() {} },
  });
  context.window = context;
  for (const file of ['i18n.js', 'locales/fr.js', 'util.js', 'content.js']) {
    vm.runInContext(readFileSync(new URL('../js/' + file, import.meta.url), 'utf8'), context);
  }
  return context.Advent;
}

test('12-day schedules open precisely on their chosen dates', () => {
  const A = app();
  const late = { days: Array(12), schedule: 'daily' };
  const alternate = { days: Array(12), schedule: 'alternate' };
  assert.deepEqual(Array.from({length:12}, (_,i) => A.doorDate(late, i+1)), Array.from({length:12}, (_,i) => i+13));
  assert.deepEqual(Array.from({length:12}, (_,i) => A.doorDate(alternate, i+1)), Array.from({length:12}, (_,i) => i === 11 ? 24 : i*2+1));
  for (let day = -20; day <= 40; day++) {
    assert.equal(A.availableDoors(late, day), Math.max(0, Math.min(12, day-12)));
    assert.equal(A.availableDoors(alternate, day), day >= 24 ? 12 : Math.max(0, Math.min(11, Math.ceil(day/2))));
    assert.equal(A.availableDoors({days:Array(24)}, day), Math.max(0,Math.min(24, day)));
  }
});

test('all short packs include a welcome and finale without the 24-day halfway note', () => {
  const A = app();
  for (const theme of A.THEME_ORDER) {
    const days = A.presetDays(theme, 12);
    assert.equal(days.length, 12);
    assert.equal(days[0].type, 'message');
    assert.equal(days[11].type, 'finale');
    days[0].text = 'changed';
    assert.notEqual(A.CONTENT[theme][0].text, 'changed');
  }
});

test('switching lengths preserves hidden edits and carries new edits back to the long calendar', () => {
  const A = app();
  const cal = { theme: 'snow', days: A.presetDays('snow') };
  cal.days[19] = {type:'link',url:'https://example.com',personal:true};
  cal.days[23] = {type:'finale',text:'Final letter',personal:true};
  cal.days = A.resizeDays(cal, 12, 'snow');
  cal.days[1] = {type:'video',videoId:'clip',personal:true};
  cal.days = A.resizeDays(cal, 24, 'snow');
  assert.equal(cal.days[19].url, 'https://example.com');
  assert.equal(cal.days[1].videoId, 'clip');
  assert.equal(cal.days[23].text, 'Final letter');
  const short = {days:A.presetDays('snow',12)};
  short.days[11] = {type:'finale',text:'Last',personal:true};
  short.days = A.resizeDays(short,24,'snow');
  assert.equal(short.days[23].text,'Last');
  assert.notEqual(short.days[11].type,'finale');
});

test('links accept YouTube and other websites, reject executable and credentialed URLs', () => {
  const A = app();
  for (const url of ['https://youtu.be/abc', 'https://example.com/a?q=test', 'http://example.com']) assert.ok(A.safeLink(url));
  for (const url of ['javascript:alert(1)', 'data:text/html,hi', '//example.com', 'https://user:password@example.com', 'not a URL']) assert.equal(A.safeLink(url),null);
});

function camera({ pending = false, unsupported = false } = {}) {
  const timers = new Map(), tracks = [{stopped:false,stop(){this.stopped=true;}}];
  const state = {complete:[], errors:0, ticks:[], ready:0};
  let grant;
  const stream = {getTracks:()=>tracks};
  const preview = {removeAttribute(){}, async play(){}, srcObject:null};
  class Recorder {
    static isTypeSupported(type) { return type.startsWith('video/webm'); }
    constructor(s,opts) { this.mimeType=opts.mimeType; this.state='inactive'; }
    start(){this.state='recording';}
    stop(){this.state='inactive';this.ondataavailable({data:new Blob(['clip'])});this.onstop();}
  }
  const window = {Advent:{},MediaRecorder:unsupported?undefined:Recorder,addEventListener(){},removeEventListener(){}};
  const ctx = vm.createContext({window,MediaRecorder:Recorder,Blob,performance:{now:()=>0},navigator:{mediaDevices:{getUserMedia:()=>pending?new Promise(r=>{grant=r;}):Promise.resolve(stream)}},
    setTimeout:(fn,ms)=>{timers.set(ms,fn);return ms;},clearTimeout:(id)=>timers.delete(id),setInterval:()=>1,clearInterval(){},
  });
  vm.runInContext(readFileSync(new URL('../js/video-recorder.js',import.meta.url),'utf8'),ctx);
  const recording=window.Advent.recordVideo({preview,onComplete:blob=>state.complete.push(blob),onError:()=>state.errors++,onTick:n=>state.ticks.push(n),onReady:()=>state.ready++});
  return {recording,state,timers,tracks,grant:()=>grant(stream),preview};
}
const flush = async () => { for(let i=0;i<6;i++) await Promise.resolve(); };

test('recording automatically stops at 10 seconds and releases the camera',async()=>{
 const c=camera(); await flush();
 assert.equal(c.state.ready,1);
 assert.ok(c.timers.has(10000));
 c.timers.get(10000)();
 assert.equal(c.state.complete.length,1);
 assert.equal(c.state.complete[0].type,'video/webm');
 assert.ok(c.tracks.every(t=>t.stopped));
 assert.equal(c.preview.srcObject,null);
});
test('stopping early saves once; cancelling does not save',async()=>{
 const c=camera();await flush();c.recording.stop();c.recording.stop();
 assert.equal(c.state.complete.length,1);
 const cancelled=camera();await flush();cancelled.recording.cancel();
 assert.equal(cancelled.state.complete.length,0);
 assert.ok(cancelled.tracks.every(t=>t.stopped));
});
test('closing while permission is pending releases the eventual stream without saving',async()=>{
 const c=camera({pending:true});await flush();c.recording.cancel();c.grant();await flush();
 assert.ok(c.tracks.every(t=>t.stopped));assert.equal(c.state.ready,0);assert.equal(c.state.complete.length,0);
});
test('unsupported browsers report an error without starting the camera',async()=>{
 const c=camera({unsupported:true});await flush();assert.equal(c.state.errors,1);assert.equal(c.state.ready,0);
});
