/* PWA: register early so that errors elsewhere cannot prevent installation */
if('serviceWorker' in navigator&&location.protocol!='file:')addEventListener('load',()=>navigator.serviceWorker.register('sw.js',{scope:'./'}).catch(e=>console.warn('SW registration failed',e)));
const CFG=window.JOBSHEETS_CONFIG||{};
const $=id=>document.getElementById(id),B='#153f89';
const DS={brand:'KENCAR',sub:'GROUP',name:'Kencar Group of Companies',addr:'168, Industrial Estate, Luqa',tel:'+356 2138 2091',mob:'+356 9999 4575',email:'servicing@kencar.net',web:'www.kencar.net',vatno:'MT 1992 8816',vat:18,next:12160,suf:'A',subjects:'Installation\nService\nRepair\nMaintenance\nInspection\nWarranty repair\nDelivery'};
const DEFAULT_LOGO='assets/logo.png';
let sb,me=null,S={...DS},cur=null,uid0=null,signup=false,recovering=/type=recovery/.test(location.hash);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fD=v=>{if(!v)return'';const[a,b,c]=v.split('-');return c+'/'+b+'/'+a};
const tot=d=>{const s=d.rows.reduce((a,r)=>a+(parseFloat(r.a)||0),0),v=s*(parseFloat(d.vr)||0)/100;return{s,v,t:s+v}};
const scr=n=>['cfg','auth','rec','wait','app'].forEach(i=>$(i).classList.toggle('on',i==n));
const isAdmin=()=>me&&me.approved&&me.role=='admin';
const mine=(author,tech)=>isAdmin()||!!(tech&&[me.full_name,me.email].filter(Boolean).map(s=>s.trim().toLowerCase()).includes(String(tech).trim().toLowerCase()));

/* ---------- auth ---------- */
function fail(m){$('cfgt').textContent='Error';$('cfgm').textContent=m;scr('cfg')}
function init(){
 if(!CFG.url||CFG.url.startsWith('YOUR_')||!CFG.key||CFG.key.startsWith('YOUR_')){scr('cfg');return}
 if(typeof supabase==='undefined'||!window.jspdf){fail('A required library failed to load. Check your internet connection and reload.');return}
 try{sb=supabase.createClient(CFG.url,CFG.key)}catch(e){fail('Invalid Supabase URL or key: '+e.message);return}
 sb.auth.onAuthStateChange((ev,s)=>{if(ev=='PASSWORD_RECOVERY')recovering=true;setTimeout(()=>boot(s),0)});
 sb.auth.getSession().then(({data})=>boot(data.session))}
async function boot(s){
 if(!s){uid0=null;me=null;scr('auth');post('auth-required');return}
 if(recovering){scr('rec');return}
 if(uid0==s.user.id&&me&&me.approved&&$('app').classList.contains('on'))return;
 uid0=s.user.id;
 const{data,error}=await sb.from('profiles').select('*').eq('id',s.user.id).single();
 if(error||!data){scr('auth');$('am').textContent=error?error.message:'Profile not found';return}
 me=data;if(!me.approved){scr('wait');return}
 await loadSettings();
 $('who').textContent=(me.full_name||me.email)+' · '+me.role;
 $('usr').style.display=isAdmin()?'block':'none';$('nset').style.display=isAdmin()?'':'none';$('exim').style.display=isAdmin()?'':'none';
 scr('app');renderList();show('list');post('ready',{user:{id:me.id,email:me.email,role:me.role}});route()}
$('asw').onclick=()=>{signup=!signup;$('nmw').style.display=signup?'block':'none';$('ai').textContent=signup?'Create account':'Sign in';$('asw').textContent=signup?'I already have an account':'Create an account';$('afp').style.display=signup?'none':'';am('')};
const am=(t,ok)=>{$('am').textContent=t;$('am').className='m'+(ok?'':' er')};
$('afp').onclick=async()=>{const e=$('ae').value.trim();if(!e){am('Enter your email above first.');return}
 const{error}=await sb.auth.resetPasswordForEmail(e,{redirectTo:location.origin+location.pathname});
 am(error?error.message:'If this email has an account, a password reset link has been sent.',!error)};
$('rpb').onclick=async()=>{const a=$('rp1').value,m=$('rm');
 if(a.length<6){m.textContent='Password must be at least 6 characters.';return}
 if(a!==$('rp2').value){m.textContent='Passwords do not match.';return}
 const{error}=await sb.auth.updateUser({password:a});
 if(error){m.textContent=error.message;return}
 recovering=false;history.replaceState(null,'',location.pathname);uid0=null;sb.auth.getSession().then(({data})=>boot(data.session))};
$('ai').onclick=async()=>{const e=$('ae').value.trim(),p=$('ap').value;am('');
 if(!e||!p){am('Enter email and password.');return}
 const r=signup?await sb.auth.signUp({email:e,password:p,options:{data:{full_name:$('an').value.trim()}}}):await sb.auth.signInWithPassword({email:e,password:p});
 if(r.error){am(r.error.message);return}
 if(signup&&!r.data.session)am('Account created. Check your email to confirm, then sign in.',1)};
