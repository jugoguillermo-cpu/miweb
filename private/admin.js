let F=null,B=null,CF=null,BF=null,tab='prod',aq='',pend=null,AB={},BK=null,saveT=null,saving=false,lastJ='',stat='ok';
function calcPrev(c){if(c==null)return 'Cargá el precio en efectivo y acá ves los demás precios.';const p={cash:c};return `<b>Si cobrás ${money(c)} en efectivo:</b><br>Lista ${money(pLi(p))} · Transferencia ${money(pTr(p))}<br>3 cuotas de ${money(pCu(p,3))} (total ${money(pCt(p,3))})<br>6 cuotas de ${money(pCu(p,6))} (total ${money(pCt(p,6))})`}
function alist(){const t=norm(aq);return S.products.filter(p=>!t||norm(p.title+' '+p.cat).includes(t)).map(p=>`<div class="it pl"><span>${esc(p.title)}<small>${esc(p.cat)} · ${money(p.cash)} efectivo${p.offer?' · 🔥':''}${p.best?' · ⭐':''}${p.feat?' · 👍':''}</small></span><div class="q"><button data-a="stk" data-id="${p.id}" data-d="-1">−</button><b id="st-${p.id}">${p.stock}</b><button data-a="stk" data-id="${p.id}" data-d="1">+</button></div><button class="ib" data-a="edit" data-id="${p.id}">✏️</button><button class="ib" data-a="dup" data-id="${p.id}">📄</button><button class="ib" data-a="del" data-id="${p.id}">${pend=='del'+p.id?'¿Seguro?':'🗑'}</button></div>`).join('')||'<div class="empty">Sin productos</div>'}
function statsBody(){
 const P=S.products,sum=(a,f)=>a.reduce((x,y)=>x+f(y),0),k=(n,l)=>`<div class="kpi"><b>${n}</b><small>${l}</small></div>`;
 const out=P.filter(p=>p.stock<=0),low=P.filter(p=>p.stock>0&&p.stock<=3),noimg=P.filter(p=>!p.imgs.length),avg=P.length?sum(P,p=>p.cash)/P.length:0;
 const li=(t,a)=>a.length?`<div class="shh" style="margin-top:14px;font-size:15px"><b>${t} (${a.length})</b></div><span class="mu">${a.map(p=>esc(p.title)).join(' · ')}</span>`:'';
 return `<div class="kpis">${k(P.length,'Productos')}${k(sum(P,p=>p.stock),'Unidades en stock')}${k(money(avg),'Efectivo promedio')}${k(P.filter(p=>p.offer).length,'En oferta')}${k(P.filter(p=>p.feat).length,'Destacados')}${k(P.filter(p=>p.best).length,'Más vendidos')}</div>
 <div class="shh" style="margin-top:16px;font-size:15px"><b>Por categoría</b></div>${S.cats.map(c=>{const a=P.filter(p=>p.cat==c);return `<div class="it"><span>${esc(c)}<small>${a.length} productos · ${sum(a,p=>p.stock)} unidades${a.length?' · promedio '+money(sum(a,p=>p.cash)/a.length):''}</small></span></div>`}).join('')}
 ${li('Agotados',out)}${li('Stock bajo (3 o menos)',low)}${li('Sin foto',noimg)}
 <span class="mu" style="margin-top:14px">Las visitas y los pedidos de los clientes no se pueden medir desde esta página: los pedidos te llegan por WhatsApp.</span>`}
