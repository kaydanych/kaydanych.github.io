'use strict';
const $=id=>document.getElementById(id), state={angle:0,phase:0,density:4.9,preset:2,minus:true,plus:true};
const frequencies=[.4,.55,.7,.85,1],sequence=Array.from({length:9},(_,i)=>({angle:Math.floor(i/3)*60,phase:i%3*120}));
let frameIndex=-1,timer=null,running=false,detailAngle=0;
const frequency=()=>frequencies[state.preset];
const TAU=2*Math.PI;
function intensity(u,f,phase,minus,plus){return minus&&plus?(1+Math.cos(2*TAU*f*u+phase))/2:(minus||plus?.25:0);}
function paint(canvas,kind,s=state){const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,im=c.createImageData(w,h),a=s.angle*Math.PI/180,p=s.phase*Math.PI/180;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const u=((x-w/2)*Math.cos(a)+(y-h/2)*Math.sin(a))/w;let rgb;
  if(kind==='slm'){const on=Math.cos(TAU*s.density*u+p/2)>=0;rgb=on?[212,239,138]:[181,161,255];if(x%6===0||y%6===0)rgb=rgb.map(v=>v*.55);}
  else {const v=intensity(u,s.density,p,s.minus,s.plus);rgb=[14+v*198,21+v*218,25+v*113];}
  const i=(y*w+x)*4;im.data[i]=rgb[0];im.data[i+1]=rgb[1];im.data[i+2]=rgb[2];im.data[i+3]=255;
 }c.putImageData(im,0,0);}
function spots(){const canvas=$('fourier'),c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,cx=w/2,cy=h/2,a=state.angle*Math.PI/180,r=state.density*14;
 c.fillStyle='#10141d';c.fillRect(0,0,w,h);c.strokeStyle='#394255';c.lineWidth=1;c.beginPath();c.arc(cx,cy,123,0,TAU);c.stroke();c.setLineDash([3,5]);c.beginPath();c.moveTo(30,cy);c.lineTo(w-30,cy);c.moveTo(cx,20);c.lineTo(cx,h-20);c.stroke();c.setLineDash([]);
 for(const order of [-3,-1,1,3]){const rr=Math.abs(order)===3?Math.min(140,r*3):r;const x=cx+Math.sign(order)*rr*Math.cos(a),y=cy+Math.sign(order)*rr*Math.sin(a),on=order===-1?state.minus:order===1?state.plus:false;
 c.fillStyle=on?'#d4ef8a':'#333c4c';c.shadowBlur=on?18:0;c.shadowColor='#d4ef8a';c.beginPath();c.arc(x,y,Math.abs(order)===1?10:4,0,TAU);c.fill();c.shadowBlur=0;c.fillStyle=on?'#d4ef8a':'#8793a5';c.font='11px monospace';c.textAlign='center';c.fillText((order>0?'+':'')+order+(Math.abs(order)===3?' blocked':''),x,y-18);if(!on){c.strokeStyle='#8793a5';c.beginPath();c.moveTo(x-7,y-7);c.lineTo(x+7,y+7);c.stroke();}}
 c.fillStyle='#8793a5';c.fillText('0 absent',cx,cy+20);c.fillRect(cx-1,cy-1,2,2);c.font='9px monospace';c.fillText('SCHEMATIC SPOTS · CLICK ±1 TO TOGGLE',cx,h-12);
}
function render(){paint($('slm'),'slm');paint($('sample'),'sample');spots();for(const name of ['angle','phase']){ $(name).value=state[name];$(name+'Out').textContent=state[name]+(name==='density'?' cycles':'°');}
 for(const key of ['minus','plus']){$(key).textContent=(key==='minus'?'−1':'+1')+' beam · '+(state[key]?'ON':'OFF');$(key).setAttribute('aria-pressed',state[key]);}
 const n=Number(state.minus)+Number(state.plus);$('contrast').textContent=n===2?'STRIPES / 100% CONTRAST':n===1?'NO STRIPES / 0% CONTRAST':'DARK / NO LIGHT';$('brightness').textContent='MEAN '+(n*50)+'%';$('sampleNote').innerHTML=n===2?'<b>Two directions. One striped pattern.</b><br>Where the fields add, light is bright. Where they cancel, it is dark.':n===1?'<b>One beam cannot interfere with itself here.</b><br>The ideal plane wave gives uniform illumination at half the two-beam mean.':'<b>No beams, no illumination.</b><br>Switch both first orders back on to recover the stripes.';
 $('grating').value=state.preset;$('gratingReadout').textContent='Illustrative illumination frequency: '+frequency().toFixed(2)+' k꜀';
 drawSpectra();drawBeat();highlight();
}
function pause(){running=false;clearTimeout(timer);timer=null;$('acquire').textContent='▶ Play acquisition';}
function manual(){pause();frameIndex=-1;highlight();$('sequenceStatus').textContent='Manual exploration · Play starts at angle 1, phase 1.';}
function showFrame(i){frameIndex=i;Object.assign(state,sequence[i],{minus:true,plus:true});render();highlight();$('sequenceStatus').textContent=`Frame ${i+1} / 9 · Angle ${Math.floor(i/3)+1}: ${state.angle}° · Phase ${i%3+1}: ${state.phase}°`;}
function advance(){if(frameIndex===8&&!$('loop').checked){pause();$('sequenceStatus').textContent='Sequence complete · 9 / 9 frames. Press Play to restart.';return;}showFrame((frameIndex+1)%9);if(running)timer=setTimeout(advance,400);}
function play(){if(running){pause();return;}running=true;$('acquire').textContent='Ⅱ Pause acquisition';if(frameIndex===8&&!$('loop').checked)frameIndex=-1;advance();}
function gallery(){highlight();}
function highlight(){paint($('acquisitionScreen'),'sample');$('projectionLabel').textContent=`${frameIndex<0?'Ready':'Exposure '+(frameIndex+1)+' / 9'} · ${state.angle}° · phase ${state.phase}°`;
 const root=$('sequenceDots');root.replaceChildren();sequence.forEach((s,i)=>{const dot=document.createElement('span');dot.className='sequence-dot'+(i===frameIndex?' current':'');dot.textContent=String(i+1);root.append(dot);});}