const out_=()=>sb.auth.signOut();$('so').onclick=out_;$('wo').onclick=out_;
$('wr').onclick=()=>{uid0=null;sb.auth.getSession().then(({data})=>boot(data.session))};

/* ---------- views ---------- */
function show(v){['list','edit','set','exp'].forEach(i=>$(i).classList.toggle('on',i==v));
 document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v==(v=='edit'?'new':v=='exp'?'list':v)));if(v=='edit')growAll();scrollTo(0,0)}
function go(n){[1,2,3].forEach(i=>$('s'+i).classList.toggle('on',i==n));growAll();scrollTo(0,0)}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{const v=b.dataset.v;if(v=='new')newDoc();else if(v=='list'){renderList();show('list')}else if(isAdmin()){fillSet();show('set')}});

/* ---------- job description rows (auto-wrapping) ---------- */
const grow=t=>{t.style.height='auto';if(t.scrollHeight)t.style.height=t.scrollHeight+'px'};
const growAll=()=>document.querySelectorAll('#edit textarea').forEach(grow);
function row(d='',a=''){const e=document.createElement('div');e.className='row';e.innerHTML='<textarea class="ds" rows="1" placeholder="Description"></textarea><input class="am" type="number" inputmode="decimal" step="0.01" placeholder="Amount">';
 const t=e.children[0];t.value=d;e.children[1].value=a;t.oninput=()=>{grow(t);info()};e.children[1].oninput=info;$('rows').appendChild(e);grow(t)}
$('add').onclick=()=>row();
$('mat').oninput=()=>{grow($('mat'));info()};
$('addr').oninput=()=>grow($('addr'));$('subj').oninput=()=>grow($('subj'));$('vr').oninput=info;
function info(){const d=collect(),t=tot(d),L=layout(d,mctx);
 $('tt').textContent='Sub: '+t.s.toFixed(2)+' · VAT: '+t.v.toFixed(2)+' · Total: '+t.t.toFixed(2);
 $('ln').textContent='Lines used: '+L.job.length+' / '+L.cap+(L.jobOver?' – too long, text will be cut off':'');$('ln').className='m'+(L.jobOver?' er':'');
 $('ml').textContent='Material lines: '+L.mat.length+' / 4'+(L.matOver?' – too long, text will be cut off':'');$('ml').className='m'+(L.matOver?' er':'')}

/* ---------- layout / text wrapping shared by editor and PDF ---------- */
const mctx=document.createElement('canvas').getContext('2d');
const TIERS=[{fs:23,lh:40,cap:10},{fs:20,lh:33,cap:12},{fs:17,lh:28,cap:14},{fs:14,lh:24,cap:16}];
function wrap(x,t,fs,wf){x.font=fs+'px Arial,Helvetica,sans-serif';const o=[];
 String(t||'').split('\n').forEach(p=>{let line='';
  p.split(/\s+/).filter(Boolean).forEach(w=>{
   while(x.measureText(w).width>wf(o.length)){let k=w.length-1;while(k>1&&x.measureText(w.slice(0,k)).width>wf(o.length))k--;if(line){o.push(line);line=''}o.push(w.slice(0,k));w=w.slice(k)}
   const tr=line?line+' '+w:w;if(x.measureText(tr).width<=wf(o.length))line=tr;else{o.push(line);line=w}});
  o.push(line)});
 while(o.length&&!o[o.length-1])o.pop();return o}
const flat=t=>String(t||'').replace(/\s*\n\s*/g,' ').trim();
function fitLines(x,t,wf,cap){t=flat(t);let L;for(let fs=23;fs>=14;fs--){L=wrap(x,t,fs,wf);if(L.length<=cap)return{lines:L,fs}}return{lines:L.slice(0,cap),fs:14}}
/* address: line breaks after commas (one part per line; parts are merged only if there are too many) */
function addrLines(x,t,wf,cap){t=flat(t);const parts=t.split(',').map(s=>s.trim()).filter(Boolean).map((s,i,a)=>i<a.length-1?s+',':s);let last;
 for(let fs=23;fs>=14;fs--){
  const A=[];parts.forEach(p=>wrap(x,p,fs,i=>wf(A.length+i)).forEach(l=>A.push(l)));if(A.length<=cap)return{lines:A,fs};
  x.font=fs+'px Arial,Helvetica,sans-serif';const G=[];let line='';
  parts.forEach(p=>{const tr=line?line+' '+p:p;if(x.measureText(tr).width<=wf(G.length))line=tr;else{if(line)G.push(line);line=p}});if(line)G.push(line);
  if(G.length<=cap&&G.every((l,i)=>x.measureText(l).width<=wf(i)))return{lines:G,fs};
  last=wrap(x,parts.join(' '),fs,wf);if(last.length<=cap)return{lines:last,fs}}
 return{lines:last.slice(0,cap),fs:14}}
