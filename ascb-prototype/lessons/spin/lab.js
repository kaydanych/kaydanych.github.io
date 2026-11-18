'use strict';
(()=>{
const $=id=>document.getElementById(id),TAU=Math.PI*2,C={bg:'#10141d',ink:'#edf0f7',muted:'#a3adbf',line:'#333c4c',cyan:'#70c9e9',lime:'#d4ef8a',purple:'#b5a1ff'};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const state={angle:.22,slowdown:1000,z:0,playing:!reduced,emission:true};
let last=0,raf=0,elapsed=0,seed=19;
const RPM=4000,EXPOSURE=.010,HOLD=.005;
let defocus=.66,aperture=6,raceRunning=false,raceTime=0;
const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const holes=[];for(let arm=0;arm<12;arm++)for(let j=0;j<34;j++){const r=16+j*4.05,a=arm*TAU/12+j*.075;holes.push({r,a});}
const fluor=[];for(let i=0;i<65;i++){const a=rand()*TAU,r=Math.sqrt(rand())*.88;const x=Math.cos(a)*r,y=Math.sin(a)*r*.77,z=(rand()-.5)*1.7;for(let j=0;j<16;j++)fluor.push({x:x+(j-8)*.012,y:y+Math.sin(j*.25+i)*.035,z:z+Math.sin(j*.18+i)*.10});}
const n=144,coverage=new Float32Array(n*n),source=new Float32Array(n*n),off=document.createElement('canvas');off.width=off.height=n;const og=off.getContext('2d');
function clear(g){g.clearRect(0,0,g.canvas.width,g.canvas.height);g.fillStyle=C.bg;g.fillRect(0,0,g.canvas.width,g.canvas.height);g.lineWidth=1;}
function line(g,x,y,u,v,color=C.line,width=1){g.beginPath();g.moveTo(x,y);g.lineTo(u,v);g.strokeStyle=color;g.lineWidth=width;g.stroke();g.lineWidth=1;}
function dot(g,x,y,r,color){g.beginPath();g.arc(x,y,r,0,TAU);g.fillStyle=color;g.fill();}
function ellipse(g,x,y,rx,ry,fill,stroke){g.beginPath();g.ellipse(x,y,rx,ry,-.13,0,TAU);if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.stroke();}}
function txt(g,t,x,y,color=C.muted,size=13){g.font=`${size}px system-ui`;g.fillStyle=color;g.fillText(t,x,y);}
function poly(g,pts,fill,stroke){g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.stroke();}}
function arrow(g,x,y,u,v,color){line(g,x,y,u,v,color,1.4);const a=Math.atan2(v-y,u-x);line(g,u,v,u-7*Math.cos(a-.4),v-7*Math.sin(a-.4),color);line(g,u,v,u-7*Math.cos(a+.4),v-7*Math.sin(a+.4),color);}
const pr=(x,y,z)=>({x:267+x*.98+y*.47,y:520+y*.30-x*.13-z});
function ring(g,z){const pts=[];for(let k=0;k<=90;k++){const a=k*TAU/90;pts.push(pr(156*Math.cos(a),156*Math.sin(a),z));}poly(g,pts,'#202937e8','#526075');}
function active(){const a=[];for(const h of holes){const x=h.r*Math.cos(h.a+state.angle),y=h.r*Math.sin(h.a+state.angle);if((x-85)**2+y*y<43**2)a.push({x,y,sx:(x-85)/43,sy:y/43});}return a;}
function drawOptics(spots){const g=$('optics').getContext('2d');clear(g);
// Shared spindle; fixed illumination illuminates a patch, not the whole disk.
const shaftTop=pr(0,0,418),shaftBottom=pr(0,0,214);line(g,shaftTop.x,shaftTop.y,shaftBottom.x,shaftBottom.y,'#536174',7);
const beamTop=[pr(42,-30,495),pr(128,-30,495),pr(128,30,495),pr(42,30,495)],beamBottom=beamTop.map(p=>({x:p.x,y:p.y+108}));poly(g,[beamTop[0],beamTop[1],beamBottom[1],beamBottom[0]],'#70c9e914');
ring(g,388);
for(const h of holes){const x=h.r*Math.cos(h.a+state.angle),y=h.r*Math.sin(h.a+state.angle),p=pr(x,y,388);ellipse(g,p.x,p.y,3.3,1.7,'#70c9e94c','#70c9e960');}
for(const s of spots){const p=pr(s.x,s.y,388);line(g,p.x,p.y-104,p.x,p.y,C.cyan+'54',2);ellipse(g,p.x,p.y,4,2,'#b4efff',C.cyan);const h=pr(s.x,s.y,248);poly(g,[{x:p.x-3.5,y:p.y},{x:p.x+3.5,y:p.y},h],C.cyan+'33');line(g,p.x,p.y,h.x,h.y,C.cyan+'62');}
// Fixed dichroic inside the illuminated patch between the disks.
const d=pr(85,0,306);
ring(g,248);
for(const h of holes){const p=pr(h.r*Math.cos(h.a+state.angle),h.r*Math.sin(h.a+state.angle),248);ellipse(g,p.x,p.y,2.3,1.1,C.bg,'#7b8b9a66');}
// Composite the stationary dichroic over the lower disk, retaining its between-disk position.
poly(g,[{x:d.x-59,y:d.y+22},{x:d.x+62,y:d.y-27},{x:d.x+72,y:d.y-11},{x:d.x-49,y:d.y+38}],'#b5a1ff42','#b5a1ffcc');
const planeZ=26+state.z*18,objective=pr(85,0,119),cell=pr(85,0,planeZ);
for(const s of spots){const h=pr(s.x,s.y,248),o=pr(85+(s.x-85)*.70,s.y*.70,119),f=pr(85+(s.x-85)*.60,s.y*.60,planeZ);line(g,h.x,h.y,o.x,o.y,C.cyan+'80');poly(g,[{x:o.x-3,y:o.y},{x:o.x+3,y:o.y},f],C.cyan+'20');line(g,o.x,o.y,f.x,f.y,C.cyan+'90');}
// Objective barrel and lens.
poly(g,[{x:objective.x-45,y:objective.y-29},{x:objective.x+45,y:objective.y-29},{x:objective.x+31,y:objective.y+8},{x:objective.x-31,y:objective.y+8}],'#263343','#728396');ellipse(g,objective.x,objective.y+7,31,9,'#70c9e929',C.cyan);
ellipse(g,cell.x,515,59,24,'#b5a1ff12','#b5a1ff70');ellipse(g,cell.x+7,511,17,10,'#b5a1ff24');ellipse(g,cell.x,cell.y,56,17,'#b5a1ff15',C.purple);
for(const s of spots){const f=pr(85+(s.x-85)*.6,s.y*.6,planeZ);dot(g,f.x,f.y,1.9,C.cyan);}
if(state.emission){for(const s of spots.filter((_,i)=>i%3===0)){const f=pr(85+(s.x-85)*.6,s.y*.6,planeZ),h=pr(s.x,s.y,248),m=pr(s.x,s.y,306);line(g,f.x+2,f.y,h.x+2,h.y,C.lime+'77');line(g,h.x+2,h.y,m.x+2,m.y,C.lime+'bb');line(g,m.x+2,m.y,617,m.y,C.lime+'55');}arrow(g,530,d.y,584,d.y,C.lime);arrow(g,cell.x+34,451,cell.x+32,417,C.lime);}
// Detection optics and camera on the stationary side branch.
ellipse(g,557,d.y,9,30,'#d4ef8a22',C.lime);ellipse(g,590,d.y,8,33,'#70c9e91a',C.cyan);g.fillStyle='#24303c';g.fillRect(622,d.y-31,56,62);g.strokeStyle='#74808e';g.strokeRect(622,d.y-31,56,62);g.fillStyle='#d4ef8a44';g.fillRect(629,d.y-22,6,44);
// Rotation marker stays in register on both disks.
for(const z of [388,248]){const p=pr(149*Math.cos(state.angle),149*Math.sin(state.angle),z);dot(g,p.x,p.y,4.7,C.purple);}
arrow(g,448,44,448,82,C.cyan);txt(g,'Expanded laser',473,60,C.cyan);txt(g,'Microlens disk',36,98,C.ink,15);line(g,144,103,pr(-103,0,388).x,pr(-103,0,388).y);txt(g,'Pinhole disk',38,245,C.ink,15);line(g,135,250,pr(-110,0,248).x,pr(-110,0,248).y);txt(g,'Shared shaft',39,178);line(g,135,173,shaftTop.x,190);txt(g,'Dichroic',493,160,C.purple);line(g,488,166,d.x+25,d.y-5,C.purple+'80');txt(g,'Camera',626,279,C.ink);txt(g,'Emission filter',536,296,C.muted,12);txt(g,'Objective',462,409,C.ink,15);line(g,452,410,objective.x+38,objective.y);txt(g,'Cell + focal plane',451,514,C.purple);line(g,442,508,cell.x+50,cell.y);txt(g,'Both disks rotate together',40,603,C.ink);txt(g,'Fixed beam · moving lens / pinhole pairs',40,627,C.muted);
}
function drawCell(spots){const g=$('cell').getContext('2d');clear(g);const p=(x,y,z)=>({x:210+x*140+y*35,y:192+y*64-x*9-z*61});
for(const z of [-.85,0,.85]){const pts=[];for(let i=0;i<90;i++){const a=i*TAU/90;pts.push(p(Math.cos(a),Math.sin(a)*.8,z));}poly(g,pts,'#b5a1ff05','#b5a1ff35');}
for(const f of fluor){const q=p(f.x,f.y,f.z),v=Math.exp(-(((f.z-state.z)/.20)**2));dot(g,q.x,q.y,v> .2?1.9:1.05,`rgba(212,239,138,${.08+.72*v})`);}
const pts=[p(-1,-.8,state.z),p(1,-.8,state.z),p(1,.8,state.z),p(-1,.8,state.z)];poly(g,pts,'#b5a1ff0d','#b5a1ff99');
for(const s of spots){const q=p(s.sx,s.sy*.8,state.z),top=p(s.sx,s.sy*.8,1.37);line(g,top.x,top.y,q.x,q.y,C.cyan+'30');const gr=g.createRadialGradient(q.x,q.y,0,q.x,q.y,8);gr.addColorStop(0,'#70c9e9b0');gr.addColorStop(1,'#70c9e900');dot(g,q.x,q.y,8,gr);dot(g,q.x,q.y,1.8,C.cyan);}
const axis=p(-1.15,.9,0);arrow(g,axis.x,axis.y+27,axis.x,axis.y-61,C.muted);txt(g,'z',axis.x-17,axis.y-62);txt(g,'Selected plane',242,300,C.purple);txt(g,'Synthetic fluorescent structures',22,25,C.lime,12);
}
function rebuild(){source.fill(0);coverage.fill(0);elapsed=0;for(const f of fluor){const zWeight=Math.exp(-.5*((f.z-state.z)/.17)**2),xx=(f.x+1)*.5*n,yy=(f.y/.8+1)*.5*n;for(let j=-4;j<=4;j++)for(let i=-4;i<=4;i++){const x=Math.round(xx+i),y=Math.round(yy+j);if(x>=0&&y>=0&&x<n&&y<n)source[y*n+x]+=zWeight*.35*Math.exp(-(i*i+j*j)/3);}}}
function accumulate(spots){for(const s of spots){const x0=Math.round((s.sx+1)*n/2),y0=Math.round((s.sy+1)*n/2);for(let y=Math.max(0,y0-6);y<Math.min(n,y0+7);y++)for(let x=Math.max(0,x0-6);x<Math.min(n,x0+7);x++){const d=(x-x0)**2+(y-y0)**2;if(d<36)coverage[y*n+x]=Math.min(1,coverage[y*n+x]+.32*Math.exp(-d/14));}}}
function drawCamera(){const g=$('camera').getContext('2d');clear(g);const im=og.createImageData(n,n);for(let i=0;i<n*n;i++){const t=Math.min(1,source[i]*coverage[i]);im.data[4*i]=16+196*t;im.data[4*i+1]=20+219*t;im.data[4*i+2]=29+109*t;im.data[4*i+3]=255;}og.putImageData(im,0,0);g.drawImage(off,89,10,242,242);txt(g,`z = ${state.z.toFixed(2)} · relative depth`,89,274,C.muted,12);$('exposure-out').textContent=elapsed<EXPOSURE?`${(elapsed*1000).toFixed(1)} / 10 ms exposure`:'10 ms exposure · held';}
function draw(){const s=active();drawOptics(s);drawCell(s);drawCamera();$('angle-out').textContent=`Linked disks · ${Math.round(state.angle*180/Math.PI)%360}°`;}
function ui(){ $('play').textContent=state.playing?'Pause rotation':'Play rotation';$('speed-out').textContent=`${Math.round(state.slowdown).toLocaleString('en-US')}× slower`;$('timing').textContent=`4,000 rpm · 15 ms per revolution → ${(60/RPM*state.slowdown).toFixed(1)} s on screen`;$('depth-out').textContent=`${state.z.toFixed(2)} · relative z`;$('section-depth-out').textContent=$('depth-out').textContent;}
function tick(t){raf=0;if(document.hidden)return;const dt=last?Math.max(0,(t-last)/1000):0;last=t;if(state.playing){const realDt=dt/state.slowdown;state.angle=(state.angle+realDt*TAU*RPM/60)%TAU;elapsed+=realDt;if(elapsed>EXPOSURE+HOLD){elapsed%=EXPOSURE+HOLD;coverage.fill(0);}if(elapsed<EXPOSURE)accumulate(active());draw();}if(raceRunning){raceTime=Math.min(9.6,raceTime+dt);drawRace();if(raceTime>=9.6){raceRunning=false;$('race-play').textContent='Replay comparison';$('race-status').textContent='Both fields complete · 8 simultaneous spots used ⅛ of the scan time in this model';}}if(state.playing||raceRunning)raf=requestAnimationFrame(tick);}
function start(){last=0;if(!raf&&(state.playing||raceRunning)&&!document.hidden)raf=requestAnimationFrame(tick);}
$('play').onclick=()=>{state.playing=!state.playing;ui();start();};
$('speed').oninput=e=>{state.slowdown=10**(+e.target.value);ui();};
function setDepth(z){state.z=z;$('depth').value=z;$('section-depth').value=z;rebuild();accumulate(active());ui();draw();drawSections();$('status').textContent=`Focus moved to z = ${state.z.toFixed(2)}. Rotation still scans laterally; the camera is recording a new section.`;}
$('depth').oninput=e=>setDepth(+e.target.value);$('section-depth').oninput=e=>setDepth(+e.target.value);
$('emission').onchange=e=>{state.emission=e.target.checked;draw();$('status').textContent=state.emission?'Fluorescence returns through the pinholes and branches toward the camera.':'Fluorescence return hidden. Follow excitation through the paired disks to the specimen.';};
function drawConfocal(){
for(const [id,dz]of [['focused-rays',0],['defocused-rays',defocus]]){const g=$(id).getContext('2d');clear(g);const lensX=175,mid=146,objectX=40+dz*45,u=lensX-objectX,f=67.5,v=f*u/(u-f),imageX=lensX+v,plateX=310;const sigma=Math.hypot(1.5,(1-135/v)*32),pass=1-Math.exp(-aperture*aperture/(2*sigma*sigma));
// Emission converges at the conjugate image plane. Opaque disk intercepts every ray outside its aperture.
for(let i=-4;i<=4;i++){const ly=mid+i*12,atPlate=mid+(ly-mid)*(1-(plateX-lensX)/v);line(g,objectX,mid,lensX,ly,C.lime+'75');line(g,lensX,ly,plateX,atPlate,C.lime+'aa');if(Math.abs(atPlate-mid)<=aperture){const detectorY=mid+(ly-mid)*(1-(405-lensX)/v);line(g,plateX,atPlate,405,detectorY,C.lime+'99');}else{dot(g,plateX,atPlate,3,'#ec9b83');}}
ellipse(g,lensX,mid,9,65,'#70c9e922',C.cyan);g.fillStyle='#728093';g.fillRect(plateX-4,mid-77,8,77-aperture);g.fillRect(plateX-4,mid+aperture,8,77-aperture);g.fillStyle=C.lime+'22';g.fillRect(plateX-4,mid-aperture,8,aperture*2);dot(g,objectX,mid,5,C.lime);g.strokeStyle=C.purple;g.setLineDash([3,4]);line(g,310,47,310,62,C.purple);g.setLineDash([]);
g.fillStyle='#24303c';g.fillRect(405,mid-57,16,114);g.fillStyle=`rgba(212,239,138,${.04+.85*pass})`;g.fillRect(409,mid-50,6,100);
txt(g,'Emitter',Math.max(10,objectX-19),246,C.ink);txt(g,'Collection lens',126,246);txt(g,'Pinhole',286,246,C.ink);txt(g,'Sensor',390,246);txt(g,Math.abs(dz)<.03?'At focus':`z = ${dz.toFixed(2)}`,20,30,C.lime);txt(g,pass>.8?'Most light passes':pass>.4?'More background passes':'Most light is blocked',174,287,pass>.8?C.lime:'#ec9b83');
// Local footprint inset at the physical pinhole plane (size exaggerated for clarity).
const ix=333,iy=34;const glow=g.createRadialGradient(ix,iy,0,ix,iy,Math.max(3,sigma));glow.addColorStop(0,'#d4ef8a99');glow.addColorStop(1,'#d4ef8a00');dot(g,ix,iy,Math.max(3,sigma),glow);g.beginPath();g.arc(ix,iy,aperture,0,TAU);g.strokeStyle=C.ink;g.stroke();txt(g,'Spot / opening',353,38,C.muted,11);
}
$('defocus-out').textContent=`${defocus.toFixed(2)} · relative z`;$('aperture-out').textContent=`${aperture} · model units`;$('defocused-title').textContent=Math.abs(defocus)<.03?'ALSO IN FOCUS':'AWAY FROM FOCUS';$('confocal-status').textContent=aperture>12?'A wider pinhole passes more light, including more defocused background.':Math.abs(defocus)<.03?'Both emitters are in focus: light is compact at the same pinhole plane.':'Same opening. Defocused light spreads over a larger area, so more of it is blocked.';
}
function drawSections(){const N=128,wide=new Float32Array(N*N),section=new Float32Array(N*N);
function splat(arr,x,y,sigma,weight){const radius=Math.ceil(sigma*2.6);for(let j=Math.max(0,Math.floor(y-radius));j<Math.min(N,y+radius);j++)for(let i=Math.max(0,Math.floor(x-radius));i<Math.min(N,x+radius);i++){const d=(i-x)**2+(j-y)**2;arr[j*N+i]+=weight*Math.exp(-d/(2*sigma*sigma))/(sigma*sigma);}}
for(const f of fluor){const dz=f.z-state.z,x=(f.x+1)*N/2,y=(f.y/.8+1)*N/2;splat(wide,x,y,1.15+Math.abs(dz)*4,.43);splat(section,x,y,1.15,.43*Math.exp(-.5*(dz/.17)**2));}
function image(id,arr){const c=document.createElement('canvas');c.width=c.height=N;const k=c.getContext('2d'),im=k.createImageData(N,N);for(let i=0;i<N*N;i++){const t=1-Math.exp(-arr[i]*1.2);im.data[4*i]=16+196*t;im.data[4*i+1]=20+219*t;im.data[4*i+2]=29+109*t;im.data[4*i+3]=255;}k.putImageData(im,0,0);const g=$(id).getContext('2d');clear(g);g.drawImage(c,10,10,300,300);}
image('widefield',wide);image('section-image',section);
const g=$('stack').getContext('2d');clear(g);const p=(x,y,z)=>({x:160+x*87+y*26,y:167+y*30-x*11-z*90});
for(let i=0;i<9;i++){const z=-.9+i*.225,pts=[p(-1,-.8,z),p(1,-.8,z),p(1,.8,z),p(-1,.8,z)];poly(g,pts,'#b5a1ff06','#b5a1ff28');for(let j=0;j<fluor.length;j+=4){const f=fluor[j];if(Math.abs(f.z-z)<.08){const q=p(f.x,f.y,z);dot(g,q.x,q.y,1.2,C.lime+'55');}}}
poly(g,[p(-1,-.8,state.z),p(1,-.8,state.z),p(1,.8,state.z),p(-1,.8,state.z)],'#b5a1ff20',C.purple);for(const f of fluor){if(Math.abs(f.z-state.z)<.15){const q=p(f.x,f.y,state.z);dot(g,q.x,q.y,1.5,C.lime);}}
arrow(g,28,253,28,65,C.muted);txt(g,'z',20,53);txt(g,'9 illustrative sections',76,302);$('stack-depth').textContent=`z = ${state.z.toFixed(2)}`;
}
function drawRace(){const step=Math.min(96,Math.floor(raceTime*10));
for(const [id,mult,out]of [['single-scan',1,'single-count'],['multi-scan',8,'multi-count']]){const g=$(id).getContext('2d');clear(g);const count=Math.min(96,step*mult);for(let j=0;j<8;j++)for(let i=0;i<12;i++){const index=j*12+i,x=37+i*35,y=29+j*28;dot(g,x,y,8,index<count?'#d4ef8a80':'#333c4c66');if(raceRunning&&index>=count&&index<count+mult)dot(g,x,y,5,C.cyan);}txt(g,count===96?'Field covered':`${count} positions visited`,25,265,count===96?C.lime:C.muted);$(out).textContent=`${count} / 96 positions`;}}
$('defocus').oninput=e=>{defocus=+e.target.value;drawConfocal();};$('aperture').oninput=e=>{aperture=+e.target.value;drawConfocal();};
$('race-play').onclick=()=>{if(raceRunning){raceRunning=false;$('race-play').textContent='Resume comparison';}else{if(raceTime>=9.6)raceTime=0;raceRunning=true;$('race-play').textContent='Pause comparison';$('race-status').textContent='Equal dwell per point · illustrative 8-spot comparison';start();}drawRace();};

document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;last=0;if(!document.hidden)start();});
rebuild();accumulate(active());ui();draw();drawConfocal();drawSections();drawRace();start();
})();