function tabBody(){
 const c=S.cfg;
 if(tab=='prod')return `<div class="shh"><input id="aq" type="search" placeholder="Buscar producto…" value="${esc(aq)}" style="margin:0"><button class="btn" data-a="newp" style="margin-left:8px;flex:none">+ Nuevo</button></div><div id="al">${alist()}</div>`;
 if(tab=='cat')return `<div class="shh" style="gap:8px"><input id="nc" placeholder="Nueva categoría" style="margin:0"><button class="btn" data-a="addcat" style="flex:none">Agregar</button></div><span class="mu">Tocá ✏️ para cambiar el nombre, la descripción común y las garantías de cada categoría.</span>${S.cats.map((x,i)=>`<div class="it"><span>${esc(x)}<small>${S.products.filter(p=>p.cat==x).length} prod.${cx(x).brand?' · con marca y modelo':''}${cx(x).war?' · con garantía':''}</small></span><button class="ib" data-a="editcat" data-i="${i}">✏️</button><button class="ib" data-a="delc" data-i="${i}">${pend=='delc'+i?'¿Seguro?':'🗑'}</button></div>`).join('')}`;
 if(tab=='brand')return `<div class="shh" style="gap:8px"><input id="nb" placeholder="Nueva marca" style="margin:0"><button class="btn" data-a="addbrand" style="flex:none">Agregar</button></div><span class="mu">Tocá ✏️ para editar los modelos de una marca.</span>${Object.keys(AB).sort().map(b=>`<div class="it"><span>${esc(b)}<small>${AB[b].length} modelos</small></span><button class="ib" data-a="editbrand" data-b="${esc(b)}">✏️</button><button class="ib" data-a="delbrand" data-b="${esc(b)}">${pend=='delbrand'+b?'¿Seguro?':'🗑'}</button></div>`).join('')}`;
 if(tab=='ban')return `<div class="shh"><b>Banners del slider</b><button class="btn" data-a="newb">+ Banner</button></div>${c.banners.map((b,i)=>`<div class="it"><span>${esc(b.t||'(sin título)')}<small>${b.img?'con imagen':'fondo de color'}</small></span><button class="ib" data-a="editb" data-i="${i}">✏️</button><button class="ib" data-a="delb" data-i="${i}">${pend=='delb'+i?'¿Seguro?':'🗑'}</button></div>`).join('')}`;
 if(tab=='stat')return statsBody();
 if(tab=='bk')return `<button class="btn gh big" style="margin-top:0" data-a="dl">⬇ Descargar copia completa</button><button class="btn gh big" data-a="saveNow">Guardar ahora</button><div class="shh" style="margin-top:16px;font-size:15px"><b>Copias automáticas</b></div><span class="mu">Se hacen solas al guardar (hasta una cada 5 minutos) y una por día. Tocá Restaurar para volver a ese momento; antes de restaurar se guarda el estado actual.</span>${BK==null?'<div class="empty">Cargando…</div>':(BK.map(x=>`<div class="it"><span>${new Date(x.t*1000).toLocaleString('es-AR')}<small>${x.kind=='d'?'copia diaria':'automática'} · ${Math.max(1,Math.round(x.size/1024))} KB</small></span><button class="btn gh" data-a="restore" data-id="${esc(x.id)}">${pend=='restore'+x.id?'¿Seguro?':'Restaurar'}</button></div>`).join('')||'<div class="empty">Todavía no hay copias</div>')}`;
 const f=(k,l,t='')=>`<label>${l}<input data-cfg="${k}" ${t} value="${esc(c[k])}"></label>`;
 return `${f('name','Nombre del local')}${f('sub','Subtítulo')}${f('wa','WhatsApp (con código de país, ej: 5492235123456)','inputmode="numeric"')}${f('addr','Dirección')}${f('hrs','Horarios')}
 <div class="row">${f('dEf','Descuento efectivo % (sobre lista)','type="number" inputmode="decimal" step="any"')}${f('dTr','Descuento transferencia % (sobre lista)','type="number" inputmode="decimal" step="any"')}</div>
 <div class="shh" style="margin-top:14px"><b>💳 Cuotas con Mercado Pago</b></div>
 <div class="row">${f('mpCom','Comisión MP por venta %','type="number" inputmode="decimal" step="any"')}${f('mpIva','IVA sobre costos MP %','type="number" inputmode="decimal" step="any"')}</div>
 <div class="row">${f('mp3','Financiación 3 cuotas %','type="number" inputmode="decimal" step="any"')}${f('mp6','Financiación 6 cuotas %','type="number" inputmode="decimal" step="any"')}</div>
 ${f('rd','Redondear precios hacia arriba a ($)','type="number" inputmode="numeric"')}
 <div class="warn" id="ex" style="background:var(--card);color:var(--tx)">${calcPrev(100000)}</div>
 <span class="mu">Valores de referencia de Mercado Pago (abril 2026). Revisalos en tu cuenta de Mercado Pago (Costos y cuotas) y ajustalos. Si tus costos ya incluyen IVA, poné IVA en 0. Los precios en cuotas se calculan para que recibas lo mismo que en efectivo.</span>
 <div class="shh" style="margin-top:18px"><b>🔒 Seguridad</b></div><label>Contraseña actual<input id="opw" type="password" autocomplete="current-password"></label><label>Contraseña nueva (mínimo 8)<input id="npw" type="password" autocomplete="new-password"></label><button class="btn gh big" data-a="setpw">Cambiar contraseña</button><button class="btn gh big" data-a="logout">Cerrar sesión</button>`}
