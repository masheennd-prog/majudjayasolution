const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const rp=n=>new Intl.NumberFormat('id-ID').format(Math.round(+n||0));
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LS={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{toast('Gagal menyimpan: penyimpanan browser penuh/diblokir')}}};
const fd=t=>t?new Date(t+'T00:00:00').toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}):'';
const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
function toast(m){const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>t.hidden=true,2200)}

const OLDTAG='Service Laptop/PC - Printer - Jaringan - POS System';
let cfg={nama:'Maju Djaya Solution',tag:'Service Laptop/PC - Printer - CCTV - Jaringan - POS System',alamat:'',wa:'0851-5655-1433',prefix:'MDS-',next:1,sales:'',garansi:'Garansi tidak berlaku apabila tidak ada nota beli.',footer:'Terima kasih atas kepercayaan Anda',...LS.get('mds_cfg',{})};
if(cfg.tag===OLDTAG){cfg.tag='Service Laptop/PC - Printer - CCTV - Jaringan - POS System';LS.set('mds_cfg',cfg)}
let data=LS.get('mds_inv',[]);
let cur;

/* ---------- Hitung ---------- */
const line=it=>Math.max(0,(+it.qty||0)*(+it.harga||0)-(+it.disc||0));
const sub=v=>v.items.reduce((a,it)=>a+line(it),0);
const tot=v=>Math.max(0,sub(v)-(+v.diskon||0)+(+v.ongkir||0));
function tb(n){const s=['','satu','dua','tiga','empat','lima','enam','tujuh','delapan','sembilan','sepuluh','sebelas'];n=Math.floor(n);
 if(n<12)return s[n];if(n<20)return tb(n-10)+' belas';
 if(n<100)return tb(Math.floor(n/10))+' puluh'+(n%10?' '+tb(n%10):'');
 if(n<200)return 'seratus'+(n%100?' '+tb(n%100):'');
 if(n<1e3)return tb(Math.floor(n/100))+' ratus'+(n%100?' '+tb(n%100):'');
 if(n<2e3)return 'seribu'+(n%1e3?' '+tb(n%1e3):'');
 if(n<1e6)return tb(Math.floor(n/1e3))+' ribu'+(n%1e3?' '+tb(n%1e3):'');
 if(n<1e9)return tb(Math.floor(n/1e6))+' juta'+(n%1e6?' '+tb(n%1e6):'');
 if(n<1e12)return tb(Math.floor(n/1e9))+' miliar'+(n%1e9?' '+tb(n%1e9):'');
 return tb(Math.floor(n/1e12))+' triliun'+(n%1e12?' '+tb(n%1e12):'')}
const terb=n=>{if(n<=0)return 'Nol';const t=tb(n);return t[0].toUpperCase()+t.slice(1)};

/* ---------- Form ---------- */
const blank=()=>({kode:'',nama:'',qty:1,sat:'UNT',harga:0,disc:0});
const pad=n=>String(n).padStart(5,'0');
function newInv(){return {id:null,no:cfg.prefix+pad(cfg.next),tgl:today(),sales:cfg.sales,nama:'',telp:'',alamat:'',diskon:0,ongkir:0,ket:'',items:[blank()]}}
function fill(){$$('[data-f]').forEach(e=>e.value=cur[e.dataset.f]??'');rows()}
function rows(){
 $('#items').innerHTML=cur.items.map((it,i)=>`<tr data-i="${i}">
 <td><input data-k="kode" value="${esc(it.kode)}"></td>
 <td><input data-k="nama" value="${esc(it.nama)}"></td>
 <td><input data-k="qty" type="number" min="0" value="${it.qty}" style="width:70px"></td>
 <td><input data-k="sat" value="${esc(it.sat)}" style="width:70px"></td>
 <td><input data-k="harga" type="number" min="0" value="${it.harga}" style="width:120px"></td>
 <td><input data-k="disc" type="number" min="0" value="${it.disc}" style="width:100px"></td>
 <td class="r">${rp(line(it))}</td>
 <td><button class="x" data-del="${i}" title="Hapus baris">×</button></td></tr>`).join('');
 calc()}
