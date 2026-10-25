// Veri gerektirmeyen arayüz: tema, mobil menü, menü çizgisi, karşılaştırma sepeti, çevrimdışı çalışma
window.toast=function(msg){
  let t=document.querySelector('.toast');
  if(!t){t=document.createElement('div');t.className='toast';t.setAttribute('role','status');document.body.appendChild(t)}
  t.textContent=msg;t.classList.add('in');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('in'),2600);
};
(function(){
  const ROOT=(document.currentScript&&document.currentScript.src||'').replace(/assets\/ui\.js.*$/,'');
  window.DG_ROOT=ROOT;
  // tema
  const btn=document.getElementById('themebtn');
  const eff=()=>document.documentElement.getAttribute('data-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  const sync=()=>{if(btn){const d=eff()==='dark';btn.setAttribute('aria-pressed',d);btn.setAttribute('aria-label',d?'Açık moda geç':'Karanlık moda geç');btn.title=d?'Açık mod':'Karanlık mod'}};
  if(btn){btn.addEventListener('click',()=>{const n=eff()==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',n);try{localStorage.setItem('dg-theme',n)}catch(e){}sync()});sync();matchMedia('(prefers-color-scheme: dark)').addEventListener('change',sync)}
  // mobil menü
  const mb=document.getElementById('menubtn'),mm=document.getElementById('mmenu');
  if(mb&&mm){
    const set=o=>{mm.hidden=!o;mb.setAttribute('aria-expanded',o);mb.setAttribute('aria-label',o?'Menüyü kapat':'Menüyü aç')};
    mb.addEventListener('click',()=>set(mm.hidden));
    addEventListener('keydown',e=>{if(e.key==='Escape'&&!mm.hidden){set(false);mb.focus()}});
    document.addEventListener('click',e=>{if(!mm.hidden&&!mm.contains(e.target)&&!mb.contains(e.target))set(false)});
  }
  addEventListener('scroll',()=>{const n=document.querySelector('.nav');if(n)n.classList.toggle('scrolled',scrollY>8)},{passive:true});
  // karşılaştırma sepeti (en fazla 4)
  const CK='dg-cmp';
  const get=()=>{try{const v=JSON.parse(localStorage.getItem(CK));return Array.isArray(v)?v.slice(0,4):[]}catch(e){return []}};
  const put=v=>{try{localStorage.setItem(CK,JSON.stringify(v))}catch(e){};drawBar();document.dispatchEvent(new CustomEvent('cmpchange'))};
  window.CMP={get,has:c=>get().some(x=>x.c===c),
    toggle(c,label){let v=get();if(v.some(x=>x.c===c))v=v.filter(x=>x.c!==c);else{if(v.length>=4){window.toast&&toast('En fazla 4 program karşılaştırabilirsin.');return false}v.push({c,l:label})}put(v);return true},
    clear(){put([])},set:put};
  function drawBar(){
    let bar=document.getElementById('cmpbar');const v=get();
    if(!v.length||/karsilastir\.html/.test(location.pathname)){bar&&bar.remove();return}
    if(!bar){bar=document.createElement('div');bar.id='cmpbar';bar.className='cmpbar';document.body.appendChild(bar)}
    bar.innerHTML=`<span><b>${v.length}</b> program karşılaştırmada</span><a class="btn primary sm" href="${ROOT}karsilastir.html?k=${v.map(x=>x.c).join(',')}">Karşılaştır →</a><button type="button" aria-label="Karşılaştırmayı temizle">✕</button>`;
    bar.querySelector('button').onclick=()=>put([]);
  }
  drawBar();
  if('serviceWorker' in navigator && location.protocol==='https:' && location.hostname.endsWith('github.io')){
    addEventListener('load',()=>navigator.serviceWorker.register(ROOT+'sw.js').catch(()=>{}));
  }
})();