function layout(d,x){
 const rows=d.rows.filter(r=>(r.d||'').trim()||r.a!=='');
 const build=fs=>{const a=[];rows.forEach(r=>{const ls=wrap(x,r.d,fs,()=>860);if(!ls.length)ls.push('');ls.forEach((l,i)=>a.push({t:l,a:i?'':r.a}))});return a};
 let tr=TIERS[TIERS.length-1],job;
 for(const T of TIERS){const a=build(T.fs);if(a.length<=T.cap){tr=T;job=a;break}}
 if(!job)job=build(tr.fs);
 const jobOver=job.length>tr.cap;
 let mfs=22,mat;for(;;){mat=wrap(x,d.mat,mfs,i=>i?860:670);if(mat.length<=4||mfs<=14)break;mfs--}
 return{job:job.slice(0,tr.cap),cap:tr.cap,jobOver,fs:tr.fs,lh:tr.lh,mat:mat.slice(0,4),matOver:mat.length>4,mfs}}

/* ---------- signature pads ---------- */
function pad(cv){const x=cv.getContext('2d');x.lineWidth=5;x.lineCap='round';x.lineJoin='round';x.strokeStyle='#0a1a6e';let dr=false;cv.dirty=false;
const pt=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height]};
cv.onpointerdown=e=>{dr=true;cv.setPointerCapture(e.pointerId);const[a,b]=pt(e);x.beginPath();x.moveTo(a,b);x.lineTo(a+.1,b+.1);x.stroke();cv.dirty=true};
cv.onpointermove=e=>{if(!dr)return;const[a,b]=pt(e);x.lineTo(a,b);x.stroke()};
cv.onpointerup=cv.onpointercancel=()=>{dr=false};
cv.clear=()=>{x.clearRect(0,0,cv.width,cv.height);cv.dirty=false};
cv.load=u=>{cv.clear();if(!u)return;const i=new Image();i.onload=()=>{x.drawImage(i,0,0);cv.dirty=true};i.src=u};
cv.data=()=>cv.dirty?cv.toDataURL('image/png'):''}
pad($('p1'));pad($('p2'));
document.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>$(b.dataset.c).clear());

/* ---------- client not present ---------- */
const CNP='Client not present';
$('cnp').onchange=()=>{const on=$('cnp').checked;if(on)$('cn').value=CNP;else if($('cn').value===CNP)$('cn').value='';$('cn').readOnly=on};

/* ---------- subject presets ---------- */
const presets=()=>String(S.subjects||'').split('\n').map(x=>x.trim()).filter(Boolean);
function subjSync(v){const p=presets(),sel=$('subjsel'),inp=$('subj');
 sel.innerHTML='<option value="">— Select —</option>'+p.map(x=>'<option>'+esc(x)+'</option>').join('')+'<option value="__o">Other (type manually)…</option>';
 if(v&&p.includes(v)){sel.value=v;inp.style.display='none'}
 else if(v){sel.value='__o';inp.style.display='block'}
 else{sel.value='';inp.style.display='none'}
 inp.value=v}
$('subjsel').onchange=()=>{const v=V('subjsel'),inp=$('subj');if(v=='__o'){inp.value='';inp.style.display='block';grow(inp);inp.focus()}else{inp.style.display='none';inp.value=v}};

/* ---------- form <-> doc ---------- */
const V=id=>$(id).value,R=n=>+document.querySelector('[name='+n+']:checked').value;
function collect(){return{no:V('num').trim(),type:R('t'),date:V('date'),client:V('client'),addr:V('addr'),tel:V('tel'),vat:V('vat'),subj:V('subj'),price:V('price'),inst:V('inst'),pay:R('p'),
rows:[...$('rows').children].map(r=>({d:r.children[0].value,a:r.children[1].value})),vr:V('vr'),mat:V('mat'),tin:V('tin'),tout:V('tout'),rec:V('rec'),rp:V('rp'),
tech:V('tech'),cn:V('cn'),cid:V('cid'),ext:curExt,s1:$('p1').data(),s2:$('p2').data()}}
async function techOpts(sel){
 const own=me.full_name||me.email;let n=[own];
 if(isAdmin()){const{data}=await sb.from('profiles').select('full_name,email').eq('approved',true);n=(data||[]).map(p=>p.full_name||p.email)}
 $('tech').innerHTML='<option value="">—</option>'+[...new Set([...n,...(sel?[sel]:[])])].map(t=>'<option>'+esc(t)+'</option>').join('');
 $('tech').value=sel||own;$('tech').disabled=!isAdmin()}
function fill(d,id){cur=id?{id}:null;curExt=d.ext||'';document.querySelector('[name=t][value="'+d.type+'"]').checked=true;document.querySelector('[name=p][value="'+d.pay+'"]').checked=true;
['num:no','date','client','addr','tel','vat','subj','price','inst','vr','mat','tin','tout','rec','rp','cn','cid'].forEach(k=>{const[i,f]=k.split(':');$(i).value=d[f||i]??''});
subjSync(d.subj||'');$('cnp').checked=(d.cn===CNP);$('cn').readOnly=$('cnp').checked;$('rows').innerHTML='';(d.rows&&d.rows.length?d.rows:[{}]).forEach(r=>row(r.d,r.a));grow($('mat'));
$('p1').load(d.s1);$('p2').load(d.s2);techOpts(d.tech);info()}
function newDoc(pf={}){$('b3').style.display='';fill({type:0,no:'',date:new Date().toISOString().slice(0,10),pay:-1,rows:[],vr:S.vat,rp:-1,tech:'',ext:extFilter,...pf},null);$('tech').value=me.full_name||me.email;go(1);show('edit')}

