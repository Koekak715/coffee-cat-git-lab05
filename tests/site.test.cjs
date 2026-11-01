'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'site/index.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'site/script.js'), 'utf8');

// A deliberately small DOM model: these are logic tests, not browser layout tests.
function fixture(clipboardFails = false) {
  class Element {
    constructor(dataset = {}) {
      this.dataset = dataset; this.attributes = {}; this.listeners = {};
      this.children = []; this.hidden = false; this.textContent = ''; this.top = 1000;
      const classes = new Set();
      this.classList = {add: x => classes.add(x), remove: x => classes.delete(x),
        contains: x => classes.has(x), toggle(x, force) {
          const next = force === undefined ? !classes.has(x) : force;
          if(next)classes.add(x);else classes.delete(x);return next;
        }};
    }
    setAttribute(k,v){this.attributes[k]=v;}
    getAttribute(k){return this.attributes[k] ?? null;}
    removeAttribute(k){delete this.attributes[k];}
    addEventListener(k,fn){(this.listeners[k] ??= []).push(fn);}
    fire(k,event = {}){return Promise.all((this.listeners[k] ?? []).map(fn=>fn({target:this,...event})));}
    querySelectorAll(){return this.children;}
    replaceChildren(){this.children=[];}
    append(el){this.children.push(el);}
    contains(el){return this===el||this.children.includes(el);}
    focus(){document.activeElement=this;}
    getBoundingClientRect(){return {top:this.top,bottom:this.bottom??90,left:0,right:500};}
    showModal(){this.open=true;}
    close(){this.open=false;this.fire('close');}
  }
  const single = Object.fromEntries(['.menu-toggle','.navigation','.header','#filter-status',
    '#details-dialog','#dialog-title','#dialog-eyebrow','#dialog-content','#loyalty-details',
    '.dialog-close','.dialog-done','#copy-address','#copy-status','#year'].map(k=>[k,new Element()]));
  const navHtml = html.match(/<nav\b[^>]*>[\s\S]*?<\/nav>/)[0];
  const links = [...navHtml.matchAll(/href="(#[^"]+)"/g)].map(m=>Object.assign(new Element(),{hash:m[1]}));
  single['.navigation'].children=links;
  const filters = [...html.matchAll(/data-filter="([^"]+)"/g)].map(m=>new Element({filter:m[1]}));
  const cards = [...html.matchAll(/<article\b[^>]*data-category="([^"]+)"/g)].map(m=>new Element({category:m[1]}));
  const drinks = [...html.matchAll(/data-drink="([^"]+)"/g)].map(m=>new Element({drink:m[1]}));
  const offers = [...html.matchAll(/data-offer="([^"]+)"/g)].map(m=>new Element({offer:m[1]}));
  const sections = [...html.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map((m,i)=>Object.assign(new Element(),{id:m[1],top:i*700}));
  const multiple={'.filter':filters,'.drink-card':cards,'[data-drink]':drinks,'[data-offer]':offers,'main section[id]':sections};
  const document = new Element();
  Object.assign(document,{body:new Element(),documentElement:new Element(),activeElement:null,
    querySelector: selector=>{assert.ok(single[selector],`Unhandled selector ${selector}`);return single[selector];},
    querySelectorAll: selector=>multiple[selector]??[],createElement:()=>new Element()});
  const window = new Element();
  Object.assign(window,{scrollY:0,matchMedia:()=>({matches:false,addEventListener(){}})});
  let copied;
  vm.runInNewContext(source,{document,window,navigator:{clipboard:{async writeText(value){
    if(clipboardFails)throw new Error('denied');copied=value;
  }}},queueMicrotask,requestAnimationFrame:fn=>fn(),Date});
  return {document,window,single,links,filters,cards,drinks,offers,sections,get copied(){return copied;}};
}

test('filters show all six, five coffee drinks and one drink without coffee',async()=>{
  const f=fixture();
  for(const [filter,expected] of [['all',6],['coffee',5],['without-coffee',1]]){
    const button=f.filters.find(x=>x.dataset.filter===filter);await button.fire('click');
    assert.equal(f.cards.filter(x=>!x.hidden).length,expected);
    assert.equal(f.single['#filter-status'].textContent,`Показано напитков: ${expected}`);
    assert.equal(f.filters.filter(x=>x.getAttribute('aria-pressed')==='true').length,1);
  }
});
test('mobile navigation closes on Escape and restores toggle focus',async()=>{
  const f=fixture(),toggle=f.single['.menu-toggle'];await toggle.fire('click');
  assert.equal(toggle.getAttribute('aria-expanded'),'true');
  await f.document.fire('keydown',{key:'Escape'});
  assert.equal(toggle.getAttribute('aria-expanded'),'false');assert.equal(f.document.activeElement,toggle);
  assert.equal(f.document.body.classList.contains('nav-open'),false);
});
test('moving focus outside navigation removes the scroll lock',async()=>{
  const f=fixture();await f.single['.menu-toggle'].fire('click');
  f.document.activeElement=f.single['#copy-address'];await f.single['.navigation'].fire('focusout');
  await new Promise(resolve=>queueMicrotask(resolve));
  assert.equal(f.document.body.classList.contains('nav-open'),false);
});
test('all six drink buttons open details and closing restores their focus',async()=>{
  const f=fixture();assert.equal(f.drinks.length,6);
  for(const button of f.drinks){
    button.focus();await button.fire('click');assert.equal(f.single['#details-dialog'].open,true);
    assert.ok(f.single['#dialog-title'].textContent);
    assert.ok(f.single['#dialog-content'].children.some(p=>p.textContent.includes('Состав:')));
    await f.single['.dialog-close'].fire('click');assert.equal(f.single['#details-dialog'].open,false);
    assert.equal(f.document.activeElement,button);
  }
});
test('offer and loyalty rules remain available through their buttons',async()=>{
  const f=fixture();assert.equal(f.offers.length,3);
  for(const button of [...f.offers,f.single['#loyalty-details']]){
    await button.fire('click');assert.equal(f.single['#details-dialog'].open,true);
    assert.ok(f.single['#dialog-content'].children.length>=3);await f.single['.dialog-done'].fire('click');
  }
});
test('copy address handles both success and denied clipboard access',async()=>{
  const ok=fixture();await ok.single['#copy-address'].fire('click');assert.ok(ok.copied.includes('демонстрационный'));
  const denied=fixture(true);await denied.single['#copy-address'].fire('click');
  assert.ok(denied.single['#copy-status'].textContent.includes('Адрес для копирования:'));
});
test('current navigation follows section positions relative to the header',async()=>{
  const f=fixture();f.sections.forEach(x=>{x.top=1000;});
  f.sections.find(x=>x.id==='about').top=-200;f.sections.find(x=>x.id==='menu').top=80;
  await f.window.fire('scroll');assert.equal(f.links.find(x=>x.hash==='#menu').getAttribute('aria-current'),'location');
  f.sections.find(x=>x.id==='menu').top=200;await f.window.fire('resize');
  assert.equal(f.links.find(x=>x.hash==='#about').getAttribute('aria-current'),'location');
});
