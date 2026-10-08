const S={cfg:{},products:[],cats:[],catx:{}};
let V=null,q='',cat=null,sec=null,pay='ef',admin=false,cart={},cname='',sel=null,lastV=null,CSRF='';
try{cart=JSON.parse(localStorage.getItem('cart')||'{}')}catch(e){}
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const money=n=>'$'+Math.round(n).toLocaleString('es-AR');
const rup=(x,s)=>Math.ceil(x/s-1e-9)*s;
const pEf=p=>p.cash;
const pLi=p=>rup(p.cash/(1-S.cfg.dEf/100),S.cfg.rd||1);
const pTr=p=>rup(pLi(p)*(1-S.cfg.dTr/100),S.cfg.rd||1);
const mpCost=n=>Math.min(.95,(+S.cfg.mpCom+ +S.cfg['mp'+n])*(1+S.cfg.mpIva/100)/100);
const pCu=(p,n)=>rup(p.cash/(1-mpCost(n))/n,Math.max(1,(S.cfg.rd||1)/10));
const pCt=(p,n)=>pCu(p,n)*n;
const priceBy=(p,m)=>m=='ef'?pEf(p):m=='tr'?pTr(p):m=='c3'?pCt(p,3):m=='c6'?pCt(p,6):pLi(p);
const off=(p,v)=>Math.round((1-v/pLi(p))*100);
const fixCats=()=>{S.cats=S.cats||[];S.products.forEach(p=>{if(!S.cats.includes(p.cat))S.cats.push(p.cat)})};fixCats();
const cx=c=>(S.catx&&S.catx[c])||{};
const tplOf=p=>{const t=cx(p.cat).desc||'';if(/\{(marca|modelo)\}/.test(t)&&!(p.brand||p.model))return '';return t.replace(/\{marca\}/g,p.brand||'').replace(/\{modelo\}/g,p.model||'').replace(/ +/g,' ').trim()};
const descOf=p=>p.desc||tplOf(p);
const D0={mpCom:4.99,mp3:12.49,mp6:19.79,mpIva:21,rd:100};
function fixData(){fixCats();S.catx=S.catx||{};for(const k in D0)if(S.cfg[k]==null)S.cfg[k]=D0[k];S.cfg.banners=S.cfg.banners||[];S.products.forEach(p=>{p.imgs=p.imgs||[]})}
const cats=()=>S.cats,pcats=()=>S.cats.filter(c=>S.products.some(p=>p.cat==c));
const num=v=>v===''||v==null?null:Math.max(0,+v);
const saveCart=()=>{try{localStorage.setItem('cart',JSON.stringify(cart))}catch(e){}};
const cartCount=()=>Object.values(cart).reduce((a,b)=>a+b,0);
const cartItems=()=>Object.entries(cart).map(([id,n])=>[S.products.find(p=>p.id==id),n]).filter(x=>x[0]);
function toast(t){const e=document.createElement('div');e.id='toast';e.textContent=t;document.body.appendChild(e);setTimeout(()=>e.remove(),2600)}
function badge(){const b=$('#bdg');if(b){b.textContent=cartCount();b.style.display=cartCount()?'':'none'}}
function prices(p){return `${p.old?`<s>${money(p.old)}</s>`:''}<b class="pp">${money(pLi(p))}${p.old?` <small class="ef">${Math.round((1-pLi(p)/p.old)*100)}% OFF</small>`:''}</b><span class="ef">${money(pEf(p))} efectivo (−${off(p,pEf(p))}%)</span><span class="tr">${money(pTr(p))} transferencia (−${off(p,pTr(p))}%)</span><span class="cu">6 cuotas de ${money(pCu(p,6))}</span>`}
function card(p){
 const out=p.stock<=0,i=p.imgs&&p.imgs[0];
 return `<article class="pc" data-a="open" data-id="${p.id}">${p.offer?'<span class="bdg">OFERTA</span>':p.best?'<span class="bdg" style="background:#ff7733">MÁS VENDIDO</span>':''}<div class="im" ${i?`style="background-image:url('${i}')"`:''}>${i?'':'📱'}</div><div class="pb"><div class="tt">${esc(p.title)}</div>${prices(p)}<button class="bt" data-a="add" data-id="${p.id}" ${out?'disabled':''}>${out?'Sin stock':'Agregar al carrito'}</button></div></article>`}