/* ---------- save (shared database) ---------- */
async function save(btn){if(cur&&cur.ro){alert('Only the author or an administrator can edit this document.');return null}const d=collect();
 if(!d.client.trim()&&!d.no){alert('Enter a client or a number first.');return null}
 if(btn)btn.disabled=true;
 try{
  const row={ext:d.ext||null,type:d.type,client:d.client,doc_date:d.date||null,total:tot(d).t,tech:d.tech,data:d,updated_at:new Date().toISOString()};
  if(cur&&cur.id){row.no=d.no||cur.no;if(!d.no){d.no=cur.no;$('num').value=d.no}
   const{error}=await sb.from('documents').update(row).eq('id',cur.id);if(error)throw error;cur.no=row.no}
  else{let no=d.no;if(!no){const r=await sb.rpc('take_number');if(r.error)throw r.error;no=r.data}
   d.no=no;row.no=no;const{data,error}=await sb.from('documents').insert(row).select('id,no').single();if(error)throw error;cur={id:data.id,no:data.no};$('num').value=data.no;await loadSettings()}
  post('saved',{id:cur.id,no:cur.no,client:d.client,total:row.total,ext:d.ext||'',type:d.type});return{...d,id:cur.id}
 }catch(e){alert(e.code=='23505'?'This document number already exists.':'Save failed: '+(e.message||e));return null}
 finally{if(btn)btn.disabled=false}}

/* ---------- list ---------- */
let qt;$('q').oninput=()=>{clearTimeout(qt);qt=setTimeout(renderList,300)};
async function renderList(){
 const q=V('q').trim().replace(/[%,()*\\]/g,' ');
 $('exf').style.display=extFilter?'block':'none';$('exf').innerHTML=extFilter?'Filtered by reference <b>'+esc(extFilter)+'</b> · <a href="#" data-c="1">show all</a>':'';
 let r=sb.from('documents').select('id,no,client,doc_date,type,total,tech,created_by').order('updated_at',{ascending:false}).limit(200);
 if(extFilter)r=r.eq('ext',extFilter);
 if(q)r=r.or('client.ilike.%'+q+'%,no.ilike.%'+q+'%');
 const{data,error}=await r;
 if(error){$('docs').innerHTML='<p class="m er">'+esc(error.message)+'</p>';return}
 $('docs').innerHTML=data.length?data.map(d=>'<div class="box it" data-id="'+d.id+'"><b>'+esc(d.no)+' · '+esc(d.client||'(no client)')+'</b><small>'+['Job Sheet','Invoice','Cash Sale'][d.type]+' · '+fD(d.doc_date)+' · Total '+Number(d.total||0).toFixed(2)+(d.tech?' · '+esc(d.tech):'')+'</small><div class="ab"><button data-a="o" type="button">Open</button>'+(mine(d.created_by,d.tech)?'<button class="s" data-a="e" type="button">Edit</button>':'')+''+(isAdmin()?'<button class="s" data-a="p" type="button">PDF</button>':'')+''+(isAdmin()?'<button class="s d" data-a="x" type="button">Delete</button>':'')+'</div></div>').join(''):'<p class="m">'+(q?'No matches.':'No documents yet. Tap “+ New”.')+'</p>'}
async function getDoc(id){const{data,error}=await sb.from('documents').select('id,no,data,created_by').eq('id',id).single();if(error){alert(error.message);return null}return{...data.data,no:data.no,id:data.id,cb:data.created_by}}
$('docs').onclick=async e=>{const b=e.target.closest('[data-a]');if(!b)return;const box=b.closest('[data-id]'),id=box.dataset.id,a=b.dataset.a;
 if(a=='x'){if(confirm('Delete this document?')){const{error}=await sb.from('documents').delete().eq('id',id);if(error)alert(error.message);renderList()}return}
 b.disabled=true;const d=await getDoc(id);b.disabled=false;if(!d)return;
 if(a=='p'){await pdf(d);return}
 fill(d,id);cur={id,no:d.no,ro:!mine(d.cb,d.tech)};$('b3').style.display=cur.ro?'none':'';show('edit');if(a=='e')go(1);else{await draw(d,$('pv'));go(3)}};

/* ---------- flow ---------- */
$('n1').onclick=()=>go(2);$('b2').onclick=()=>go(1);$('b3').onclick=()=>go(2);
$('sv1').onclick=async e=>{await save(e.target)};
$('n2').onclick=async e=>{const d=await save(e.target);if(!d)return;await draw(d,$('pv'));$('msg').textContent='';go(3);cur.doc=d};
$('bl').onclick=()=>{renderList();show('list')};
$('dl').onclick=()=>pdf({...collect(),no:$('num').value});