function calc(){$('#sub').textContent=rp(sub(cur));$('#tot').textContent=rp(tot(cur));$('#terb').textContent='Terbilang: '+terb(tot(cur))+' rupiah'}
$('#items').addEventListener('input',e=>{const tr=e.target.closest('tr'),k=e.target.dataset.k;if(!k)return;
 const it=cur.items[tr.dataset.i];it[k]=['qty','harga','disc'].includes(k)?(+e.target.value||0):e.target.value;
 tr.querySelector('td.r').textContent=rp(line(it));calc()});
$('#items').addEventListener('click',e=>{const d=e.target.dataset.del;if(d==null)return;
 cur.items.splice(d,1);if(!cur.items.length)cur.items.push(blank());rows()});
$$('[data-f]').forEach(e=>e.addEventListener('input',()=>{cur[e.dataset.f]=['diskon','ongkir'].includes(e.dataset.f)?(+e.value||0):e.value;calc()}));
$('#add').onclick=()=>{cur.items.push(blank());rows();$('#items tr:last-child input').focus()};
$('#reset').onclick=()=>{cur=newInv();fill()};

function save(){
 cur.items=cur.items.filter(it=>it.nama.trim()||it.kode.trim()||it.harga>0);
 if(!cur.items.length){cur.items=[blank()];rows();toast('Isi minimal satu barang');return null}
 if(!cur.no.trim()){toast('No. faktur wajib diisi');return null}
 if(data.some(d=>d.no===cur.no&&d.id!==cur.id)){toast('No. faktur sudah dipakai');return null}
 const v=JSON.parse(JSON.stringify(cur));
 if(v.id){data=data.map(d=>d.id===v.id?v:d)}else{v.id=Date.now();data.push(v);cfg.next++;LS.set('mds_cfg',cfg)}
 LS.set('mds_inv',data);toast('Faktur '+v.no+' tersimpan');
 cur=newInv();fill();return v}
$('#save').onclick=save;
$('#savep').onclick=()=>{const v=save();if(v)doPrint(v)};

/* ---------- Riwayat ---------- */
function hist(){
 const q=$('#q').value.toLowerCase();
 const L=[...data].sort((a,b)=>b.tgl.localeCompare(a.tgl)||b.id-a.id).filter(v=>!q||(v.no+' '+v.nama+' '+v.items.map(i=>i.nama+' '+i.kode).join(' ')).toLowerCase().includes(q));
 $('#ring').textContent=L.length+' faktur, total Rp '+rp(L.reduce((a,v)=>a+tot(v),0));
 $('#hist').innerHTML=L.length?L.map(v=>`<tr><td>${esc(v.no)}</td><td>${fd(v.tgl)}</td><td>${esc(v.nama)||'-'}</td><td>Rp ${rp(tot(v))}</td>
 <td style="white-space:nowrap"><button class="btn s" data-a="p" data-id="${v.id}">Cetak</button>
 <button class="btn o s" data-a="e" data-id="${v.id}">Ubah</button>
 <button class="btn d s" data-a="d" data-id="${v.id}">Hapus</button></td></tr>`).join(''):'<tr><td colspan="5" class="mut">Belum ada faktur. Buat faktur pertama di tab "Faktur baru".</td></tr>'}
$('#q').oninput=hist;
$('#hist').onclick=e=>{const a=e.target.dataset.a;if(!a)return;const v=data.find(x=>x.id==e.target.dataset.id);if(!v)return;
 if(a==='p')doPrint(v);
 if(a==='e'){cur=JSON.parse(JSON.stringify(v));fill();tab('baru');toast('Mengubah faktur '+v.no)}
 if(a==='d'&&confirm('Hapus faktur '+v.no+'?')){data=data.filter(x=>x.id!==v.id);LS.set('mds_inv',data);hist()}};
