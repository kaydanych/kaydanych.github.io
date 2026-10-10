(() => {
'use strict';
const canvas=document.getElementById('view'),g=canvas.getContext('2d');
const specimen=document.createElement('canvas');specimen.width=480;specimen.height=480;const s=specimen.getContext('2d');
const status=document.getElementById('status'),finish=document.getElementById('finish');
const scoreNode=document.getElementById('score'),timer=document.getElementById('timer'),start=document.getElementById('restart');
const DURATION=10,MOTION_SPEED=1/3,FOCUS_SPEED=48,keys=new Set();
let width,height,focus=50,elapsed=0,qualityIntegral=0,last=0,mode='idle';
const rand=(a,b)=>a+Math.random()*(b-a);
// Generate a fresh depth route once per round, never randomize per frame.
// Previous envelope was ±(17 + 7); expand it by 30% around the same midpoint.
const Z_AMPLITUDE=24*1.3,Z_SPEED=1.5;
let depthRoute=[];
function newDepthRoute(){
 depthRoute=[];let time=0,z=50;
 while(time<DURATION){
   const pause=rand(.35,1.15)/Z_SPEED;
   depthRoute.push({start:time,end:time+pause,from:z,to:z});time+=pause;
   let next;
   do{next=rand(50-Z_AMPLITUDE,50+Z_AMPLITUDE);}while(Math.abs(next-z)<12);
   // Smooth acceleration with a peak speed below the player's focus speed.
   const travel=Math.max(.85,Math.abs(next-z)*1.5/rand(15,22))/Z_SPEED;
   depthRoute.push({start:time,end:time+travel,from:z,to:next});time+=travel;z=next;
 }
}
function depth(t){
 const segment=depthRoute.find(part=>t<=part.end);
 if(!segment)return depthRoute.length?depthRoute[depthRoute.length-1].to:50;
 const u=Math.max(0,Math.min(1,(t-segment.start)/(segment.end-segment.start)));
 return segment.from+(segment.to-segment.from)*u*u*(3-2*u);
}
function resize(){width=innerWidth;height=innerHeight;canvas.width=width*devicePixelRatio;canvas.height=height*devicePixelRatio;g.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);}
const granules=Array.from({length:65},()=>({x:rand(-65,138),y:rand(-35,35),r:rand(.8,2)}));
// Shared moving contour for the membrane and the defocus fringes.
function membrane(ctx,t,inset=0){
 const r=52-inset,points=[];
 for(let i=0;i<=48;i++)points.push([-48+176*i/48,-r]);
 for(let i=1;i<=48;i++){const a=-Math.PI/2+Math.PI*i/48;points.push([128+r*Math.cos(a),r*Math.sin(a)]);}
 for(let i=1;i<=48;i++)points.push([128-176*i/48,r]);
 for(let i=1;i<=48;i++){const a=Math.PI/2+Math.PI*i/48;points.push([-48+r*Math.cos(a),r*Math.sin(a)]);}
 ctx.beginPath();points.forEach(([x,y],i)=>{
   const bend=7*Math.sin(x*.024-t*2.1),ripple=2.3*Math.sin(x*.075-t*3+y*.025);
   const yy=y+bend+ripple*(y/52),xx=x+1.7*Math.sin(y*.05+t*1.7);
   if(i===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);
 });ctx.closePath();
}
function makeSpecimen(t){
 s.clearRect(0,0,480,480);s.save();s.translate(240,240);
 // A single flexible flagellum trails the rod-shaped bacterium.
 s.lineCap='round';
 for(const [lineWidth,color] of [[5,'#19362f'],[1.7,'#91baa4']]){
   s.lineWidth=lineWidth;s.strokeStyle=color;s.beginPath();
   for(let i=0;i<=140;i++){
     const u=i/140,x=-99-u*135,y=7*Math.sin(-100*.024-t*2.1)+Math.sin(u*15-t*8)*Math.sin(u*Math.PI*.8)*(14+2*Math.sin(t*1.3));
     if(i===0)s.moveTo(x,y);else s.lineTo(x,y);
   }
   s.stroke();
 }
 // Capsule envelope and fine interior detail, legible when in focus.
 membrane(s,t);
 const glow=s.createLinearGradient(0,-52,0,52);glow.addColorStop(0,'#213f35');glow.addColorStop(.45,'#304f40');glow.addColorStop(1,'#122a24');
 s.fillStyle=glow;s.fill();s.strokeStyle='#a7cdb5';s.lineWidth=1.8;s.stroke();
 membrane(s,t,5);s.strokeStyle='#507c66';s.lineWidth=1;s.stroke();
 s.save();membrane(s,t,6);s.clip();
 // A slowly turning, deforming nucleoid coil; schematic, not a molecular simulation.
 s.save();s.translate(35,0);s.rotate(Math.sin(t*.7)*.075);s.translate(-35,0);
 s.strokeStyle='#c0ce98';s.lineWidth=1.5;s.beginPath();
 for(let i=0;i<=180;i++){const u=i/180,x=-48+u*173,y=Math.sin(u*24-t*1.8)*13+Math.sin(u*9+t*.6)*4;if(i===0)s.moveTo(x,y);else s.lineTo(x,y);}s.stroke();
 s.strokeStyle='#718d66';s.beginPath();
 for(let i=0;i<=180;i++){const u=i/180,x=125-u*173,y=Math.sin(u*24+1.8+t*1.8)*11;if(i===0)s.moveTo(x,y);else s.lineTo(x,y);}s.stroke();
 s.restore();
 granules.forEach((p,i)=>{s.fillStyle=i%4?'#8daa7e':'#d0deab';s.beginPath();s.arc(p.x+Math.sin(t*.9+i*2.4)*3,p.y+Math.cos(t*1.1+i*1.7)*2,p.r,0,Math.PI*2);s.fill();});
 s.strokeStyle='#709782';s.lineWidth=1;
 for(let i=0;i<15;i++){const x=-40+i*12;s.beginPath();const wave=Math.sin(t*2+i*.35)*1.3;s.moveTo(x,-47+wave);s.lineTo(x+2,-43+wave);s.moveTo(x,47-wave);s.lineTo(x-2,43-wave);s.stroke();}
 s.restore();s.restore();
}
// A curved XY path; orientation follows the leading edge's direction of travel.
const position=t=>({x:.40*Math.sin(t*.65),y:.33*Math.sin(t*.95+.4)});
function setFocus(v){focus=Math.max(0,Math.min(100,v));}
function say(text){if(status.textContent!==text)status.textContent=text;}
const scoreForm=document.getElementById('score-form'),nameInput=document.getElementById('player-name'),saveButton=document.getElementById('save-score'),saveStatus=document.getElementById('save-status');
const BOARD_KEY='focus-finder-leaderboard-v2';
// Smooth Gaussian quality: 100% at zero error, 77.9% at 3.5, 36.8% at 7.
const focusQuality=error=>Math.exp(-Math.pow(error/7,2));
const roundScore=()=>Math.max(0,Math.min(100,qualityIntegral/DURATION*100));
let submitted=false,currentEntry=null,memoryBoard=[],storageFailed=false;
function loadBoard(){
 if(storageFailed)return memoryBoard;
 try{
   const data=JSON.parse(localStorage.getItem(BOARD_KEY)||'[]');
   if(Array.isArray(data))memoryBoard=data.filter(e=>e&&typeof e.name==='string'&&e.name.trim()&&e.name.length<=24&&Number.isFinite(e.score)&&e.score>=0&&e.score<=100&&typeof e.id==='string').sort((a,b)=>b.score-a.score).slice(0,10);
 }catch(_){}return memoryBoard;
}
function renderLegacy(){
 const list=document.getElementById('legacy-board');list.replaceChildren();
 let entries=[];try{const data=JSON.parse(localStorage.getItem('focus-finder-leaderboard-v1')||'[]');if(Array.isArray(data))entries=data.filter(e=>e&&typeof e.name==='string'&&Number.isFinite(e.seconds)&&e.seconds>=0&&e.seconds<=15).sort((a,b)=>b.seconds-a.seconds).slice(0,10);}catch(_){}
 document.getElementById('legacy').hidden=entries.length===0;
 entries.forEach((entry,i)=>{const row=document.createElement('li');for(const [text,style] of [[String(i+1),'rank'],[entry.name.slice(0,24),'name'],[`${Math.round(entry.seconds/15*100)}% · ${entry.seconds.toFixed(1)}s`,'points']]){const span=document.createElement('span');span.className=style;span.textContent=text;row.appendChild(span);}list.appendChild(row);});
}
function renderBoard(){
 renderLegacy();
 const entries=loadBoard(),list=document.getElementById('board');list.replaceChildren();document.getElementById('board-empty').hidden=entries.length>0;
 entries.forEach((entry,i)=>{const row=document.createElement('li');if(entry.id===currentEntry)row.className='current';
   for(const [text,style] of [[String(i+1),'rank'],[entry.name,'name'],[`${entry.score.toFixed(1)}%`,'points']]){const span=document.createElement('span');span.className=style;span.textContent=text;row.appendChild(span);}list.appendChild(row);
 });
}
nameInput.addEventListener('input',()=>{saveButton.disabled=submitted||!nameInput.value.trim();});
scoreForm.addEventListener('submit',e=>{
 e.preventDefault();const name=nameInput.value.trim().slice(0,24);if(mode!=='done'||submitted||!name)return;
 const entry={id:Date.now().toString(36)+Math.random().toString(36).slice(2),name,score:roundScore()};
 const entries=[...loadBoard(),entry].sort((a,b)=>b.score-a.score).slice(0,10);
 let persisted=true;try{localStorage.setItem(BOARD_KEY,JSON.stringify(entries));}catch(_){persisted=false;storageFailed=true;}
 memoryBoard=entries;submitted=true;currentEntry=entry.id;nameInput.disabled=true;saveButton.disabled=true;saveButton.textContent='SAVED ✓';
 saveStatus.textContent=!persisted?'Browser storage unavailable — kept for this session.':entries.some(item=>item.id===entry.id)?'Added to this browser’s leaderboard.':'Nice run! Only the top 10 scores are kept.';
 renderBoard();
});
function begin(){submitted=false;currentEntry=null;nameInput.disabled=false;nameInput.value="";saveButton.disabled=true;saveButton.textContent="SAVE SCORE";saveStatus.textContent="";newDepthRoute();finish.hidden=true;elapsed=0;qualityIntegral=0;setFocus(50);mode='playing';keys.clear();last=performance.now();start.textContent='RESTART ↻';say('KEEP THE CELL SHARP');start.focus({preventScroll:true});}
addEventListener('keydown',e=>{if(mode!=='playing')return;if(!['ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();keys.add(e.key);});
addEventListener('keyup',e=>keys.delete(e.key));addEventListener('blur',()=>keys.clear());
document.addEventListener('visibilitychange',()=>{keys.clear();last=performance.now();});
start.onclick=begin;document.getElementById('replay').onclick=begin;
function frame(now){
 const dt=document.hidden?0:Math.max(0,(now-last)/1000||0);last=now;
 const direction=Number(keys.has('ArrowUp'))-Number(keys.has('ArrowDown'));
 if(mode==='playing'){
   const duration=Math.min(dt,DURATION-elapsed),steps=Math.max(1,Math.ceil(duration*120)),step=duration/steps;
   for(let i=0;i<steps;i++){if(direction)setFocus(focus+direction*FOCUS_SPEED*step);qualityIntegral+=focusQuality(focus-depth(elapsed+step/2))*step;elapsed+=step;}
   if(elapsed>=DURATION-1e-8){
     elapsed=DURATION;mode='done';keys.clear();start.textContent='TRY AGAIN ↻';
     const percent=roundScore();
     document.getElementById('finish-title').textContent=percent>=80?'Beautifully focused!':percent>=50?'Nice tracking!':'Keep chasing the sharpness.';
     document.getElementById('result-score').textContent=`${percent.toFixed(1)}%`;
     document.getElementById('result-time').textContent=`Average sharpness over ${DURATION} seconds · 100% is perfect focus`;
     renderBoard();finish.hidden=false;say('ROUND COMPLETE');document.getElementById('replay').focus({preventScroll:true});
   }
 }
 scoreNode.textContent=`${(elapsed?qualityIntegral/elapsed*100:0).toFixed(1)}% QUALITY`;timer.textContent=`${Math.max(0,DURATION-elapsed).toFixed(1)}s`;
 const signedDefocus=depth(elapsed)-focus,error=Math.abs(signedDefocus);
 g.fillStyle='#000';g.fillRect(0,0,width,height);
 const radius=Math.max(55,Math.min((width-120)*.5,(height-235)*.46,255)),cx=width/2-23,cy=(height-90)/2;
 g.save();g.beginPath();g.arc(cx,cy,radius,0,Math.PI*2);g.clip();g.fillStyle='#050906';g.fillRect(cx-radius,cy-radius,radius*2,radius*2);
 g.filter=`blur(${Math.min(22,error*.65)}px)`;g.globalAlpha=.98-Math.min(.3,error*.004);
 const zoom=1+(depth(elapsed)-50)*.0015;
 const motionTime=elapsed*MOTION_SPEED;
 const pos=position(motionTime),angle=Math.atan2(.33*.95*Math.cos(motionTime*.95+.4),.40*.65*Math.cos(motionTime*.65));
 makeSpecimen(elapsed);
 const size=radius*1.326*zoom;
 g.translate(cx+pos.x*radius,cy+pos.y*radius);g.rotate(angle);
 g.drawImage(specimen,-size/2,-size/2,size,size);
 // Stylized signed-defocus cue: light/dark fringe order flips across focus.
 // This is an optical-inspired game effect, not a quantitative phase model.
 const fringe=Math.min(1,error/11);
 if(fringe>.015){
   g.scale(size/480,size/480);g.globalAlpha=fringe*.65;
   g.filter=`blur(${1+Math.min(2.2,error*.07)}px)`;
   const spread=2+Math.min(9,error*.35),outside=signedDefocus>0;
   membrane(g,elapsed,-spread);g.lineWidth=2.5+fringe*2;g.strokeStyle=outside?'#c8dfbb':'#000b08';g.stroke();
   membrane(g,elapsed,spread*.55);g.lineWidth=2+fringe*1.5;g.strokeStyle=outside?'#020c08':'#c8dfbb';g.stroke();
 }
 g.restore();
 drawDepthBar(cx+radius+34,cy,Math.min(230,radius*1.45));
 g.strokeStyle='#202921';g.lineWidth=1;g.beginPath();g.arc(cx,cy,radius+3,0,Math.PI*2);g.stroke();
 if(elapsed>0){g.strokeStyle='#9bb98a';g.lineWidth=2;g.beginPath();g.arc(cx,cy,radius+7,-Math.PI/2,-Math.PI/2+Math.PI*2*elapsed/DURATION);g.stroke();}
 requestAnimationFrame(frame);
}
function drawDepthBar(x,y,length){
 const top=y-length/2,bottom=y+length/2,at=v=>bottom-v/100*length;
 g.font='9px monospace';g.textAlign='center';g.fillStyle='#8a958c';g.fillText('Z',x,top-24);
 g.strokeStyle='#344039';g.lineWidth=1;g.beginPath();g.moveTo(x,top);g.lineTo(x,bottom);g.stroke();
 for(let i=0;i<=10;i++){const yy=at(i*10);g.beginPath();g.moveTo(x-3,yy);g.lineTo(x+(i%5?3:6),yy);g.stroke();}
 g.fillStyle='#59645c';g.font='8px monospace';g.fillText('100',x,top-10);g.fillText('0',x,bottom+14);
 const f=at(focus);
 g.strokeStyle='#c6dbec';g.beginPath();g.moveTo(x+2,f);g.lineTo(x+12,f);g.stroke();
 g.fillStyle='#c6dbec';g.beginPath();g.moveTo(x+6,f);g.lineTo(x+12,f-4);g.lineTo(x+12,f+4);g.closePath();g.fill();
 g.font='8px monospace';g.fillStyle='#c6dbec';g.fillText('FOCUS',x,bottom+35);
}
addEventListener('resize',resize);resize();requestAnimationFrame(frame);
})();