/* ---------- settings ---------- */
const SF={brand:'st_brand',sub:'st_sub',name:'st_name',addr:'st_addr',tel:'st_tel',mob:'st_mob',email:'st_email',web:'st_web',vatno:'st_vatno',vat:'st_vat',next:'st_next',suf:'st_suf',subjects:'st_subjects'};
async function loadSettings(){const{data}=await sb.from('app_settings').select('*').eq('id',1).single();if(data)S={...DS,...(data.data||{}),next:data.next_no,suf:data.suffix};setTitle()}
function setTitle(){const t=(S.name?S.name+' - ':'')+'Job Sheets';$('ttl').textContent=t;document.title=t}
async function fillSet(){await loadSettings();const a=isAdmin();for(const k in SF){$(SF[k]).value=S[k];$(SF[k]).disabled=!a}$('lgp').src=S.logo||DEFAULT_LOGO;$('lgf').disabled=$('lgb').disabled=$('lgr').disabled=!a;$('ssv').style.display=a?'block':'none';$('sm').textContent=a?'':'Only administrators can change settings.';if(a)loadUsers()}
$('ssv').onclick=async()=>{const n={};for(const k in SF)n[k]=V(SF[k]);const{next,suf,...rest}=n;rest.logo=S.logo||'';
 const{error}=await sb.from('app_settings').update({data:rest,next_no:parseInt(next)||1,suffix:suf}).eq('id',1);
 $('sm').textContent=error?error.message:'Settings saved.';if(!error){S={...DS,...rest,next:parseInt(next)||1,suf};setTitle()}};
$('lgb').onclick=()=>$('lgf').click();
$('lgf').onchange=e=>{const f=e.target.files[0];e.target.value='';if(!f)return;const fr=new FileReader();
 fr.onload=()=>{const i=new Image();i.onload=()=>{const r=Math.min(1,500/i.height),c=document.createElement('canvas');c.width=Math.round(i.width*r);c.height=Math.round(i.height*r);c.getContext('2d').drawImage(i,0,0,c.width,c.height);S.logo=c.toDataURL('image/png');$('lgp').src=S.logo;$('sm').textContent='Logo changed. Press “Save settings” to keep it.'};i.onerror=()=>alert('Could not read this image.');i.src=fr.result};fr.readAsDataURL(f)};
$('lgr').onclick=()=>{S.logo='';$('lgp').src=DEFAULT_LOGO;$('sm').textContent='Default logo selected. Press “Save settings” to keep it.'};
async function loadUsers(){const{data,error}=await sb.from('profiles').select('id,email,full_name,role,approved').order('created_at');
 if(error){$('ul').innerHTML='<p class="m er">'+esc(error.message)+'</p>';return}
 $('ul').innerHTML=data.map(u=>'<div class="ul" data-u="'+u.id+'"><span><input data-f="full_name" placeholder="Full name" value="'+esc(u.full_name||'')+'"><small>'+esc(u.email)+'</small></span><select data-f="role"><option'+(u.role=='technician'?' selected':'')+'>technician</option><option'+(u.role=='admin'?' selected':'')+'>admin</option></select><label class="ck" style="margin:0"><input type="checkbox" data-f="approved"'+(u.approved?' checked':'')+(u.id==me.id?' disabled':'')+'>OK</label></div>').join('')}
$('ul').onchange=async e=>{const r=e.target.closest('[data-u]');if(!r)return;const f=e.target.dataset.f;
 const v=f=='approved'?e.target.checked:e.target.value;const{error}=await sb.from('profiles').update({[f]:v}).eq('id',r.dataset.u);if(error){alert(error.message);loadUsers()}};

/* ---------- export / import ---------- */
async function out(name,data,mime){
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:mime}));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
const EXSEL='no,type,client,tech,ext,created_at,updated_at,'+['date','addr','tel','vat','subj','price','inst','pay','rows','vr','mat','tin','tout','rec','rp','cn','cid'].map(k=>k+':data->'+k).join(',')+',s1:data->>s1,s2:data->>s2';
let exSel=new Set(),exData=[],eqt;
const updEx=()=>{$('edo').textContent='Export selected ('+exSel.size+')';$('edo').disabled=!exSel.size};
function renderEx(){$('el').innerHTML=exData.map(d=>'<label class="ei"><input type="checkbox" data-id="'+d.id+'"'+(exSel.has(d.id)?' checked':'')+'><span><b>'+esc(d.no)+'</b> · '+esc(d.client||'(no client)')+'<br><small>'+['Job Sheet','Invoice','Cash Sale'][d.type]+' · '+fD(d.doc_date)+'</small></span></label>').join('')||'<p class="m">No documents.</p>';updEx()}
async function exLoad(){const q=V('eq').trim().replace(/[%,()*\\]/g,' ');
 let r=sb.from('documents').select('id,no,client,doc_date,type').order('updated_at',{ascending:false}).limit(1000);
 if(q)r=r.or('client.ilike.%'+q+'%,no.ilike.%'+q+'%');
 const{data,error}=await r;if(error){$('el').innerHTML='<p class="m er">'+esc(error.message)+'</p>';return}
 exData=data;renderEx()}