for(const name of ['angle','phase'])$(name).oninput=()=>{manual();state[name]=+$(name).value;render();};
$('grating').onchange=()=>{manual();state.preset=+$('grating').value;state.density=frequency()*7;render();gallery();};
for(const key of ['minus','plus'])$(key).onclick=()=>{manual();state[key]=!state[key];render();};
$('fourier').onclick=e=>{const rect=e.currentTarget.getBoundingClientRect(),x=(e.clientX-rect.left)*360/rect.width,y=(e.clientY-rect.top)*300/rect.height,a=state.angle*Math.PI/180,r=state.density*14;for(const [key,sign] of [['minus',-1],['plus',1]])if(Math.hypot(x-(180+sign*r*Math.cos(a)),y-(150+sign*r*Math.sin(a)))<24){manual();state[key]=!state[key];render();break;}};
$('acquire').onclick=play;$('nextFrame').onclick=()=>{pause();showFrame((frameIndex+1)%9);};$('rewind').onclick=()=>{pause();showFrame(0);};
$('reset').onclick=()=>{manual();detailAngle=0;Object.assign(state,{angle:0,phase:0,preset:2,density:4.9,minus:true,plus:true});$('objectFrequency').value=1.65;render();gallery();};
$('objectFrequency').oninput=()=>{drawSpectra();drawBeat();};
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('pagehide',pause);
function otf(v){v=Math.abs(v);return v>=1?0:2/Math.PI*(Math.acos(v)-v*Math.sqrt(1-v*v));}
function spectrumBase(id){const c=$(id).getContext('2d');c.clearRect(0,0,500,390);c.fillStyle='#10141d';c.fillRect(0,0,500,390);c.lineWidth=1;c.strokeStyle='#293343';c.beginPath();c.moveTo(35,190);c.lineTo(465,190);c.moveTo(250,20);c.lineTo(250,360);c.stroke();c.font='11px monospace';c.fillStyle='#a3adbf';c.textAlign='center';for(const n of [-2,-1,0,1,2])c.fillText(n+'',250+n*78,376);c.fillText('spatial frequency / k꜀',250,389);return c;}
function circle(c,x,y,r,color,fill,dash=[]){c.setLineDash(dash);c.strokeStyle=color;c.lineWidth=1.5;c.beginPath();c.arc(x,y,r,0,TAU);if(fill){c.fillStyle=fill;c.fill();}c.stroke();c.setLineDash([]);}
function dot(c,x,y,color){c.fillStyle=color;c.beginPath();c.arc(x,y,5,0,TAU);c.fill();}
function components(){const q=+$('objectFrequency').value,p=frequency(),a=state.angle*Math.PI/180,d=detailAngle*Math.PI/180;
 const qx=q*Math.cos(d),qy=q*Math.sin(d),sign=qx*Math.cos(a)+qy*Math.sin(a)>=0?1:-1,px=sign*p*Math.cos(a),py=sign*p*Math.sin(a);return{q,p,qx,qy,px,py,bx:qx-px,by:qy-py,mixed:Math.hypot(qx-px,qy-py),enabled:state.minus&&state.plus};}
