const W=360,BR=11,TOTAL=40;let H=640,BASE=512,AC="#00e5ff";
const COLORS=["#00e5ff","#ff3d81","#7cff6b","#b57bff","#ffb400","#2e7bff","#ff5e3a","#19ffb0"];
const cv=document.getElementById("c"),ctx=cv.getContext("2d"),wrap=document.getElementById("wrap");
const menu=document.getElementById("menu");
let S=1,state="menu",level=1,score=0,best=1,deadT=0;
try{best=+(localStorage.getItem("upventure-best")||localStorage.getItem("riseup-best"))||1}catch(e){}
document.getElementById("best").textContent=best>1?"Melhor fase: "+best:"";

let pcs=[],parts=[],deco=[],t=0,spawned=0,total=10,timer=1,drag=null,alt=0,goal=2000,rs=120;
const ball={x:W/2,y:BASE-130,vx:0,vy:0},tgt={x:W/2,y:BASE-130};
const BX=W/2;let BY=BASE;

function init(){
  pcs=[];parts=[];spawned=0;t=0;timer=1;drag=null;alt=0;deco=[];for(let i=0;i<16;i++)deco.push({x:Math.random()*W,y:Math.random()*H,k:i%3?0:1,s:.5+Math.random()*.9});
  rs=110+Math.min(level,35)*3;goal=rs*Math.min(45,16+level*.8);total=1;
  ball.x=tgt.x=W/2;ball.y=tgt.y=BASE-130;ball.vx=ball.vy=0;
  AC=COLORS[(level-1)%COLORS.length];wrap.style.setProperty("--ac",AC);
}

function spawn(){
  const r=Math.random(),fv=160+Math.min(level,35)*9;
  let p;
  if(level>=2&&r<.35)p={len:70+Math.random()*50,r:4,kind:"bar"};
  else if(r<.65)p={len:16,r:8,kind:"sq"};
  else p={len:0,r:10,kind:"ci"};
  p.x=20+Math.random()*(W-40);p.y=-40;
  p.vy=fv*(.85+Math.random()*.4);
  const tx=BX+(Math.random()-.5)*Math.max(24,70-level*2),tt=(BASE+40)/p.vy;
  p.vx=(tx-p.x)/tt;
  p.a=Math.random()*6.28;p.w=(Math.random()-.5)*4;p.hit=false;
  pcs.push(p);spawned++;
}

let gapT=0;
function form(){
  const fv=160+Math.min(level,35)*9,L2=level,cx=BX+(Math.random()-.5)*50;
  const add=o=>{o.vx=0;o.vy=fv;o.w=0;o.hit=false;o.a=o.a||0;if(o.kind!=="bar")o.len=0;pcs.push(o)};
  const q=Math.random();let h=0;
  if(q<.34){
    const n=Math.min(10,2+Math.floor(L2/2)),sp=Math.max(11,18-L2*.3);
    for(let i=0;i<n;i++)add({kind:"bar",len:W+40,r:3,x:W/2,y:-30-i*sp});
    h=n*sp;
  }else if(q<.62){
    const rows=Math.min(8,3+Math.floor(L2/3)),s=17;
    for(let r=0;r<rows;r++){const c=rows-r;for(let k=0;k<c;k++)add({kind:"hx",r:7,x:cx+(k-(c-1)/2)*s,y:-30-r*s*.9})}
    h=rows*s;
  }else if(q<.82){
    for(let x=14;x<W;x+=20)add({kind:"ci",r:5,x,y:-30});
    const n=Math.min(6,1+Math.floor(L2/4));
    for(let i=0;i<n;i++)add({kind:"bar",len:W+40,r:3,x:W/2,y:-60-i*26});
    h=n*26+40;
  }else{
    const n=Math.min(9,4+Math.floor(L2/4));
    for(let i=0;i<n;i++){const k=i-(n-1)/2;add({kind:"bar",len:85,r:4,x:cx+k*24,y:-30-Math.abs(k)*6,a:Math.PI/2+k*.3})}
    h=80;
  }
  gapT=h/fv+.35;spawned++;
}
const adds=[];
function breakBar(p,c){
  const dx=Math.cos(p.a),dy=Math.sin(p.a),h=p.len/2,g=BR+16;
  const t=Math.max(-h,Math.min(h,(c.x-p.x)*dx+(c.y-p.y)*dy));
  p.dead=true;if(!p.hit)score++;
  burst(c.x,c.y,8,170);
  for(const sd of [-1,1]){
    const a0=sd<0?-h:t+g,a1=sd<0?t-g:h,L=a1-a0;
    if(L<8)continue;
    const m=(a0+a1)/2;
    adds.push({kind:"bar",len:L,r:p.r,x:p.x+dx*m,y:p.y+dy*m,a:p.a,vx:p.vx+sd*dx*200,vy:p.vy*.85+sd*dy*200,w:sd*(1+Math.random()*2),hit:true,frag:true});
  }
}
function ends(p){const h=p.len/2,c=Math.cos(p.a)*h,s=Math.sin(p.a)*h;return[p.x-c,p.y-s,p.x+c,p.y+s]}
function closest(px,py,e){
  const dx=e[2]-e[0],dy=e[3]-e[1],l=dx*dx+dy*dy;
  let k=l?((px-e[0])*dx+(py-e[1])*dy)/l:0;k=Math.max(0,Math.min(1,k));
  const x=e[0]+k*dx,y=e[1]+k*dy;return{x,y,d:Math.hypot(px-x,py-y)};
}