function slider(){const b=S.cfg.banners;if(!b.length)return'';return `<div class="sl" id="sl">${b.map((x,i)=>`<div class="bn g${i%3}" ${x.img?`style="background-image:url('${x.img}')"`:''}>${x.t||x.s?`<div><b>${esc(x.t)}</b><span>${esc(x.s)}</span></div>`:''}</div>`).join('')}</div>`}
function main(){
 if(sel)return pdp();
 const P=S.products;
 if(q.trim()||cat||sec){
  let r=P;if(cat)r=r.filter(p=>p.cat==cat);if(sec)r=r.filter(p=>p[sec]);
  const t=norm(q).split(/\s+/).filter(Boolean);if(t.length)r=r.filter(p=>{const h=norm(p.title+' '+p.cat+' '+(p.brand||'')+' '+(p.model||'')+' '+descOf(p));return t.every(w=>h.includes(w))});
  const ttl=q.trim()?'Resultados para "'+esc(q.trim())+'"':cat?esc(cat):{offer:'Ofertas',best:'Más vendidos',feat:'Productos destacados'}[sec];
  return `<div class="sx"><h2>${ttl} <small>(${r.length})</small></h2><button class="lk" data-a="home">← Inicio</button></div><div class="grid">${r.length?r.map(card).join(''):'<div class="empty">No encontramos ese modelo.<br>Escribinos por WhatsApp y lo consultamos.</div>'}</div>`}
 const row=(k,t)=>{const r=P.filter(p=>p[k]);return r.length?`<section><div class="sx" style="padding:0"><h2>${t}</h2><button class="lk" data-a="sec" data-k="${k}">Ver todo</button></div><div class="hs">${r.slice(0,12).map(card).join('')}</div></section>`:''};
 return slider()+row('offer','Ofertas')+row('feat','Productos destacados')+row('best','Más vendidos')}
function renderMain(){$('#main').innerHTML=main()}

