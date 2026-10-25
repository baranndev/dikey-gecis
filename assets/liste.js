// Tercih listesi: durum hesabı, paylaşım bağlantısı, uyarı penceresi, PDF (karekodlu), kopyalama
const PT=['SAY','EA','SÖZ'];
const PKEY={SAY:'say',EA:'ea','SÖZ':'soz'};
const PBY=Object.fromEntries(D.P.map(p=>[p[3],p]));
const parseScore=v=>{if(v==null||v==='')return null;const n=parseFloat(String(v).replace(',','.'));return isFinite(n)&&n>0&&n<=600?n:null};
const STATUS={
  ok:{t:'Tabanın üstünde',d:'Puanın, 2026 yerleştirmesindeki en küçük puanın üstünde.'},
  near:{t:'Sınırda',d:'Puanın 2026 tabanının en fazla 5 puan altında.'},
  open:{t:'Kontenjan dolmadı',d:'2026 yerleştirmesinde bu programda boş kontenjan kaldı.'},
  low:{t:'Tabanın altında',d:'Puanın 2026 tabanının 5 puandan fazla altında.'},
  none:{t:'Puan yok',d:'Bu puan türünde puan girmedin.'}};
function statusOf(p,sc){
  const s=sc[p[5]];
  if(s==null) return 'none';
  if(p[11]==null||(p[10]!=null&&p[10]<p[6])) return 'open';
  if(s>=p[11]) return 'ok';
  if(s>=p[11]-5) return 'near';
  return 'low';
}
const diff=(p,sc)=>sc[p[5]]==null||p[11]==null?null:sc[p[5]]-p[11];
const fdiff=v=>v==null?'–':(v>=0?'+':'−')+Math.abs(v).toLocaleString('tr',{minimumFractionDigits:2,maximumFractionDigits:2});