function drawSpectra(){const {q,p,qx,qy,px,py,bx,by,mixed,enabled}=components(),inside=enabled&&mixed<1;
 $('objectOut').textContent=q.toFixed(2)+' k꜀';$('mixPreset').value=state.preset;$('mixAngle').value=state.angle;$('mixAngleOut').textContent=state.angle+'°';$('detailAngle').value=detailAngle;$('detailAngleOut').textContent=detailAngle+'°';
 $('frequencyReadout').textContent=`Difference vector: |q − p| = ${mixed.toFixed(2)} k꜀
${inside?'Inside the detection band':'Outside / no transmitted difference component'} · H = ${(enabled?otf(mixed)*100:0).toFixed(0)}%`;
 let c=spectrumBase('cameraSpectrum');circle(c,250,190,78,'#edf0f7','#edf0f70b');c.font='12px monospace';c.fillStyle='#edf0f7';c.fillText('FIXED DETECTION SUPPORT',250,24);
 const x=250+qx*78,y=190-qy*78,xx=250+bx*78,yy=190-by*78;
 dot(c,x,y,'#b5a1ff');dot(c,500-x,380-y,'#b5a1ff');
 if(enabled){c.strokeStyle=inside?'#d4ef8a':'#ec9b83';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();const ang=Math.atan2(yy-y,xx-x);c.beginPath();c.moveTo(xx,yy);c.lineTo(xx-10*Math.cos(ang-.4),yy-10*Math.sin(ang-.4));c.lineTo(xx-10*Math.cos(ang+.4),yy-10*Math.sin(ang+.4));c.closePath();c.fillStyle=c.strokeStyle;c.fill();dot(c,xx,yy,inside?'#d4ef8a':'#ec9b83');dot(c,500-xx,380-yy,inside?'#d4ef8a':'#ec9b83');}
 c.fillStyle='#b5a1ff';c.fillText(`detail q = ${q.toFixed(2)} · ${detailAngle}°`,250,330);c.fillStyle=inside?'#d4ef8a':'#ec9b83';c.fillText(enabled?`beat |q − p| = ${mixed.toFixed(2)} ${inside?'(inside)':'(outside)'}`:'no stripe modulation: no shifted copies',250,349);
 $('mixExplanation').textContent=!enabled?'With one or no beam, there is no stripe modulation to encode the fine detail.':inside?`The purple detail stays at its original frequency. Illumination creates an additional green component at |q − p| = ${mixed.toFixed(2)} k꜀. This component can pass through the unchanged detection band. The arrow shows a frequency offset, not motion of a structure in the cell.`:`The difference component is outside the detection band. Increase the grating frequency or align its direction with the detail. Even a fine illumination pattern will not help every detail orientation at once.`;
 c=spectrumBase('extendedSpectrum');circle(c,250,190,156,'#697587',null,[4,5]);
 if(enabled)for(const angle of [0,60,120])for(const sign of [-1,1]){const rad=angle*Math.PI/180;circle(c,250+sign*p*78*Math.cos(rad),190-sign*p*78*Math.sin(rad),78,'#70c9e977','#70c9e911');}
 circle(c,250,190,78,'#edf0f7','#edf0f70b');if(enabled)for(const sign of [-1,1])circle(c,250+sign*px*78,190-sign*py*78,78,'#d4ef8a',null);
 dot(c,x,y,'#b5a1ff');dot(c,500-x,380-y,'#b5a1ff');c.fillStyle='#a3adbf';c.font='11px monospace';c.fillText('RECOVERABLE SUPPORT · NOT A BIGGER PUPIL',250,24);c.fillStyle='#d4ef8a';c.fillText(enabled?`reach along illumination: ${(1+p).toFixed(2)} k꜀`:'widefield support only',250,345);
 $('extensionExplanation').textContent=enabled?`Once phase stepping separates the mixed contributions, the algorithm knows their offset p and repositions them. Green outlines: information accessible with the current ${state.angle}° illumination. Blue: the three planned acquisition angles. Purple: the detail at its correct location, now ${inside?'covered by':'outside'} the current pair of shifted supports.`:'Without stripe modulation there is no shifted specimen information to decode. The physical detection support is always the central white circle.';
}
function drawBeat(){const c=$('beat').getContext('2d'),w=1000,h=210,q=+$('objectFrequency').value,p=frequency(),difference=components().mixed,phase=state.phase*Math.PI/180,enabled=state.minus&&state.plus,amp=enabled?.5*otf(difference):0;c.fillStyle='#10141d';c.fillRect(0,0,w,h);c.font='13px monospace';c.fillStyle='#b5a1ff';c.fillText(`SPECIMEN DETAIL q = ${q.toFixed(2)} k꜀ (not directly transmitted)`,22,24);c.fillStyle='#d4ef8a';c.fillText(`DETECTED DIFFERENCE COMPONENT |q − p| = ${difference.toFixed(2)} k꜀`,22,125);
 for(const [y,f,a,color,ph] of [[66,q,1,'#b5a1ff',0],[167,difference,amp,'#d4ef8a',-phase]]){c.strokeStyle='#333c4c';c.beginPath();c.moveTo(22,y);c.lineTo(978,y);c.stroke();c.strokeStyle=color;c.lineWidth=2;c.beginPath();for(let x=22;x<=978;x++){const u=(x-22)/956*8;const yy=y-26*a*Math.cos(TAU*f*u+ph);if(x===22)c.moveTo(x,yy);else c.lineTo(x,yy);}c.stroke();}}