function dl(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
$('#csv').onclick=()=>{const c=x=>'"'+String(x??'').replace(/"/g,'""')+'"';
 const r=[['No','Tanggal','Pelanggan','Kode','Barang','Qty','Harga','Disc','Jumlah']];
 data.forEach(v=>v.items.forEach(i=>r.push([v.no,v.tgl,v.nama,i.kode,i.nama,i.qty,i.harga,i.disc,line(i)])));
 dl('riwayat-penjualan.csv','\ufeff'+r.map(x=>x.map(c).join(',')).join('\n'),'text/csv')};
$('#bak').onclick=()=>dl('cadangan-faktur-'+today()+'.json',JSON.stringify({cfg,data}),'application/json');
$('#imp').onclick=()=>$('#file').click();
$('#file').onchange=async e=>{try{const j=JSON.parse(await e.target.files[0].text());
 const ids=new Set(data.map(d=>d.id));(j.data||[]).forEach(v=>{if(!ids.has(v.id))data.push(v)});
 if(j.cfg)cfg={...cfg,...j.cfg,next:Math.max(cfg.next,j.cfg.next||1)};
 LS.set('mds_inv',data);LS.set('mds_cfg',cfg);hist();toast('Data dipulihkan')}catch{toast('File tidak valid')}e.target.value=''};

/* ---------- Pengaturan ---------- */
function setFill(){$$('[data-s]').forEach(e=>e.value=cfg[e.dataset.s]??'')}
$('#saveset').onclick=()=>{$$('[data-s]').forEach(e=>cfg[e.dataset.s]=e.dataset.s==='next'?(+e.value||1):e.value);LS.set('mds_cfg',cfg);
 if(!cur.id){cur.no=cfg.prefix+pad(cfg.next);cur.sales=cfg.sales;fill()}toast('Pengaturan tersimpan')};

/* ---------- Tab ---------- */
function tab(t){$$('nav button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
 ['baru','riwayat','set'].forEach(k=>$('#t-'+k).hidden=k!==t);if(t==='riwayat')hist()}
$$('nav button[data-t]').forEach(b=>b.onclick=()=>tab(b.dataset.t));

/* ---------- Cetak ---------- */
function nota(v){return `<div class="nota">
<div class="nh"><div><h2>${esc(cfg.nama)}</h2><div>${esc(cfg.tag)}</div>${cfg.alamat?`<div>${esc(cfg.alamat)}</div>`:''}${cfg.wa?`<div>WA: ${esc(cfg.wa)}</div>`:''}</div><h1>NOTA PENJUALAN</h1></div>
<table class="inf">
<tr><td>No. Faktur</td><td>: ${esc(v.no)}</td><td>Nama</td><td>: ${esc(v.nama)}</td></tr>
<tr><td>Tanggal</td><td>: ${fd(v.tgl)}</td><td>Telp.</td><td>: ${esc(v.telp)}</td></tr>
<tr><td>Sales</td><td>: ${esc(v.sales)}</td><td>Alamat</td><td>: ${esc(v.alamat)}</td></tr></table>
<table class="it"><thead><tr><th>No.</th><th>Kode Barang</th><th>Nama Barang</th><th>Qty</th><th class="r">Harga</th><th class="r">Disc</th><th class="r">Jumlah</th></tr></thead><tbody>
${v.items.map((it,i)=>`<tr><td>${i+1}.</td><td>${esc(it.kode)}</td><td>${esc(it.nama)}</td><td>${it.qty} ${esc(it.sat)}</td><td class="r">${rp(it.harga)}</td><td class="r">${rp(it.disc)}</td><td class="r">${rp(line(it))}</td></tr>`).join('')}</tbody></table>
<div class="nf"><div><div>Terbilang : ${terb(tot(v))}</div><div>Keterangan : ${esc(v.ket)}</div></div>
<table class="tt"><tr><td>Sub Total : Rp</td><td>${rp(sub(v))}</td></tr><tr><td>Discount : Rp</td><td>${rp(v.diskon)}</td></tr><tr><td>Ongkos Kirim : Rp</td><td>${rp(v.ongkir)}</td></tr><tr><td><b>Total Faktur : Rp</b></td><td><b>${rp(tot(v))}</b></td></tr></table></div>
<div class="sg"><div>Diterima oleh,<div class="ln"></div></div><div>Disiapkan oleh,<div class="ln"></div></div><div>Hormat kami,<div class="ln">${esc(v.sales)}</div></div><div class="gr">${esc(cfg.garansi)}</div></div></div>`}

function struk(v,p){const R=(a,b,c='')=>`<div class="rw ${c}"><span>${a}</span><span>${b}</span></div>`;
 return `<div class="th t${p}"><div class="c"><b class="sn">${esc(cfg.nama)}</b><div>${esc(cfg.tag)}</div>${cfg.alamat?`<div>${esc(cfg.alamat)}</div>`:''}${cfg.wa?`<div>WA: ${esc(cfg.wa)}</div>`:''}</div><hr>
<div>No   : ${esc(v.no)}</div><div>Tgl  : ${fd(v.tgl)}</div>${v.sales?`<div>Sales: ${esc(v.sales)}</div>`:''}${v.nama?`<div>Plg  : ${esc(v.nama)}</div>`:''}${v.telp?`<div>Telp : ${esc(v.telp)}</div>`:''}<hr>
${v.items.map(it=>`<div>${esc(it.nama||it.kode)}</div>`+R(`${it.qty} ${esc(it.sat)} x ${rp(it.harga)}${it.disc?` (-${rp(it.disc)})`:''}`,rp(line(it)))).join('')}<hr>
${R('Sub Total',rp(sub(v)))}${v.diskon?R('Diskon','-'+rp(v.diskon)):''}${v.ongkir?R('Ongkos Kirim',rp(v.ongkir)):''}${R('TOTAL',rp(tot(v)),'b')}<hr>
<div>Terbilang: ${terb(tot(v))} rupiah</div>${v.ket?`<div>Ket: ${esc(v.ket)}</div>`:''}<hr>
<div class="c">${esc(cfg.garansi)}<br>${esc(cfg.footer)}</div></div>`}

const sheet=(v,o)=>{const h=o.p==='letter'?nota(v):struk(v,o.p);return Array.from({length:o.n},()=>`<div class="cp" style="zoom:${o.s/100}">${h}</div>`).join('')};
let pend=null;
const opts=()=>({p:$('#pk').value,o:$('#po').value,n:Math.max(1,Math.min(20,+$('#pn').value||1)),s:Math.max(50,Math.min(150,+$('#ps').value||100)),m:+$('#pm').value});
function fit(){const pg=$('#pvp'),h=$('#pvh');pg.style.transform='none';
 const k=Math.min(1,($('#pv').clientWidth-32)/pg.offsetWidth);
 pg.style.transform=`scale(${k})`;h.style.width=pg.offsetWidth*k+'px';h.style.height=pg.offsetHeight*k+'px'}
function preview(){const o=opts(),th=o.p!=='letter',pg=$('#pvp');
 $('#po').disabled=$('#pm').disabled=th;$('#ps').max=th?100:150;
 if(th&&o.s>100){$('#ps').value=100;o.s=100}
 if(th){pg.style.width=o.p+'mm';pg.style.minHeight='70mm';pg.style.padding='0'}
 else{const l=o.o==='landscape';pg.style.width=(l?279.4:215.9)+'mm';pg.style.minHeight=(l?215.9:279.4)+'mm';pg.style.padding=o.m+'mm'}
 pg.innerHTML=sheet(pend,{...o,n:1});
 $('#dinfo').textContent='Faktur '+pend.no+' - Rp '+rp(tot(pend))+(o.n>1?' - '+o.n+' salinan':'');
 fit()}
function doPrint(v){pend=v;
 const o={p:'letter',o:'portrait',n:1,s:100,m:12,...LS.get('mds_pr',{})};
 $('#pk').value=o.p;$('#po').value=o.o;$('#pn').value=o.n;$('#ps').value=o.s;$('#pm').value=o.m;
 $('#dlg').hidden=false;preview();$('#dgo').focus()}
function closeDlg(){$('#dlg').hidden=true}
['pk','po','pn','ps','pm'].forEach(id=>$('#'+id).addEventListener('input',preview));
window.addEventListener('resize',()=>{if(!$('#dlg').hidden)fit()});
$('#dno').onclick=closeDlg;
$('#dlg').addEventListener('click',e=>{if(e.target.id==='dlg')closeDlg()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#dlg').hidden)closeDlg()});
$('#dgo').onclick=()=>{const o=opts();LS.set('mds_pr',o);closeDlg();
 $('#print').innerHTML=sheet(pend,o);
 $('#pg').textContent=o.p==='letter'?`@page{size:letter ${o.o};margin:${o.m}mm}`:`@page{size:${o.p}mm auto;margin:0}`;
 setTimeout(()=>window.print(),80)};

cur=newInv();fill();setFill();

/* ---------- Login admin ---------- */
async function hash(pw,salt){const t=salt+'|'+pw;
 if(window.crypto&&crypto.subtle){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
 let a=0xdeadbeef,b=0x41c6ce57;for(let i=0;i<t.length;i++){const c=t.charCodeAt(i);a=Math.imul(a^c,2654435761);b=Math.imul(b^c,1597334677)}
 a=Math.imul(a^(a>>>16),2246822507)^Math.imul(b^(b>>>13),3266489909);b=Math.imul(b^(b>>>16),2246822507)^Math.imul(a^(a>>>13),3266489909);
 return 'f'+(4294967296*(2097151&b)+(a>>>0)).toString(16)}
let auth;
async function initAuth(){auth=LS.get('mds_auth',null);
 if(!auth||!auth.h){const salt=Math.random().toString(36).slice(2)+Date.now().toString(36);
  auth={u:'admin',salt,h:await hash('admin123',salt),def:true};LS.set('mds_auth',auth)}}
function unlock(){document.body.classList.remove('lock');$('#login').hidden=true;$('#warn').hidden=!auth.def;$('#au').value=auth.u}
function showLogin(){document.body.classList.add('lock');$('#login').hidden=false;$('#lu').focus()}
$('#lf').addEventListener('submit',async e=>{e.preventDefault();
 const ok=$('#lu').value.trim().toLowerCase()===auth.u.toLowerCase()&&await hash($('#lp').value,auth.salt)===auth.h;
 if(ok){sessionStorage.setItem('mds_ok','1');$('#lp').value='';$('#le').hidden=true;unlock()}
 else{await new Promise(r=>setTimeout(r,700));$('#le').hidden=false;$('#le').textContent='Username atau password salah.';$('#lp').select()}});
$('#out').onclick=()=>{sessionStorage.removeItem('mds_ok');tab('baru');showLogin()};
$('#acc').onclick=async()=>{const u=$('#au').value.trim(),o=$('#ao').value,n=$('#an').value,r=$('#ar').value;
 if(await hash(o,auth.salt)!==auth.h)return toast('Password saat ini salah');
 if(u.length<3)return toast('Username minimal 3 karakter');
 if(n&&n.length<6)return toast('Password baru minimal 6 karakter');
 if(n!==r)return toast('Ulangi password baru dengan benar');
 auth.u=u;if(n){auth.h=await hash(n,auth.salt);auth.def=false}
 LS.set('mds_auth',auth);['ao','an','ar'].forEach(i=>$('#'+i).value='');$('#warn').hidden=!auth.def;toast('Akun admin diperbarui')};
initAuth().then(()=>sessionStorage.getItem('mds_ok')==='1'?unlock():showLogin());
