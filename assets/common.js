// Ortak yardımcılar. Veri: assets/data.js içindeki D = {P,U,F,LA,ON,notes}
// P satırı: [tür(D/V/K), üniİdx, fakülteİdx, kod, ad, puanTürü, kont, alanKodu, burs(''|B|I50|I25|U), bakınızlar, yerleşen, enKüçük, enBüyük, açıköğretim(0/1)]
// ON satırı: [kod, ad, genelAlanKodları[], açıköğretimEkAlanKodları[]]
const LO=140,HI=360;
const pos=v=>Math.max(0,Math.min(100,(v-LO)/(HI-LO)*100));
const coll=new Intl.Collator('tr');
const low=s=>String(s).toLocaleLowerCase('tr');
const norm=s=>low(s).replace(/[çğıöşüâîû]/g,c=>({'ç':'c','ğ':'g','ı':'i','ö':'o','ş':'s','ü':'u','â':'a','î':'i','û':'u'}[c])).replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const f1=v=>v==null?'–':v.toLocaleString('tr',{minimumFractionDigits:1,maximumFractionDigits:1});
const f3=v=>v==null?'–':v.toLocaleString('tr',{minimumFractionDigits:3,maximumFractionDigits:3});
const tr=n=>n.toLocaleString('tr');
const TYPE={D:'Devlet',V:'Vakıf',K:'KKTC'};
const BURS={'':'',B:'Burslu',I50:'%50 indirimli',I25:'%25 indirimli',U:'Ücretli'};

// ön lisans anahtarı: kod + dipnot yıldızları (aynı kodlu özel satırları ayırmak için)
const onKey=o=>o[0]+'*'.repeat((o[1].match(/\*/g)||[]).length);
const ONBY=Object.fromEntries(D.ON.map(o=>[onKey(o),o]));
const ONIDX=D.ON.map(o=>({o,key:onKey(o),n:norm(o[1]+' '+o[0])}));
function searchOn(q,limit=8){
  const n=norm(q); if(!n) return [];
  const parts=n.split(' ');
  const hits=ONIDX.filter(x=>parts.every(p=>x.n.includes(p)));
  const sc=x=>(x.n.startsWith(n)?0:x.n.split(' ').some(w=>w.startsWith(parts[0]))?1:2);
  return hits.sort((a,b)=>sc(a)-sc(b)||coll.compare(a.o[1],b.o[1])).slice(0,limit);
}
// bir ön lisans bölümünden tercih edilebilecek programlar
function eligible(o,alanSel){
  const g=new Set(o[2]),a=new Set(o[3]);
  return D.P.filter(p=>(g.has(p[7])||(p[13]&&a.has(p[7])))&&(!alanSel||alanSel.has(p[7])));
}
function rangeBar(cls,a,b,extra=''){
  if(a==null) return `<div class="bar ${cls} ${extra}"><div class="tr"></div></div>`;
  const L=pos(a),W=Math.max(pos(b)-pos(a),0);
  return `<div class="bar ${cls} ${extra}"><div class="tr"></div><div class="rg" style="left:${L.toFixed(2)}%;width:${W.toFixed(2)}%"></div></div>`;
}
// sorgu durumu
const DEF={o:'',a:null,t:'DV',k:'B',q:'',s:'uni'};
function readQuery(){
  const p=new URLSearchParams(location.search);
  if(p.get('o')&&ONBY[p.get('o')]){
    return {o:p.get('o'),a:p.get('a')?p.get('a').split(',').filter(Boolean):null,t:p.get('t')||'DV',k:p.get('k')||'B',q:p.get('q')||'',s:p.get('s')||'uni'};
  }
  try{const s=JSON.parse(sessionStorage.getItem('dg-q'));if(s&&ONBY[s.o])return Object.assign({},DEF,s)}catch(e){}
  return null;
}
function saveQuery(st){try{sessionStorage.setItem('dg-q',JSON.stringify(st))}catch(e){}}
function queryUrl(page,st){
  const p=new URLSearchParams({o:st.o});
  if(st.a&&st.a.length)p.set('a',st.a.join(','));
  if(st.t&&st.t!=='DV')p.set('t',st.t);
  if(st.k&&st.k!=='B')p.set('k',st.k);
  if(st.q)p.set('q',st.q); if(st.s&&st.s!=='uni')p.set('s',st.s);
  return `${page}?${p}`;
}
// otomatik tamamlamalı arama kutusu
function autocomplete(input,list,onPick){
  let items=[],act=-1;
  const close=()=>{list.hidden=true;input.setAttribute('aria-expanded','false');act=-1};
  const draw=()=>{
    items=searchOn(input.value,8);
    if(!items.length){list.innerHTML=input.value.trim()?'<li class="none">Eşleşen bölüm yok. Farklı bir yazım dene.</li>':'';list.hidden=!input.value.trim();return}
    list.innerHTML=items.map((x,i)=>`<li role="option" id="${list.id}-${i}" aria-selected="${i===act}" data-i="${i}"><b>${esc(x.o[1])}</b><span>${x.o[0]} · ${x.o[2].length+x.o[3].length} lisans alanı</span></li>`).join('');
    list.hidden=false;input.setAttribute('aria-expanded','true');
  };
  input.addEventListener('input',()=>{act=-1;draw()});
  input.addEventListener('focus',()=>{if(input.value.trim())draw()});
  input.addEventListener('keydown',e=>{
    if(list.hidden&&e.key!=='Enter')return;
    if(e.key==='ArrowDown'){act=Math.min(act+1,items.length-1);e.preventDefault();draw();}
    else if(e.key==='ArrowUp'){act=Math.max(act-1,0);e.preventDefault();draw();}
    else if(e.key==='Enter'){if(items.length){e.preventDefault();pick(items[Math.max(act,0)])}}
    else if(e.key==='Escape'){close()}
    if(act>=0)input.setAttribute('aria-activedescendant',`${list.id}-${act}`);
  });
  list.addEventListener('mousedown',e=>{const li=e.target.closest('li[data-i]');if(li){e.preventDefault();pick(items[+li.dataset.i])}});
  document.addEventListener('click',e=>{if(!list.contains(e.target)&&e.target!==input)close()});
  function pick(x){input.value=x.o[1];close();onPick(x)}
}
const PBY=Object.fromEntries(D.P.map(p=>[p[3],p]));
const progUrl=c=>'program.html?k='+c;
const uniShort=u=>u.replace(/ ÜNİVERSİTESİ.*$/,'').replace(/(^|[\s-])([^\s-])([^\s-]*)/g,(m,a,b,c)=>a+b+c.toLocaleLowerCase('tr'));
// bir lisans programına hangi ön lisans bölümlerinden geçilebilir
function sourcesOf(p){return D.ON.filter(o=>o[2].includes(p[7])||(p[13]&&o[3].includes(p[7])))}