$('mixPreset').onchange=()=>{manual();state.preset=+$('mixPreset').value;state.density=frequency()*7;render();};
$('mixAngle').oninput=()=>{manual();state.angle=+$('mixAngle').value;render();};
$('detailAngle').oninput=()=>{detailAngle=+$('detailAngle').value;drawSpectra();drawBeat();};
function scenario(preset,angle){manual();state.preset=preset;state.density=frequency()*7;state.angle=angle;state.minus=state.plus=true;detailAngle=0;$('objectFrequency').value=1.65;render();}
$('mixMiss').onclick=()=>scenario(0,0);$('mixMatch').onclick=()=>scenario(4,0);$('mixRotate').onclick=()=>scenario(4,90);
function pickDetail(e){manual();const b=$('cameraSpectrum').getBoundingClientRect(),x=((e.clientX-b.left)/b.width*500-250)/78,y=(190-(e.clientY-b.top)/b.height*390)/78;let angle=Math.atan2(y,x)*180/Math.PI;if(angle<0)angle+=180;detailAngle=Math.round(angle);$('objectFrequency').value=Math.max(1.1,Math.min(2.1,Math.hypot(x,y))).toFixed(2);drawSpectra();drawBeat();}
$('cameraSpectrum').onpointerdown=e=>{e.currentTarget.setPointerCapture(e.pointerId);pickDetail(e);};$('cameraSpectrum').onpointermove=e=>{if(e.buttons===1)pickDetail(e);};
render();gallery();