$('ex').onclick=()=>{if(!isAdmin())return;exSel=new Set();$('eq').value='';show('exp');exLoad()};
$('el').onchange=e=>{const id=e.target.dataset.id;if(!id)return;e.target.checked?exSel.add(id):exSel.delete(id);updEx()};
$('esa').onclick=()=>{exData.forEach(d=>exSel.add(d.id));renderEx()};
$('esn').onclick=()=>{exSel.clear();renderEx()};
$('eq').oninput=()=>{clearTimeout(eqt);eqt=setTimeout(exLoad,300)};
$('ecc').onclick=()=>show('list');
$('edo').onclick=async e=>{const ids=[...exSel];if(!ids.length||!isAdmin())return;e.target.disabled=true;const docs=[];
 for(let i=0;i<ids.length;i+=100){const{data,error}=await sb.from('documents').select(EXSEL).in('id',ids.slice(i,i+100)).order('created_at');
  if(error){alert(error.message);updEx();return}docs.push(...data)}
 const fn=t=>String(t||'').replace(/[^\p{L}\p{N}-]+/gu,'_').replace(/^_+|_+$/g,'').slice(0,80);
 const name=docs.length==1?fn(docs[0].no+'_'+(docs[0].client||'')):fn(docs[0].no+'_'+new Date().toISOString().slice(0,10));
 out((name||'jobsheets')+'.json',JSON.stringify({app:'jobsheets',v:4,docs}),'application/json');updEx();show('list')};
$('im').onclick=()=>$('imf').click();
$('imf').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
 try{const j=JSON.parse(await f.text());const a=Array.isArray(j)?j:j.docs;if(!Array.isArray(a))throw new Error('bad');
  const{data:pr}=await sb.from('profiles').select('id,full_name,email');const mp={};(pr||[]).forEach(p=>{[p.full_name,p.email].forEach(k=>{if(k)mp[k.trim().toLowerCase()]=p.id})});
  const rows=a.filter(d=>d&&(d.data||d.rows)).map(d=>{const x=d.data||d,no=d.no||x.no;return{no,type:x.type??d.type??0,client:x.client||d.client||'',doc_date:(x.date||d.doc_date)||null,total:tot(x).t,tech:x.tech||'',ext:x.ext||d.ext||null,created_by:mp[(x.tech||'').trim().toLowerCase()]||me.id,data:x,updated_at:d.updated_at||new Date().toISOString()}}).filter(r=>r.no);
  if(!rows.length)throw new Error('No documents found');
  const ex={};for(let i=0;i<rows.length;i+=100){const{data:e}=await sb.from('documents').select('no,s1:data->>s1,s2:data->>s2').in('no',rows.slice(i,i+100).map(r=>r.no));(e||[]).forEach(r=>ex[r.no]=r)}
  rows.forEach(r=>{const e=ex[r.no];r.data.s1=r.data.s1||(e&&e.s1)||'';r.data.s2=r.data.s2||(e&&e.s2)||''});
  if(!confirm('Import '+rows.length+' document(s)? Documents with the same number will be overwritten.'))return;
  const{error}=await sb.from('documents').upsert(rows,{onConflict:'no'});if(error)throw error;
  renderList();alert('Imported.')}catch(x){alert('Import failed: '+(x.message||x))}};