function burst(x,y,n,v){
  if(parts.length>120)return;
  for(let i=0;i<n;i++){const a=Math.random()*6.28,s=v*(.4+Math.random());
    parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.8,r:2+Math.random()*3})}
}
function pop(){state="dead";deadT=0;burst(BX,BY,28,200)}

function update(dt){
  t+=dt;
  if(state==="play"){
    timer-=dt;alt+=rs*dt;for(const q of deco){q.y+=rs*dt*(q.k?.35:1.6)*q.s;if(q.y>H+40){q.y=-40;q.x=Math.random()*W}}
    if(timer<=0&&alt<goal-260){
      const n=1+(level>=3&&Math.random()<.35?1:0)+(level>=8&&Math.random()<.3?1:0);
      if(Math.random()<Math.min(.8,.1+level*.045))form();else for(let i=0;i<n;i++)spawn();
      timer=Math.max(.14,.9-level*.05)*(.7+Math.random()*.6)+gapT;gapT=0;
    }
    const k=Math.min(1,dt*22),ox=ball.x,oy=ball.y;
    ball.x+=(tgt.x-ball.x)*k;ball.y+=(tgt.y-ball.y)*k;
    ball.vx=Math.max(-900,Math.min(900,(ball.x-ox)/dt));
    ball.vy=Math.max(-900,Math.min(900,(ball.y-oy)/dt));
    for(const p of pcs){
      p.x+=p.vx*dt;p.y+=p.vy*dt;p.a+=p.w*dt;
      if(!p.frag&&p.x<8){p.x=8;p.vx=Math.abs(p.vx)}
      if(!p.frag&&p.x>W-8){p.x=W-8;p.vx=-Math.abs(p.vx)}
      const e=ends(p),c=closest(ball.x,ball.y,e);
      if(c.d<p.r+BR&&p.kind==="bar"&&p.len>30){breakBar(p,c);continue}
      if(c.d<p.r+BR){
        let nx=c.x-ball.x,ny=c.y-ball.y;const d=Math.hypot(nx,ny);
        if(d<.01){nx=0;ny=-1}else{nx/=d;ny/=d}
        const ov=p.r+BR-c.d;p.x+=nx*ov;p.y+=ny*ov;
        const sp=Math.max(320,Math.hypot(ball.vx,ball.vy)*1.1);
        p.vx=nx*sp+ball.vx*.3;p.vy=ny*sp+ball.vy*.3;p.w=(Math.random()-.5)*14;
        if(!p.hit){p.hit=true;score++;burst(c.x,c.y,5,110)}
      }
      if(closest(BX,BY,e).d<p.r+14){pop();return}
    }
    {for(const a of adds)pcs.push(a);adds.length=0;let j=0;for(const p of pcs)if(!p.dead&&p.y<H+80&&p.y>-420&&p.x>-500&&p.x<W+500)pcs[j++]=p;pcs.length=j}
    if(alt>=goal){
      state="complete";
      if(level<TOTAL&&level+1>best){best=level+1;try{localStorage.setItem("upventure-best",best)}catch(e){}}
    }
  }
  if(state==="dead")deadT+=dt;
  for(const p of parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=260*dt;p.life-=dt}
  {let j=0;for(const p of parts)if(p.life>0)parts[j++]=p;parts.length=j}
}