const statTxt=()=>({ok:'Guardado ✔',pend:'Cambios sin guardar…',saving:'Guardando…',err:'⚠ Error al guardar'}[stat]);
function adminSheet(){
 const tabs=[['prod','📦 Productos'],['cat','🗂 Categorías'],['brand','📱 Marcas'],['ban','🖼 Banners'],['stat','📊 Estadísticas'],['bk','💾 Copias'],['cfg','⚙ Ajustes']];
 return `<div class="ov"><div class="sh"><div class="shh"><b>Panel administrador</b><span id="sv" class="mu">${statTxt()}</span><button class="ib" data-a="close">✕</button></div><div class="tabs">${tabs.map(([k,l])=>`<button class="${tab==k?'on':''}" data-a="tab" data-k="${k}">${l}</button>`).join('')}</div>${tabBody()}
 <span class="mu">Todo lo que hacés se guarda solo en tu servidor.</span></div></div>`}
function catSheet(){const c=CF;return `<div class="ov"><div class="sh"><div class="shh"><b>${c.old==null?'Nueva':'Editar'} categoría</b><button class="ib" data-a="back">✕</button></div>
 <label>Nombre<input id="c-n" value="${esc(c.name)}"></label>
 <label>Prefijo del título (ej: Desbloqueo cuenta Google)<input id="c-pre" value="${esc(c.pre)}"></label>
 <div class="ck"><label><input type="checkbox" id="c-brand" ${c.brand?'checked':''}>Pedir marca y modelo al crear productos</label></div>
 <label>Descripción común para todos los productos<textarea id="c-desc" rows="4" placeholder="Ej: Desbloqueo de cuenta Google para {marca} {modelo}.">${esc(c.desc)}</textarea></label><span class="mu">Escribí {marca} y {modelo} donde quieras que aparezcan. Si la cambiás acá, cambia en todos los productos que no tengan descripción propia.</span>
 <label>Garantía corta (ej: 30 días)<input id="c-wd" value="${esc(c.wd)}"></label>
 <label>Avisos de garantía (el cliente los ve al tocar "Garantía")<textarea id="c-war" rows="7">${esc(c.war)}</textarea></label>
 <button class="btn big" data-a="savecat">Guardar categoría</button></div></div>`}
function brandSheet(){const b=BF;return `<div class="ov"><div class="sh"><div class="shh"><b>${b.old==null?'Nueva':'Editar'} marca</b><button class="ib" data-a="back">✕</button></div>
 <label>Marca<input id="br-n" value="${esc(b.name)}"></label>
 <label>Modelos (uno por línea)<textarea id="br-m" rows="14">${esc(b.m)}</textarea></label><span class="mu">Podés pegar una lista entera, un modelo por línea.</span>
 <button class="btn big" data-a="savebrand">Guardar marca</button></div></div>`}