function footer(){const c=S.cfg;return `<footer><b>${esc(c.name)}</b><p>${esc(c.sub)}</p>${c.addr?`<p>📍 ${esc(c.addr)}</p>`:''}${c.hrs?`<p>🕒 ${esc(c.hrs)}</p>`:''}${c.wa?`<a class="wa" target="_blank" rel="noopener" href="https://wa.me/${String(c.wa).replace(/\D/g,'')}">Consultar por WhatsApp</a>`:''}<p>Medios de pago: efectivo (${c.dEf}% OFF) y transferencia (${c.dTr}% OFF).</p><p>© ${new Date().getFullYear()} ${esc(c.name)}</p><p><button class="lk" data-a="login" style="color:var(--mu);font-size:12px;padding:0">🔒 Acceso administrador</button></p></footer>`}
function menu(){return `<div class="ov l" data-a="close"><div class="dr"><h4>${esc(S.cfg.name)}</h4><button data-a="home">🏠 Inicio</button><button data-a="sec" data-k="offer">🔥 Ofertas</button><button data-a="sec" data-k="best">⭐ Más vendidos</button><button data-a="sec" data-k="feat">👍 Destacados</button>${pcats().map(c=>`<button data-a="mcat" data-c="${esc(c)}">${esc(c)}</button>`).join('')}${admin?'<button data-a="admin">⚙ Panel administrador</button>':''}</div></div>`}
function pdp(){
 const p=S.products.find(x=>x.id==sel);
 if(!p)return `<div class="empty" style="padding:40px 12px">Este producto ya no está disponible.<br><button class="btn" style="margin-top:12px" data-a="home">Ir al inicio</button></div>`;
 const rel=S.products.filter(x=>x.cat==p.cat&&x.id!=p.id).slice(0,8),dis=p.stock<=0?'disabled':'';
 const g=p.imgs.length?`<div class="car" id="gal">${p.imgs.map(i=>`<img src="${i}" alt="">`).join('')}</div>${p.imgs.length>1?`<div class="thumbs">${p.imgs.map((i,k)=>`<img src="${i}" alt="" data-a="thumb" data-i="${k}">`).join('')}</div>`:''}`:'<div class="ph">📱</div>';
 return `<div class="crumb"><button class="lk" data-a="pback">← Volver</button><span>${esc(p.cat)}</span></div>
 <div class="pdp"><div class="gal">${g}</div><div class="info"><span class="mu">${p.best?'⭐ Más vendido · ':''}${p.offer?'🔥 Oferta · ':''}${esc(p.cat)}</span><h1>${esc(p.title)}</h1>${p.old?`<s>${money(p.old)}</s>`:''}
 <div class="big">${money(pLi(p))}${p.old?` <small class="ef" style="font-size:15px">${Math.round((1-pLi(p)/p.old)*100)}% OFF</small>`:''}</div>
 <div class="pm"><div class="ef" style="font-size:15px">💵 ${money(pEf(p))} en efectivo <small>(−${off(p,pEf(p))}%)</small></div><div class="tr" style="font-size:15px">🏦 ${money(pTr(p))} por transferencia <small>(−${off(p,pTr(p))}%)</small></div><div style="font-size:15px">💳 3 cuotas de <b>${money(pCu(p,3))}</b> <small>(total ${money(pCt(p,3))})</small></div><div style="font-size:15px">💳 6 cuotas de <b>${money(pCu(p,6))}</b> <small>(total ${money(pCt(p,6))})</small></div><small class="mu">Cuotas fijas con Mercado Pago.</small></div>
 <p class="mu">${p.stock>0?(p.stock<=5?'¡Últimas '+p.stock+' unidades!':'Stock disponible'):'Sin stock'}</p>${warRow(p)}
 <button class="btn big" data-a="buy" data-id="${p.id}" ${dis}>Comprar ahora</button><button class="btn gh big" data-a="add" data-id="${p.id}" ${dis}>Agregar al carrito</button>${askBtn(p)}</div>
 ${descOf(p)?`<div class="dsc"><h2>Descripción</h2><p>${esc(descOf(p))}</p></div>`:''}</div>
 ${rel.length?`<section><div class="sx" style="padding:0"><h2>Más de ${esc(p.cat)}</h2></div><div class="hs">${rel.map(card).join('')}</div></section>`:''}`}
function waHref(){
 const it=cartItems(),tot=it.reduce((a,[p,n])=>a+priceBy(p,pay)*n,0),pn={ef:'Efectivo',tr:'Transferencia',li:'Precio lista',c3:'3 cuotas con Mercado Pago',c6:'6 cuotas con Mercado Pago'}[pay];
 const m=`Hola! Quiero hacer este pedido:\n`+it.map(([p,n])=>`• ${n} x ${p.title} – ${money(priceBy(p,pay)*n)}`).join('\n')+`\nPago: ${pn}\nTotal: ${money(tot)}${/^c\d/.test(pay)?' ('+pay[1]+' cuotas de '+money(tot/+pay[1])+')':''}`+(cname?`\nNombre: ${cname}`:'');
 return 'https://wa.me/'+String(S.cfg.wa||'').replace(/\D/g,'')+'?text='+encodeURIComponent(m)}