// paylaşım bağlantısı
function listUrl(st){
  const p=new URLSearchParams();
  p.set('o',st.o);
  PT.forEach(t=>{if(st.sc[t]!=null)p.set(PKEY[t],String(st.sc[t]))});
  if(st.il&&st.il.length)p.set('il',st.il.join(','));
  if(st.t)p.set('t',st.t); if(st.k)p.set('k',st.k);
  p.set('p',st.list.join(','));
  p.set('d',st.d||new Date().toISOString().slice(0,10));
  const base=location.href.replace(/[^/]*([?#].*)?$/,'');
  return base+'liste.html?'+p.toString();
}
function readListUrl(){
  const p=new URLSearchParams(location.search);
  if(!p.get('p')||!ONBY[p.get('o')]) return null;
  const sc={};PT.forEach(t=>{sc[t]=parseScore(p.get(PKEY[t]))});
  return {o:p.get('o'),sc,il:p.get('il')?p.get('il').split(','):[],t:p.get('t')||'DV',k:p.get('k')||'B',list:p.get('p').split(',').filter(c=>PBY[c]),d:p.get('d')||''};
}

// uyarı penceresi
function confirmWarning(actionLabel){
  return new Promise(res=>{
    const w=document.createElement('div');w.className='modal-wrap';
    w.innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mt">
      <div class="m-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18.2A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg></div>
      <h2 id="mt">Önemli bilgilendirme</h2>
      <ul>
        <li>Bu liste <b>resmi bir belge değildir</b> ve ÖSYM'ye tercih olarak iletilmez.</li>
        <li>Veriler ÖSYM'nin yayımladığı belgelerden otomatik derlenmiştir; <b>hata, eksik veya güncel olmayan bilgi içerebilir.</b></li>
        <li>2026 yerleştirme puanları sonraki yılların sonuçlarını göstermez.</li>
        <li>Tercihlerini ÖSYM'nin resmi tercih ekranından yapmalı; kontenjan ve koşulları <b>osym.gov.tr</b> adresinden kontrol etmelisin.</li>
      </ul>
      <label class="m-ck"><input type="checkbox" id="mck"> Okudum, anladım.</label>
      <div class="m-act"><button type="button" class="btn ghost" id="mno">Vazgeç</button><button type="button" class="btn primary" id="myes" disabled>${esc(actionLabel)}</button></div>
    </div>`;
    document.body.appendChild(w);
    const prevFocus=document.activeElement;
    requestAnimationFrame(()=>w.classList.add('in'));
    const ck=w.querySelector('#mck'),yes=w.querySelector('#myes');
    ck.addEventListener('change',()=>{yes.disabled=!ck.checked});
    setTimeout(()=>ck.focus(),60);
    const close=v=>{w.classList.remove('in');setTimeout(()=>{w.remove();prevFocus&&prevFocus.focus&&prevFocus.focus()},220);res(v)};
    w.querySelector('#mno').onclick=()=>close(false);
    yes.onclick=()=>close(true);
    w.addEventListener('click',e=>{if(e.target===w)close(false)});
    w.addEventListener('keydown',e=>{if(e.key==='Escape')close(false)});
  });
}
function toast(msg){
  let t=document.querySelector('.toast');
  if(!t){t=document.createElement('div');t.className='toast';t.setAttribute('role','status');document.body.appendChild(t)}
  t.textContent=msg;t.classList.add('in');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('in'),2600);
}
async function copyLink(url){
  try{await navigator.clipboard.writeText(url);toast('Bağlantı kopyalandı.');return true}
  catch(e){
    const ta=document.createElement('textarea');ta.value=url;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();
    let ok=false;try{ok=document.execCommand('copy')}catch(_){}
    ta.remove();
    if(ok){toast('Bağlantı kopyalandı.');return true}
    prompt('Bağlantıyı kopyala:',url);return false;
  }
}
// kütüphaneleri gerektiğinde yükle
const loaded={};
function loadScript(src){return loaded[src]||(loaded[src]=new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>{delete loaded[src];no(new Error(src))};document.head.appendChild(s)}))}
async function qrSvg(text,cell=4){
  await loadScript('assets/vendor/qrcode.js');
  const q=qrcode(0,'M');q.addData(unescape(encodeURIComponent(text)));q.make();
  return q.createSvgTag({cellSize:cell,margin:2,scalable:true});
}
async function downloadPdf(st,url){
  toast('PDF hazırlanıyor…');
  await loadScript('assets/vendor/pdfmake.min.js');await loadScript('assets/vendor/vfs_fonts.js');
  const o=ONBY[st.o];const rows=st.list.map(c=>PBY[c]).filter(Boolean);
  const scTxt=PT.filter(t=>st.sc[t]!=null).map(t=>`${t}: ${st.sc[t].toLocaleString('tr',{maximumFractionDigits:5})}`).join('   ')||'Girilmedi';
  const crit=[st.il&&st.il.length?'İller: '+st.il.join(', '):'Tüm iller',[...(st.t||'DV')].map(t=>TYPE[t]).join(', '),'Vakıf/KKTC: '+[...(st.k||'B')].map(k=>({B:'burslu',I:'indirimli',U:'ücretli'}[k])).join(', ')].join(' · ');
  const RED='#c23a57',INK='#151c2b',SOFT='#5d6577',RULE='#ecd5d9';
  const stColor={ok:'#1f7a4d',near:'#a86400',open:'#22489a',low:'#9b2c2c',none:SOFT};
  const body=[[ 'Sıra','Program kodu','Üniversite','Program','Puan t.','Kont.','2026 en küçük','2026 en büyük','Puanın','Fark','Durum'].map(h=>({text:h,style:'th'}))];
  rows.forEach((p,i)=>{const s=statusOf(p,st.sc);body.push([
    {text:String(i+1),bold:true},{text:p[3],style:'mono'},
    {stack:[{text:D.U[p[1]],bold:true},{text:`${D.IL[p[1]]||''} · ${TYPE[p[0]]}${p[8]?' · '+BURS[p[8]]:''}`,color:SOFT,fontSize:7}]},
    {stack:[{text:p[4]},{text:(D.F[p[2]]||'')+(p[9]?' · Koşul '+p[9]:''),color:SOFT,fontSize:7}]},
    p[5],{text:String(p[6]),alignment:'right'},
    {text:p[11]==null?'Yerleşen yok':f3(p[11]),alignment:'right'},{text:p[12]==null?'–':f3(p[12]),alignment:'right'},
    {text:st.sc[p[5]]==null?'–':f3(st.sc[p[5]]),alignment:'right'},{text:fdiff(diff(p,st.sc)),alignment:'right'},
    {text:STATUS[s].t,color:stColor[s],bold:true}])});
  const dd={
    pageSize:'A4',pageOrientation:'landscape',pageMargins:[32,36,32,40],
    info:{title:'Tercih Listesi · Dikey Geçiş',author:'Dikey Geçiş Rehberi'},
    defaultStyle:{font:'Roboto',fontSize:8,color:INK,lineHeight:1.15},
    styles:{h1:{fontSize:18,bold:true},eyebrow:{fontSize:8,color:RED,characterSpacing:1.2,bold:true},th:{bold:true,fontSize:7.5,color:SOFT},mono:{fontSize:8,color:SOFT},lbl:{fontSize:7,color:SOFT,characterSpacing:.6},val:{fontSize:10,bold:true}},
    footer:(cur,tot)=>({margin:[32,8,32,0],columns:[{text:'Resmi belge değildir · Kaynak: ÖSYM 2026-DGS kılavuzu ve yerleştirme sonuçları',color:SOFT,fontSize:7},{text:`${cur} / ${tot}`,alignment:'right',color:SOFT,fontSize:7}]}),
    content:[
      {columns:[
        {width:'*',stack:[
          {text:'DİKEY GEÇİŞ · TERCİH LİSTESİ',style:'eyebrow'},
          {text:`${o[1].replace(/\s*\*+$/,'')} mezunu için tercih listesi`,style:'h1',margin:[0,4,0,10]},
          {table:{widths:['auto','*'],body:[
            [{text:'ÖN LİSANS BÖLÜMÜ',style:'lbl'},{text:`${o[1]} (${o[0]})`,style:'val'}],
            [{text:'DGS PUANLARI',style:'lbl'},{text:scTxt,style:'val'}],
            [{text:'KRİTERLER',style:'lbl'},{text:crit}],
            [{text:'TERCİH SAYISI',style:'lbl'},{text:`${rows.length} program`}],
            [{text:'OLUŞTURMA',style:'lbl'},{text:new Date(st.d||Date.now()).toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'})}]]},
            layout:{hLineWidth:()=>0,vLineWidth:()=>0,paddingLeft:()=>0,paddingRight:()=>12,paddingTop:()=>2,paddingBottom:()=>2}}
        ]},
        {width:120,stack:[{qr:url,fit:110,foreground:INK,eccLevel:'M',alignment:'right'},{text:'Listeyi telefonda açmak için karekodu okut',fontSize:7,color:SOFT,alignment:'right',margin:[0,4,0,0]}]}
      ]},
      {table:{headerRows:1,widths:[18,48,'*','*',26,22,44,44,40,34,58],body},
       layout:{hLineWidth:(i,n)=>i===0||i===1||i===n.table.body.length?0.8:0.4,vLineWidth:()=>0,hLineColor:i=>i<=1?INK:RULE,paddingTop:()=>4,paddingBottom:()=>4,fillColor:(i)=>i===0?'#fbe9ed':null},margin:[0,16,0,0]},
      {margin:[0,16,0,0],table:{widths:['*'],body:[[{stack:[
        {text:'Önemli bilgilendirme',bold:true,color:RED,margin:[0,0,0,4]},
        {ul:['Bu liste resmi bir belge değildir ve ÖSYM\'ye tercih olarak iletilmez.','Veriler ÖSYM\'nin yayımladığı belgelerden otomatik derlenmiştir; hata, eksik veya güncel olmayan bilgi içerebilir.','2026 yerleştirme puanları sonraki yılların sonuçlarını göstermez. "Durum" sütunu yalnızca girilen puanla 2026 en küçük puanının karşılaştırmasıdır.','Tercihlerini ÖSYM\'nin resmi tercih ekranından yap; kontenjan ve koşulları osym.gov.tr adresinden kontrol et.'],color:SOFT}
      ]}]]},layout:{hLineColor:()=>RED,vLineColor:()=>RED,hLineWidth:()=>0.8,vLineWidth:()=>0.8,paddingLeft:()=>10,paddingRight:()=>10,paddingTop:()=>8,paddingBottom:()=>8}},
      {text:url,fontSize:6.5,color:SOFT,margin:[0,8,0,0],link:url}
    ]};
  pdfMake.createPdf(dd).download(`tercih-listesi-${(st.d||new Date().toISOString().slice(0,10))}.pdf`);
  toast('PDF indirildi.');
}