function formSheet(){
 const f=F,v=x=>x==null?'':x,n=(id,l)=>`<label>${l}<input id="${id}" type="number" inputmode="numeric" value="${v(f[id.slice(2)])}"></label>`,x=cx(f.cat),bs=Object.keys(AB).sort(),ms=(AB[f.brand]||[]).slice(),tp=tplOf(f);
 if(f.model&&!ms.includes(f.model))ms.unshift(f.model);
 const op=(a,sel)=>a.map(o=>`<option value="${esc(o)}" ${o==sel?'selected':''}>${esc(o)}</option>`).join('');
 return `<div class="ov"><div class="sh"><div class="shh"><b>${f.id?'Editar':'Nuevo'} producto</b><button class="ib" data-a="back">✕</button></div>
 <label>Categoría<select id="f-cat">${cats().map(c=>`<option ${c==f.cat?'selected':''}>${esc(c)}</option>`).join('')}</select></label>
 ${x.brand?`<div class="row"><label>Marca<select id="f-brand"><option value="">Elegí…</option>${op(bs,f.brand)}</select></label><label>Modelo<select id="f-model"><option value="">Elegí…</option>${op(ms,f.model)}</select></label></div><label>¿No está el modelo? Escribilo acá<input id="f-model2" placeholder="Ej: Galaxy A15"></label>`:''}
 <label>Título${x.brand?' (se completa solo)':''}<input id="f-title" value="${esc(f.title)}" placeholder="Ej: ${esc(x.pre||'Módulo')} Samsung A12"></label>
 <div class="row">${n('f-cash','Precio en efectivo ($)')}${n('f-stock','Stock')}</div><span class="mu">Cargá lo que querés recibir. Lista, transferencia y cuotas se calculan solos.</span>
 <div class="warn" id="cp" style="background:var(--card);color:var(--tx);margin-top:8px">${calcPrev(f.cash)}</div>
  ${n('f-old','Precio lista anterior tachado (opcional, para ofertas)')}
  <div class="ck"><label><input type="checkbox" id="f-feat" ${f.feat?'checked':''}>👍 Destacado</label><label><input type="checkbox" id="f-offer" ${f.offer?'checked':''}>🔥 Oferta</label><label><input type="checkbox" id="f-best" ${f.best?'checked':''}>⭐ Más vendido</label></div>
 <label>Descripción${tp?' (vacía = usa la de la categoría)':''}<textarea id="f-desc" rows="3" placeholder="${esc(tp)}">${esc(f.desc)}</textarea></label>${tp?`<span class="mu">Se muestra: ${esc(tp)}</span>`:''}
 <div class="imgs">${f.imgs.map((s,i)=>`<div class="th"><img src="${s}" alt=""><button data-a="rmimg" data-i="${i}">×</button></div>`).join('')}<label class="add">🖼<br>Galería<input id="f-file" type="file" accept="image/*" multiple class="vh"></label><label class="add">📷<br>Cámara<input id="f-cam" type="file" accept="image/*" capture="environment" class="vh"></label><button type="button" class="add" data-a="paste">📋<br>Pegar</button></div>
 <span class="mu">Hasta 5 fotos. Si no se abre la galería, abrí esta página en Chrome o Safari.</span>
 <button class="btn big" data-a="saveform">Guardar producto</button>${f.id?'':'<button class="btn gh big" data-a="saveadd">Guardar y crear otro</button>'}</div></div>`}
function bannerSheet(){
 return `<div class="ov"><div class="sh"><div class="shh"><b>${B.i<0?'Nuevo':'Editar'} banner</b><button class="ib" data-a="back">✕</button></div>
 <label>Título<input id="b-t" value="${esc(B.t)}"></label><label>Texto chico<input id="b-s" value="${esc(B.s)}"></label>
 <div class="imgs">${B.img?`<div class="th"><img src="${B.img}" alt=""><button data-a="rmb">×</button></div>`:''}<label class="add">📷<br>Elegir imagen<input id="b-file" type="file" accept="image/*" class="vh"></label></div><span class="mu">Recomendado: imagen horizontal. Sin imagen se usa un fondo de color.</span>
 <button class="btn big" data-a="saveb">Guardar banner</button></div></div>`}

function saveProd(){readForm();if(!F.title||F.cash==null){toast('Poné título y precio en efectivo');return false}if(!F.cat)F.cat=cats()[0]||'Otros';if(F.stock==null)F.stock=0;if(!cx(F.cat).brand){F.brand='';F.model=''}
 if(F.id)S.products=S.products.map(x=>x.id==F.id?F:x);else{F.id='p'+Date.now();S.products.push(F)}fixCats();return true}