function cartSheet(){
 const it=cartItems(),tot=it.reduce((a,[p,n])=>a+priceBy(p,pay)*n,0);
 const body=it.length?it.map(([p,n])=>`<div class="it"><span>${esc(p.title)}<small>${money(priceBy(p,pay))} c/u</small></span><div class="q"><button data-a="dec" data-id="${p.id}">−</button><b>${n}</b><button data-a="inc" data-id="${p.id}">+</button></div></div>`).join('')
 +`<div class="pay">${[['ef','Efectivo'],['tr','Transferencia'],['li','Lista'],['c3','3 cuotas'],['c6','6 cuotas']].map(([k,l])=>`<label><input type="radio" name="pay" value="${k}" ${pay==k?'checked':''}><span>${l}</span></label>`).join('')}</div><label>Tu nombre (opcional)<input id="cname" value="${esc(cname)}"></label><div class="tot"><span>Total</span><span>${money(tot)}</span></div>${/^c\d/.test(pay)?`<span class="mu">${pay[1]} cuotas de ${money(tot/+pay[1])} con Mercado Pago</span>`:''}
 ${S.cfg.wa?`<a class="wa" style="display:block;text-align:center;padding:14px" id="wa" target="_blank" rel="noopener" href="${waHref()}">Enviar pedido por WhatsApp</a>`:'<span class="mu">El local todavía no configuró su WhatsApp.</span>'}<button class="btn gh big" data-a="clear">Vaciar carrito</button>`:'<div class="empty">Tu carrito está vacío</div>';
 return `<div class="ov"><div class="sh"><div class="shh"><b>🛒 Tu carrito</b><button class="ib" data-a="close">✕</button></div>${body}</div></div>`}
function warRow(p){const x=cx(p.cat);if(!x.war&&!x.wd)return'';return `<button class="wrow" data-a="war">🛡 Garantía${x.wd?': '+esc(x.wd):' y condiciones'}<span>Ver condiciones ›</span></button>`}function askBtn(p){if(!S.cfg.wa)return'';const url=location.href.split('#')[0]+'#/p/'+encodeURIComponent(p.id);const m='Hola! Tengo una consulta sobre este producto:\n📱 '+p.title+'\n💵 Efectivo: '+money(pEf(p))+'\n🔗 '+url+'\nRef: '+p.id+'\n\nMi consulta: ';return `<a class="wa ask" target="_blank" rel="noopener" href="https://wa.me/${String(S.cfg.wa).replace(/\D/g,'')}?text=${encodeURIComponent(m)}">💬 Hacer una pregunta por WhatsApp</a>`}
function warSheet(){const p=S.products.find(x=>x.id==sel);if(!p)return'';const x=cx(p.cat);return `<div class="ov"><div class="sh"><div class="shh"><b>🛡 Garantía · ${esc(p.cat)}</b><button class="ib" data-a="close">✕</button></div>${x.wd?`<p><b>${esc(x.wd)}</b></p>`:''}<p style="white-space:pre-line">${esc(x.war||'Consultanos por la garantía de este servicio.')}</p></div></div>`}
function loginSheet(){return `<div class="ov"><div class="sh"><div class="shh"><b>🔒 Acceso administrador</b><button class="ib" data-a="close">✕</button></div><label>Contraseña<input id="pw" type="password" autocomplete="current-password"></label><button class="btn big" data-a="dologin">Entrar</button></div></div>`}
function render(){
 const sh0=$('.sh'),st0=sh0&&V==lastV?sh0.scrollTop:0;lastV=V;
 const sf=({menu:menu,cart:cartSheet,war:warSheet,login:loginSheet}[V])||(window.A&&A.sheets[V]);
 $('#app').innerHTML=`<div class="hd"><div class="top"><button class="ib" data-a="menu">☰</button><b class="logo" data-a="home">${esc(S.cfg.name)}</b>${admin?'<button class="ib" data-a="admin">⚙</button>':''}<button class="ib" data-a="cart">🛒<i id="bdg"></i></button></div><input id="q" type="search" placeholder="Buscá tu modelo (ej: samsung a12)" value="${esc(q)}"></div>
 ${admin&&window.A?A.bar():''}<div id="main">${main()}</div>${footer()}${sf?sf():''}`;badge();
 const sh1=$('.sh');if(sh1&&st0)sh1.scrollTop=st0;
 if(window.A&&A.after)A.after()}