function drawBalloon(){
  const x=BX,y=BY;
  ctx.fillStyle="rgba(120,220,255,.12)";if(alt<260)ctx.fillRect(0,y+52+alt,W,H);
  ctx.strokeStyle="rgba(255,255,255,.85)";ctx.lineWidth=1.5;ctx.beginPath();
  ctx.moveTo(x,y+24);ctx.bezierCurveTo(x+Math.sin(t*4)*4,y+36,x-Math.sin(t*4)*4,y+46,x,y+56);ctx.stroke();
  ctx.fillStyle="#fff";
  ctx.globalAlpha=.18;ctx.fillStyle=AC;ctx.beginPath();ctx.ellipse(x,y,22,26,0,0,6.283);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle="#fff";ctx.beginPath();ctx.ellipse(x,y,15,19,0,0,6.283);ctx.fill();ctx.strokeStyle=AC;ctx.lineWidth=2;ctx.stroke();
  ctx.beginPath();ctx.moveTo(x,y+17);ctx.lineTo(x-4,y+25);ctx.lineTo(x+4,y+25);ctx.fill();
}

function draw(){
  const sc=cv.width/W;ctx.setTransform(sc,0,0,sc,0,0);
  ctx.clearRect(0,0,W,H);
  ctx.strokeStyle=AC;ctx.lineWidth=1;ctx.globalAlpha=.09;ctx.beginPath();
  for(let x=0;x<=W;x+=30){ctx.moveTo(x,0);ctx.lineTo(x,H)}
  for(let y=(alt*.5)%30-30;y<=H;y+=30){ctx.moveTo(0,y);ctx.lineTo(W,y)}
  ctx.stroke();ctx.globalAlpha=1;
  ctx.fillStyle=AC;ctx.strokeStyle=AC;for(const q of deco){if(q.k){ctx.globalAlpha=.25;ctx.lineWidth=1;ctx.beginPath();ctx.arc(q.x,q.y,14*q.s,0,6.283);ctx.stroke()}else{ctx.globalAlpha=.4;ctx.fillRect(q.x,q.y,1.5,30*q.s)}}ctx.globalAlpha=1;ctx.fillStyle="#eaffff";ctx.strokeStyle="#eaffff";ctx.lineCap="butt";
  ctx.beginPath();
  for(const p of pcs){
    if(p.kind==="hx"){for(let k=0;k<6;k++){const a=p.a+k*1.0472,x=p.x+Math.cos(a)*p.r*1.2,y=p.y+Math.sin(a)*p.r*1.2;if(k)ctx.lineTo(x,y);else ctx.moveTo(x,y)}ctx.closePath()}
    else if(p.kind==="ci"){ctx.moveTo(p.x+p.r,p.y);ctx.arc(p.x,p.y,p.r,0,6.283)}
  }
  ctx.fill();
  for(const rr of [3,4,8]){
    ctx.lineWidth=rr*2;ctx.beginPath();
    for(const p of pcs){if(p.kind!=="hx"&&p.kind!=="ci"&&p.r===rr){const e=ends(p);ctx.moveTo(e[0],e[1]);ctx.lineTo(e[2],e[3])}}
    ctx.stroke();
  }
  ctx.shadowBlur=0;if(state!=="dead")drawBalloon();else{ctx.fillStyle="rgba(120,220,255,.12)";if(alt<260)ctx.fillRect(0,BY+52+alt,W,H)}
  if(state!=="dead"){
    ctx.globalAlpha=.2;ctx.fillStyle=AC;ctx.beginPath();ctx.arc(ball.x,ball.y,BR+7,0,6.283);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=AC;ctx.beginPath();ctx.arc(ball.x,ball.y,BR,0,6.283);ctx.fill();
    ctx.strokeStyle="rgba(255,255,255,.9)";ctx.lineWidth=2;ctx.stroke();
  }
  ctx.fillStyle="#fff";
  for(const p of parts){ctx.globalAlpha=Math.max(0,p.life);ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.283);ctx.fill()}
  ctx.globalAlpha=1;
  ctx.fillStyle="#fff";ctx.font="600 16px Consolas,ui-monospace,monospace";
  ctx.textAlign="left";ctx.fillText(score,16,28);
  ctx.font="10px Consolas,ui-monospace,monospace";ctx.globalAlpha=.8;ctx.fillText("PONTOS",16,41);
  ctx.textAlign="right";ctx.font="600 16px Consolas,ui-monospace,monospace";ctx.globalAlpha=1;
  ctx.fillText(level+" / "+TOTAL,W-16,28);
  ctx.font="10px Consolas,ui-monospace,monospace";ctx.globalAlpha=.8;ctx.fillText("FASE",W-16,41);ctx.globalAlpha=1;
  const prog=state==="complete"?1:alt/goal;
  ctx.fillStyle="rgba(255,255,255,.3)";ctx.fillRect(16,50,W-32,3);
  ctx.fillStyle=AC;ctx.fillRect(16,50,(W-32)*Math.max(0,Math.min(1,prog)),3);
  ctx.textAlign="center";
  if(state==="ready"){
    ctx.font="600 17px Consolas,ui-monospace,monospace";
    ctx.fillText("Arraste a bolinha para",W/2,H*.4);
    ctx.fillText("proteger o balão",W/2,H*.4+24);
  }
  if(state==="dead"&&deadT>.5){
    ctx.font="600 26px Consolas,ui-monospace,monospace";ctx.fillText("O balão estourou",W/2,H*.4);
    ctx.font="16px Consolas,ui-monospace,monospace";ctx.fillText("Toque para tentar de novo",W/2,H*.4+32);
  }
  if(state==="complete"){
    ctx.font="600 26px Consolas,ui-monospace,monospace";
    ctx.fillText(level>=TOTAL?"Você zerou o jogo!":"Fase "+level+" concluída",W/2,H*.4);
    ctx.font="16px Consolas,ui-monospace,monospace";
    ctx.fillText(level>=TOTAL?"Toque para recomeçar":"Toque para continuar",W/2,H*.4+32);
  }
}