function readForm(){
 if($('#f-title')&&F){F.title=$('#f-title').value.trim();F.cat=$('#f-cat').value.trim();['stock','cash','old'].forEach(k=>F[k]=num($('#f-'+k).value));F.desc=$('#f-desc').value.trim();if($('#f-brand')){F.brand=$('#f-brand').value;F.model=($('#f-model2')&&$('#f-model2').value.trim())||$('#f-model').value}['feat','offer','best'].forEach(k=>F[k]=$('#f-'+k).checked)}
 if($('#b-t')&&B){B.t=$('#b-t').value.trim();B.s=$('#b-s').value.trim()}}
async function shrink(file,mx){
 let src;
 try{src=await createImageBitmap(file)}catch(e){src=await new Promise((res,rej)=>{const r=new FileReader();r.onerror=rej;r.onload=()=>{const im=new Image();im.onload=()=>res(im);im.onerror=rej;im.src=r.result};r.readAsDataURL(file)})}
 const k=Math.min(1,mx/Math.max(src.width,src.height)),c=document.createElement('canvas');c.width=Math.round(src.width*k);c.height=Math.round(src.height*k);
 const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(src,0,0,c.width,c.height);
 return c.toDataURL('image/jpeg',.8)}
// ---------- servidor: guardado automático ----------
async function api(a,body){
 const r=await fetch('api.php?a='+a,{method:body?'POST':'GET',credentials:'same-origin',headers:body?{'Content-Type':'application/json','X-CSRF':CSRF}:{},body:body?JSON.stringify(body):undefined});
 const j=await r.json().catch(()=>({}));if(!r.ok||j.error){const er=new Error(j.error||'http '+r.status);er.status=r.status;throw er}return j}
const pubS=()=>({cfg:S.cfg,products:S.products,cats:S.cats,catx:S.catx});
const sig=()=>JSON.stringify([pubS(),AB]);
function paint(){const e=$('#sv');if(e)e.textContent=statTxt()}
async function save(force){
 clearTimeout(saveT);if(saving){saveT=setTimeout(save,600);return}
 saving=true;stat='saving';paint();const j0=sig();
 try{const r=await api('save',{data:pubS(),brands:AB});
  if(sig()===j0){Object.assign(S,{cfg:r.data.cfg,products:r.data.products,cats:r.data.cats,catx:r.data.catx});lastJ=sig();stat='ok';saving=false;render()}
  else{lastJ=j0;stat='pend';saving=false;saveT=setTimeout(save,300)}
  if(force)toast('Guardado ✔')}
 catch(e){saving=false;stat='err';paint();if(e.status==401||e.status==403)toast('Se cerró la sesión. Entrá de nuevo.');else toast('No se pudo guardar: '+e.message);render()}
}
function after(){if(!admin)return;if(sig()!==lastJ&&!saving&&stat!='err'){stat='pend';paint();clearTimeout(saveT);saveT=setTimeout(save,1200)}}
async function loadBk(){try{BK=(await api('backups')).list}catch(e){BK=[]}render()}
window.A={sheets:{admin:adminSheet,form:formSheet,cform:catSheet,brform:brandSheet,bform:bannerSheet},
 bar:()=>stat=='err'?'<div class="warn" style="margin:8px 12px 0" data-a="saveNow">⚠ No se pudieron guardar los últimos cambios. Tocá acá para reintentar.</div>':'',
 after,init:b=>{AB=Array.isArray(b)||!b?{}:b;lastJ=sig();stat='ok'}};