const parse=()=>{const m=location.hash.match(/^#\/p\/(.+)$/);return m?decodeURIComponent(m[1]):null};
function route(){const f=document.activeElement&&document.activeElement.id=='q';sel=parse();V=null;render();scrollTo(0,0);if(f){const i=$('#q');i.focus();i.setSelectionRange(i.value.length,i.value.length)}}
function go(h){if((location.hash||'')==h)route();else location.hash=h}
addEventListener('hashchange',route);
document.addEventListener('click',async e=>{
 const b=e.target.closest('[data-a]');if(!b)return;
 if(b.classList.contains('l')&&e.target.closest('.dr'))return;
 const a=b.dataset.a,id=b.dataset.id,i=+b.dataset.i,p=S.products.find(x=>x.id==id);
 if(a=='add'){e.stopPropagation();cart[id]=Math.min((cart[id]||0)+1,p.stock);saveCart();badge();toast('Agregado: '+p.title)}
 else if(a=='open'){go('#/p/'+encodeURIComponent(id))}
 else if(a=='pback'){go('')}
 else if(a=='thumb'){const g=$('#gal');g.scrollTo({left:i*g.clientWidth,behavior:'smooth'})}
 else if(a=='buy'){cart[id]=Math.min((cart[id]||0)+1,p.stock);saveCart();V='cart';render()}
 else if(a=='cart'){V='cart';render()}
 else if(a=='menu'){V='menu';render()}
 else if(a=='close'){V=null;render()}
 else if(a=='home'){V=null;cat=null;sec=null;q='';go('')}
 else if(a=='sec'){V=null;sec=b.dataset.k;cat=null;q='';go('')}
 else if(a=='mcat'){V=null;cat=b.dataset.c;sec=null;q='';go('')}
 else if(a=='inc'){cart[id]=Math.min((cart[id]||0)+1,p.stock);saveCart();render()}
 else if(a=='dec'){cart[id]--;if(cart[id]<=0)delete cart[id];saveCart();render()}
 else if(a=='clear'){cart={};saveCart();render()}
 else if(a=='war'){V='war';render()}
 else if(a=='login'){V=admin?'admin':'login';render()}
 else if(a=='dologin'){const pw=$('#pw').value;if(!pw)return;
  try{const r=await fetch('api.php?a=login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({pw})});const j=await r.json().catch(()=>({}));
   if(r.status==429){toast('Demasiados intentos. Esperá '+Math.ceil((j.espera||900)/60)+' minutos.');return}
   if(r.status==426){toast('Abrí el sitio con https:// para entrar');return}
   if(r.status==503){toast('Falta instalar: abrí instalar.php');return}
   if(!r.ok){toast('Contraseña incorrecta');return}
   await enterAdmin(j);V='admin';render()}catch(er){toast('No se pudo conectar con el servidor')}}
});
document.addEventListener('input',e=>{
 const t=e.target;
 if(t.id=='q'){q=t.value;if(sel)location.hash='';else renderMain()}
 else if(t.id=='cname'){cname=t.value;const w=$('#wa');if(w)w.href=waHref()}
});
document.addEventListener('change',e=>{const t=e.target;if(t.name=='pay'){pay=t.value;render()}});
document.addEventListener('keydown',e=>{if(e.key=='Enter'&&e.target.id=='pw'){e.preventDefault();document.querySelector('[data-a="dologin"]')?.click()}});
setInterval(()=>{const s=$('#sl');if(!s||V)return;const w=s.clientWidth,n=Math.round(s.scrollLeft/w)+1;s.scrollTo({left:(n>=s.children.length?0:n)*w,behavior:'smooth'})},4500);
function loadScript(src){return new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
async function enterAdmin(j){CSRF=j.csrf;await loadScript('api.php?a=js');A.init(j.brands);admin=true}
async function boot(){
 $('#app').innerHTML='<div class="empty" style="padding:60px 0;text-align:center">Cargando…</div>';
 try{const r=await fetch('data.json?'+Date.now(),{cache:'no-store'});Object.assign(S,await r.json())}catch(e){$('#app').innerHTML='<div class="empty" style="padding:60px 12px;text-align:center">No se pudo cargar el catálogo. Revisá tu conexión.</div>';return}
 fixData();document.title=S.cfg.name||document.title;route();
 try{const r=await fetch('api.php?a=boot',{credentials:'same-origin'});const j=await r.json();if(j.admin){await enterAdmin(j);render()}}catch(e){}
}
boot();
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
