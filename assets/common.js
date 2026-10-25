// Ortak yardımcılar: bölüm listesi, biçimlendirme, puan çubuğu, sorgu durumu
const CATS=[
  ['BM','Bilgisayar Mühendisliği'],['YM','Yazılım Mühendisliği'],['BB','Bilgisayar Bilimleri'],
  ['MBB','Matematik ve Bilgisayar Bilimleri'],['IBB','İstatistik ve Bilgisayar Bilimleri'],['IST','İstatistik'],
  ['BSM','Bilişim Sistemleri Mühendisliği'],['BST','Bilişim Sistemleri ve Teknolojileri'],
  ['BÖTE','Bilgisayar ve Öğretim Teknolojileri Öğretmenliği'],['YBS','Yönetim Bilişim Sistemleri']];
const CN=Object.fromEntries(CATS);
const LO=235,HI=360;
const pos=v=>(v-LO)/(HI-LO)*100;
const coll=new Intl.Collator('tr');
const low=s=>String(s).toLocaleLowerCase('tr');
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const f1=v=>v.toLocaleString('tr',{minimumFractionDigits:1,maximumFractionDigits:1});
const f3=v=>v==null?'–':v.toLocaleString('tr',{minimumFractionDigits:3,maximumFractionDigits:3});
const tr=n=>n.toLocaleString('tr');

function rangeBar(cls,a,b,label,extra=''){
  if(a==null) return `<div class="bar ${cls} ${extra}"><div class="tr"></div><span class="na">burslu kontenjan yok</span></div>`;
  const L=pos(a),W=Math.max(pos(b)-pos(a),0);
  const lb=label?`<span class="lb" style="${pos(b)>76?`right:${(100-L+1.5).toFixed(2)}%`:`left:calc(${pos(b).toFixed(2)}% + 16px)`}">${label}</span>`:'';
  return `<div class="bar ${cls} ${extra}"><div class="tr"></div><div class="rg" style="left:${L.toFixed(2)}%;width:${W.toFixed(2)}%"></div>${lb}</div>`;
}
function catStats(c,t){
  const L=DATA.filter(r=>r[6]===c&&(!t||r[0]===t));
  const m=L.map(r=>r[8]).filter(v=>v!=null);
  return {n:L.length,k:L.reduce((s,r)=>s+r[5],0),min:m.length?Math.min(...m):null,max:m.length?Math.max(...m):null,pt:(DATA.find(r=>r[6]===c)||[])[4]};
}

// Sorgu durumu: önce adres satırı, yoksa oturum belleği
function readQuery(){
  const p=new URLSearchParams(location.search);
  if(p.get('b')){
    return {b:p.get('b').split(',').filter(c=>CN[c]),t:['all','D','V'].includes(p.get('t'))?p.get('t'):'all',q:p.get('q')||'',s:p.get('s')||'uni'};
  }
  try{const s=JSON.parse(sessionStorage.getItem('dg-q'));if(s&&Array.isArray(s.b))return s}catch(e){}
  return null;
}
function saveQuery(st){try{sessionStorage.setItem('dg-q',JSON.stringify(st))}catch(e){}}
function queryUrl(page,st){
  const p=new URLSearchParams({b:st.b.join(','),t:st.t});
  if(st.q)p.set('q',st.q); if(st.s&&st.s!=='uni')p.set('s',st.s);
  return `${page}?${p}`;
}
// data-b taşıyan bağlantılar sorguyu belleğe yazar (adres satırı parametresi taşınmasa da çalışsın)
document.addEventListener('click',e=>{
  const a=e.target.closest('a[data-b]');
  if(a) saveQuery({b:a.dataset.b.split(','),t:a.dataset.t||'all',q:'',s:'uni'});
});
// kaydırınca menü çizgisi
addEventListener('scroll',()=>{const n=document.querySelector('.nav');if(n)n.classList.toggle('scrolled',scrollY>8)},{passive:true});
// çevrimdışı çalışma (yalnızca kendi alan adında)
if('serviceWorker' in navigator && location.protocol==='https:' && location.hostname.endsWith('github.io')){
  addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
}