/* ---------- drawing ---------- */
const img=u=>new Promise(r=>{if(!u)return r(null);const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=u});
async function draw(d,c){
const x=c.getContext('2d'),[i1,i2,lg]=await Promise.all([img(d.s1),img(d.s2),img(S.logo||DEFAULT_LOGO)]);
x.fillStyle='#fff';x.fillRect(0,0,1240,1754);
const F=(sz,b)=>x.font=(b?'bold ':'')+sz+'px Arial,Helvetica,sans-serif';
const T=(t,px,py,sz,b,col,al,mw)=>{if(!t)return;F(sz,b);x.fillStyle=col||'#111';x.textAlign=al||'left';let s=sz;if(mw)while(x.measureText(t).width>mw&&s>11){s--;F(s,b)}x.fillText(t,px,py)};
const L=(x1,y1,x2,y2,w,col)=>{x.beginPath();x.strokeStyle=col||'#444';x.lineWidth=w||1.5;x.moveTo(x1,y1);x.lineTo(x2,y2);x.stroke()};
const RR=(px,py,w,h,r,fill,st)=>{x.beginPath();x.roundRect(px,py,w,h,r);if(fill){x.fillStyle=fill;x.fill()}if(st){x.strokeStyle=st;x.lineWidth=2;x.stroke()}};
const CK=(px,py,on)=>{RR(px,py,36,36,10,'#fff','#333');if(on)T('✓',px+18,py+29,30,true,B,'center')};
if(lg){const r=Math.min(280/lg.width,180/lg.height),w=lg.width*r,h=lg.height*r;x.drawImage(lg,40,10+(180-h)/2,w,h)}
T(S.brand,330,110,96,true,B,'left',420);L(330,122,750,122,3,B);T((S.sub||'').split('').join(' '),540,170,32,false,'#222','center',400);
[S.name,S.addr,S.tel&&'Tel/Fax: '+S.tel,S.mob&&'Mob: '+S.mob,S.email&&'Email: '+S.email,S.web&&'Web: '+S.web,S.vatno&&'VAT Reg No: '+S.vatno].filter(Boolean).forEach((t,i)=>T(t,1170,38+i*27,21,i==0,'#222','right',400));
x.fillStyle=B;x.fillRect(0,200,1240,80);
[['JOB SHEET',60,225],['INVOICE',470,590],['CASH SALE',880,1040]].forEach((a,i)=>{T(a[0],a[1],252,26,true,'#fff');RR(a[2],212,i==2?170:150,52,12,'#fff');if(d.type==i)T('✓',a[2]+(i==2?85:75),252,34,true,B,'center')});
T(d.no,1170,352,38,true,'#111','right',300);
const lf=(lab,v,y,x2,lx)=>{T(lab,lx,y,23,false,'#222');const s=lx+x.measureText(lab).width+12;L(s,y+6,x2,y+6,1,'#999');T(v,s+6,y-3,23,false,'#0a1a6e','left',x2-s-10)};
lf('Client:',d.client,368,590,80);lf('Address:','',408,590,80);const aw=x.measureText('Address:').width,as=80+aw+12;
const AD=addrLines(x,d.addr,()=>590-as-10,3);AD.lines.forEach((l,i)=>T(l,as+6,[405,445,485][i],AD.fs,false,'#0a1a6e'));
L(as,448,590,448,1,'#999');L(as,488,590,488,1,'#999');
lf('Telephone:',d.tel,528,590,80);lf('Vat No:',d.vat,568,590,80);lf('Subject:','',608,590,80);const sw=x.measureText('Subject:').width,ss=80+sw+12;
const SJ=fitLines(x,d.subj,i=>i?1170-ss-16:590-ss-10,2);SJ.lines.forEach((l,i)=>T(l,ss+6,[605,645][i],SJ.fs,false,'#0a1a6e'));L(ss,648,1170,648,1,'#999');
lf('Date:',fD(d.date),448,1170,640);lf('Price:',d.price,488,1170,640);lf('App. Inst. Date:',fD(d.inst),528,1170,640);
T('PAYMENT:',640,574,23,true);T('Warranty',770,574,23);CK(865,546,d.pay==0);T('Cash',930,574,23);CK(985,546,d.pay==1);T('Invoice',1050,574,23);CK(1130,546,d.pay==2);
x.fillStyle=B;x.fillRect(78,690,1092,80);T('JOB DESCRIPTION',98,742,26,true,'#fff');T('AMOUNT',1148,740,26,true,'#fff','right');
const Y=layout(d,x);
for(let i=0;i<Y.cap;i++){const y=774+(i+1)*Y.lh,r=Y.job[i];L(78,y,1170,y,1.3,'#333');if(r){T(r.t,90,y-Y.lh*.22,Y.fs,false,'#0a1a6e');const a=parseFloat(r.a);if(!isNaN(a))T(a.toFixed(2),1156,y-Y.lh*.22,Y.fs,false,'#0a1a6e','right')}}
L(980,774,980,1670,1.3,'#555');
T('Materials Used:',80,1230,24,true);
for(let i=0;i<4;i++){const y=1232+i*38;L(78,y,1170,y,1.3,'#333');if(Y.mat[i])T(Y.mat[i],i?90:300,y-8,Y.mfs,false,'#0a1a6e')}
T('Time In:',78,1400,24,true);RR(185,1372,190,50,10,'#fff','#333');T(d.tin,280,1406,24,false,'#0a1a6e','center');
T('Time Out:',470,1400,24,true);RR(585,1372,190,50,10,'#fff','#333');T(d.tout,680,1406,24,false,'#0a1a6e','center');
T('Amount Recieved:',78,1470,24,true);RR(300,1442,190,50,10,'#fff','#333');T(d.rec,395,1476,24,false,'#0a1a6e','center',170);
T('Payment:',500,1470,21,true);T('Cash:',603,1470,21,true);CK(666,1442,d.rp==0);T('Cheque:',712,1470,21,true);CK(802,1442,d.rp==1);T('Invoice:',848,1470,21,true);CK(932,1442,d.rp==2);
const t=tot(d);
T('SUB TOTAL',990,1540,16,true,'#222');L(985,1548,1170,1548,1.3);if(t.s)T(t.s.toFixed(2),1160,1542,21,false,'#0a1a6e','right',72);
T('VAT',990,1590,17,true,'#222');L(985,1598,1170,1598,1.3);if(t.s)T(t.v.toFixed(2),1160,1592,21,false,'#0a1a6e','right',118);
T('TOTAL',990,1640,17,true,'#222');L(985,1648,1170,1648,1.3);if(t.s)T(t.t.toFixed(2),1160,1642,22,true,'#0a1a6e','right',105);
T("Client's name in full:",78,1530,22);L(285,1536,600,1536,1,'#999');T(d.cn,291,1530,24,false,'#0a1a6e','left',305);
T('ID Card No:',620,1530,22);L(755,1536,965,1536,1,'#999');T(d.cid,761,1530,24,false,'#0a1a6e','left',200);
T("Client's Signature:",78,1620,22);L(250,1636,490,1636,1,'#999');
T('Technician Signature:',525,1620,22);L(760,1636,965,1636,1,'#999');T(d.tech,760,1664,18,false,'#444','left',205);
const dg=(im,px,w)=>{if(im){const r=Math.min(w/im.width,80/im.height);x.drawImage(im,px,1636-im.height*r,im.width*r,im.height*r)}};
dg(i1,250,240);dg(i2,760,205);
x.fillStyle=B;x.fillRect(0,1690,1240,64);T(S.brand+' '+S.sub,620,1730,22,true,'#fff','center')}
async function pdf(d){const c=document.createElement('canvas');c.width=1240;c.height=1754;await draw(d,c);
const {jsPDF}=window.jspdf,p=new jsPDF({unit:'mm',format:'a4'});p.addImage(c.toDataURL('image/jpeg',.92),'JPEG',0,0,210,297);
p.save(((d.client||'jobsheet')+'_'+(d.no||'')).replace(/[^\p{L}\p{N}]+/gu,'_').slice(0,50)+'.pdf')}
window.addEventListener('error',e=>{if(!document.querySelector('.top.on'))fail(e.message)});
/* ---------- embedding (CRM), deep links, PWA ---------- */
const QP=new URLSearchParams(location.search);
const EMBED=QP.has('embed')||window.self!==window.parent;
const AO=Array.isArray(CFG.allowedOrigins)?CFG.allowedOrigins:[];
let extFilter=QP.get('ext')||'',routed=false,curExt='';
if(EMBED)document.body.classList.add('embed');
if(QP.get('nav')==='0')document.body.classList.add('nonav');
if(QP.get('bar')==='0')document.body.classList.add('nobar');
if(/^#[0-9a-f]{3,8}$/i.test(QP.get('accent')||''))document.documentElement.style.setProperty('--pr',QP.get('accent'));
const post=(type,data)=>{if(!EMBED)return;AO.forEach(o=>{try{window.parent.postMessage({type:'jobsheets:'+type,...data},o)}catch(e){}})};
async function openDoc(id,mode){const d=await getDoc(id);if(!d)return;fill(d,id);cur={id,no:d.no,ro:!mine(d.cb,d.tech)};$('b3').style.display=cur.ro?'none':'';show('edit');
 if(mode=='edit'&&!cur.ro)go(1);else{await draw(d,$('pv'));go(3)}}
function route(){if(routed)return;routed=true;
 if(QP.get('doc'))return openDoc(QP.get('doc'),QP.get('mode'));
 if(QP.has('new')){const pf={};['client','addr','tel','vat','subj','price','ext'].forEach(k=>{if(QP.get(k))pf[k]=QP.get(k)});return newDoc(pf)}
 if(QP.get('q')){$('q').value=QP.get('q');renderList()}}
window.addEventListener('message',async e=>{
 if(!AO.includes(e.origin)||e.source!==window.parent)return;
 const m=e.data||{};if(!m.type||String(m.type).indexOf('jobsheets:')!==0)return;
 if(m.type=='jobsheets:auth'){if(m.access_token&&m.refresh_token&&sb){const{error}=await sb.auth.setSession({access_token:m.access_token,refresh_token:m.refresh_token});if(error)post('error',{message:error.message})}return}
 if(!me||!me.approved)return;
 if(m.type=='jobsheets:new'){const pf=m.prefill||{};if(pf.ext)extFilter=pf.ext;newDoc(pf)}
 else if(m.type=='jobsheets:open')openDoc(m.id,m.mode);
 else if(m.type=='jobsheets:search'){$('q').value=m.q||'';extFilter=m.ext||'';renderList();show('list')}});
$('exf').onclick=e=>{if(e.target.dataset.c){e.preventDefault();extFilter='';renderList()}};
if(EMBED&&window.ResizeObserver)new ResizeObserver(()=>post('height',{height:document.documentElement.scrollHeight})).observe(document.body);
let ip;const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();ip=e});
addEventListener('appinstalled',()=>{$('inst').hidden=true});
if(!EMBED&&!standalone)$('inst').hidden=false;
$('inst').onclick=async()=>{
 if(ip){ip.prompt();await ip.userChoice;ip=null;return}
 const ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform=='MacIntel'&&navigator.maxTouchPoints>1);
 alert(ios?'To install: tap the Share button, then “Add to Home Screen”.':'To install: open the browser menu and choose “Install app” or “Add to Home screen”. If the option is missing, reload the page once and try again.')};
const ofl=()=>{$('off').hidden=navigator.onLine};addEventListener('online',ofl);addEventListener('offline',ofl);ofl();
init();