let last=0;
function loop(ts){
  const dt=Math.min(.033,(ts-last)/1000||.016);last=ts;
  if(state!=="menu")update(dt);
  if(state!=="menu")draw();requestAnimationFrame(loop);
}

function resize(){
  const vw=innerWidth,vh=innerHeight;
  H=Math.max(560,Math.min(800,Math.round(W*vh/vw)));
  BASE=Math.round(H*.8);BY=BASE;
  S=Math.min(vw/W,vh/H);
  wrap.style.width=Math.floor(W*S)+"px";wrap.style.height=Math.floor(H*S)+"px";
  const dpr=Math.min(devicePixelRatio||1,1.5);
  cv.width=Math.round(W*S*dpr);cv.height=Math.round(H*S*dpr);
  if(state==="ready"||state==="menu"){ball.x=tgt.x=W/2;ball.y=tgt.y=BASE-130}
  tgt.y=Math.min(tgt.y,BASE-40);
}
addEventListener("resize",resize);resize();

function pt(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/S,y:(e.clientY-r.top)/S}}
const cl=()=>{tgt.x=Math.max(BR,Math.min(W-BR,tgt.x));tgt.y=Math.max(70,Math.min(BASE-40,tgt.y))};
wrap.addEventListener("pointerdown",e=>{
  if(state==="menu")return;
  if(state==="ready")state="play";
  if(state==="play"){const p=pt(e);drag={x:p.x,y:p.y,bx:tgt.x,by:tgt.y}}
  else if(state==="dead"&&deadT>.5){init();state="ready"}
  else if(state==="complete"){level=level>=TOTAL?1:level+1;if(level===1)score=0;init();state="ready"}
});
wrap.addEventListener("pointermove",e=>{
  if(state==="play"&&drag){const p=pt(e);tgt.x=drag.bx+(p.x-drag.x)*1.2;tgt.y=drag.by+(p.y-drag.y)*1.2;cl()}
});
const end=()=>{drag=null};
addEventListener("pointerup",end);addEventListener("pointercancel",end);
addEventListener("keydown",e=>{
  if(state!=="play")return;
  const m={ArrowLeft:[-40,0],ArrowRight:[40,0],ArrowUp:[0,-40],ArrowDown:[0,40]}[e.key];
  if(m){tgt.x+=m[0];tgt.y+=m[1];cl()}
});

document.getElementById("play").addEventListener("click",()=>{
  menu.classList.add("hide");level=1;score=0;init();state="ready";
});
init();requestAnimationFrame(loop);