// ---------- acciones del panel ----------
document.addEventListener('click',async e=>{
 if(e.target.closest&&e.target.closest('label.add'))toast('Abriendo selector de fotos…');
 const b=e.target.closest('[data-a]');if(!b)return;
 const a=b.dataset.a,id=b.dataset.id,i=+b.dataset.i,p=S.products.find(x=>x.id==id);
 if(!/^del|^restore/.test(a))pend=null;
 if(a=='admin'||a=='back'){readForm();F=B=CF=BF=null;V='admin';render()}
 else if(a=='logout'){await api('logout',{}).catch(()=>{});location.reload()}
 else if(a=='setpw'){const o=$('#opw').value,n=$('#npw').value;if(n.length<8){toast('La nueva contraseña debe tener al menos 8 caracteres');return}
  try{await api('setpw',{old:o,new:n});$('#opw').value='';$('#npw').value='';toast('Contraseña cambiada ✔')}catch(er){toast(er.message=='clave'?'La contraseña actual no es correcta':'No se pudo cambiar')}}
 else if(a=='tab'){tab=b.dataset.k;render();if(tab=='bk')loadBk()}
 else if(a=='saveNow'){stat='pend';await save(true)}
 else if(a=='dl'){location.href='api.php?a=backup&t='+encodeURIComponent(CSRF)}
 else if(a=='restore'){if(pend!='restore'+id){pend='restore'+id;render();return}pend=null;
  try{const r=await api('restore',{id});Object.assign(S,{cfg:r.data.cfg,products:r.data.products,cats:r.data.cats,catx:r.data.catx});fixData();AB=Array.isArray(r.brands)?{}:r.brands;lastJ=sig();stat='ok';toast('Copia restaurada ✔');loadBk()}catch(er){toast('No se pudo restaurar')}}
 else if(a=='stk'){p.stock=Math.max(0,p.stock+(+b.dataset.d));const el=$('#st-'+id);if(el)el.textContent=p.stock}
 else if(a=='dup'){S.products.push({...JSON.parse(JSON.stringify(p)),id:'p'+Date.now(),title:p.title+' (copia)'});render();toast('Producto duplicado')}
 else if(a=='addcat'){const v=$('#nc').value.trim();if(S.cats.includes(v)){toast('Esa categoría ya existe');return}CF={old:null,name:v,pre:v,brand:false,desc:'',wd:'',war:''};V='cform';render()}
 else if(a=='delc'){const c=S.cats[i];if(S.products.some(x=>x.cat==c)){toast('Tiene productos: movelos o borralos primero');return}if(pend!='delc'+i){pend='delc'+i;render();return}pend=null;delete S.catx[c];S.cats.splice(i,1);render()}
 else if(a=='newp'){F={id:'',title:'',cat:cat||cats()[0]||'',brand:'',model:'',old:null,cash:null,stock:1,desc:'',imgs:[],feat:false,offer:false,best:false};V='form';render()}
 else if(a=='edit'){F=JSON.parse(JSON.stringify(p));V='form';render()}
 else if(a=='del'){if(pend!='del'+id){pend='del'+id;render();return}pend=null;S.products=S.products.filter(x=>x.id!=id);delete cart[id];saveCart();render()}
 else if(a=='rmimg'){readForm();F.imgs.splice(i,1);render()}
 else if(a=='saveform'){if(!saveProd())return;F=null;V='admin';render();toast('Guardado ✔')}
 else if(a=='saveadd'){if(!saveProd())return;const o=F;F={id:'',title:'',cat:o.cat,brand:o.brand,model:'',old:o.old,cash:o.cash,stock:o.stock,desc:o.desc,imgs:[],feat:o.feat,offer:o.offer,best:o.best};render();const sh=$('.sh');if(sh)sh.scrollTop=0;toast('Guardado ✔ Elegí el siguiente modelo')}
 else if(a=='newb'){B={i:-1,img:'',t:'',s:''};V='bform';render()}
 else if(a=='editb'){B={i,...S.cfg.banners[i]};V='bform';render()}
 else if(a=='delb'){if(pend!='delb'+i){pend='delb'+i;render();return}pend=null;S.cfg.banners.splice(i,1);render()}
 else if(a=='rmb'){readForm();B.img='';render()}
 else if(a=='saveb'){readForm();const x={img:B.img,t:B.t,s:B.s};if(B.i<0)S.cfg.banners.push(x);else S.cfg.banners[B.i]=x;B=null;V='admin';render()}
 else if(a=='paste'){try{const its=await navigator.clipboard.read();let ok=0;readForm();for(const it of its){const ty=it.types.find(t=>t.startsWith('image/'));if(ty&&F.imgs.length<5){F.imgs.push(await shrink(await it.getType(ty),900));ok++}}if(ok){render();toast('Foto pegada')}else toast('No hay ninguna imagen copiada')}catch(err){toast('Este navegador no permite pegar imágenes acá')}}
 else if(a=='editcat'){const nm=S.cats[i],x=cx(nm);CF={old:nm,name:nm,pre:x.pre||'',brand:!!x.brand,desc:x.desc||'',wd:x.wd||'',war:x.war||''};V='cform';render()}
 else if(a=='savecat'){const g=k=>$('#c-'+k).value.trim(),nm=g('n'),o=CF.old;if(!nm){toast('Poné un nombre');return}if(nm!=o&&S.cats.includes(nm)){toast('Ya existe una categoría con ese nombre');return}
  const x={pre:g('pre'),brand:$('#c-brand').checked,desc:g('desc'),wd:g('wd'),war:g('war')};
  if(o==null)S.cats.push(nm);else if(nm!=o){S.cats[S.cats.indexOf(o)]=nm;delete S.catx[o];S.products.forEach(p=>{if(p.cat==o)p.cat=nm});if(cat==o)cat=nm}
  S.catx[nm]=x;CF=null;V='admin';render();toast('Categoría guardada')}
 else if(a=='addbrand'){const v=$('#nb').value.trim();if(!v)return;if(AB[v]){toast('Esa marca ya existe');return}BF={old:null,name:v,m:''};V='brform';render()}
 else if(a=='editbrand'){const nm=b.dataset.b;BF={old:nm,name:nm,m:(AB[nm]||[]).join('\n')};V='brform';render()}
 else if(a=='savebrand'){const nm=$('#br-n').value.trim(),o=BF.old;if(!nm){toast('Poné el nombre de la marca');return}if(nm!=o&&AB[nm]){toast('Esa marca ya existe');return}
  const ms=[...new Set($('#br-m').value.split('\n').map(x=>x.trim()).filter(Boolean))];
  if(o!=null&&nm!=o){delete AB[o];S.products.forEach(p=>{if(p.brand==o)p.brand=nm})}
  AB[nm]=ms;BF=null;V='admin';render();toast('Marca guardada')}
 else if(a=='delbrand'){const nm=b.dataset.b;if(pend!='delbrand'+nm){pend='delbrand'+nm;render();return}pend=null;delete AB[nm];render()}
});
document.addEventListener('input',e=>{
 const t=e.target;
 if(t.id=='aq'){aq=t.value;$('#al').innerHTML=alist()}
 else if(t.id=='f-cash'){const x=$('#cp');if(x)x.innerHTML=calcPrev(num(t.value))}
 else if(t.dataset.cfg){const k=t.dataset.cfg,v=+t.value;S.cfg[k]=['dEf','dTr'].includes(k)?Math.min(99,Math.max(0,v||0)):['mpCom','mp3','mp6','mpIva'].includes(k)?Math.min(90,Math.max(0,v||0)):k=='rd'?Math.max(1,Math.round(v)||1):t.value;const e=$('#ex');if(e)e.innerHTML=calcPrev(100000)}
});
document.addEventListener('change',async e=>{
 const t=e.target;
 if(t.dataset.ren!=null){return}
 else if(F&&['f-cat','f-brand','f-model','f-model2'].includes(t.id)){
  const m2=$('#f-model2');if(t.id=='f-model'&&m2)m2.value='';if(t.id=='f-brand'){if(m2)m2.value='';const sm=$('#f-model');if(sm)sm.value=''}
  readForm();if(t.id=='f-cat'){F.brand='';F.model=''}
  if(cx(F.cat).brand)F.title=[cx(F.cat).pre,F.brand,F.model].filter(Boolean).join(' ');
  render()}
 else if(t.id=='f-file'||t.id=='f-cam'||t.id=='b-file'){
  const isB=t.id=='b-file',fl=[...t.files];t.value='';if(!fl.length||(isB?!B:!F))return;readForm();toast('Procesando foto…');let ok=0;
  for(const f of fl){try{if(isB){B.img=await shrink(f,1000);ok++;break}if(F.imgs.length>=5){toast('Máximo 5 fotos por producto');break}F.imgs.push(await shrink(f,900));ok++}catch(err){toast('No pude leer esa foto. Probá con otra (JPG o PNG)')}}
  if(isB?!B:!F)return;render();if(ok)toast(ok==1?'Foto agregada':ok+' fotos agregadas')}
});

['click','input','change'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(after,0)));
