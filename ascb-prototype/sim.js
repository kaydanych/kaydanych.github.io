(() => {
 'use strict';
 const $=id=>document.getElementById(id),n=CellReference.n,reference=Float64Array.from(atob(CellReference.sim),c=>c.charCodeAt(0)/255);
 const model=SIMModel.create(reference,n),results=[0,1,2,3].map(s=>model.reconstruct(s));
 const state={frame:0,playing:false,timer:null,stage:3,split:50};
 const col=['#d4ef8a','#70c9e9','#b5a1ff'],TAU=Math.PI*2;
 function image(values,scale=1){const c=document.createElement('canvas');c.width=c.height=n;const ctx=c.getContext('2d'),pixels=ctx.createImageData(n,n);for(let i=0;i<values.length;i++){const v=Math.max(0,Math.min(255,values[i]*255*scale));pixels.data[4*i]=pixels.data[4*i+1]=pixels.data[4*i+2]=v;pixels.data[4*i+3]=255}ctx.putImageData(pixels,0,0);return c}
 function paint(id,img){const c=$(id),ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(img,0,0,c.width,c.height)}
 const sourceImage=image(reference),widefieldImage=image(model.widefield),recoveredImages=results.map(r=>image(r.values));
 const illuminationImages=model.frames.map(f=>image(f.illuminated,.6)),cameraImages=model.frames.map(f=>image(f.values,.6)),patternImages=model.frames.map(f=>image(f.pattern,.5));
 for(let i=0;i<9;i++){const button=document.createElement('button');button.className='frame-tile';button.setAttribute('aria-label',`Exposure ${i+1}: orientation ${Math.floor(i/3)*60} degrees, phase ${(i%3)*120} degrees`);button.setAttribute('aria-pressed','false');const canvas=document.createElement('canvas');canvas.width=canvas.height=128;canvas.setAttribute('aria-hidden','true');canvas.getContext('2d').drawImage(cameraImages[i],0,0,128,128);const label=document.createElement('span');label.textContent=String(i+1).padStart(2,'0');button.append(canvas,label);button.onclick=()=>{pause();showFrame(i)};$('frames').append(button)}
 function showFrame(i){state.frame=(i+9)%9;const f=model.frames[state.frame];paint('illuminated',illuminationImages[state.frame]);paint('pattern',patternImages[state.frame]);$('pattern-label').textContent=`${f.angle*60}° · phase ${f.phaseIndex*120}°`;$('sequence-info').textContent=$('pattern-label').textContent;$('frame').value=state.frame;$('frame-value').textContent=String(state.frame+1).padStart(2,'0')+' / 09';[...$('frames').children].forEach((b,j)=>b.setAttribute('aria-pressed',String(j===state.frame)))}
 function pause(){clearTimeout(state.timer);state.timer=null;state.playing=false;$('play').textContent='▶ Play sequence';$('play').setAttribute('aria-pressed','false')}
 function schedule(){state.timer=setTimeout(()=>{if(!state.playing)return;showFrame(state.frame+1);schedule()},+$('speed').value)}
 function play(){if(state.playing){pause();return}state.playing=true;$('play').textContent='Ⅱ Pause sequence';$('play').setAttribute('aria-pressed','true');schedule()}
 $('play').onclick=play;$('next').onclick=()=>{pause();showFrame(state.frame+1)};$('reset').onclick=()=>{pause();showFrame(0)};$('frame').oninput=e=>{pause();showFrame(+e.target.value)};$('speed').onchange=()=>{if(state.playing){clearTimeout(state.timer);schedule()}};
 function compare(){const canvas=$('comparison'),c=canvas.getContext('2d'),x=canvas.width*state.split/100;c.drawImage(recoveredImages[3],0,0,canvas.width,canvas.height);c.save();c.beginPath();c.rect(0,0,x,canvas.height);c.clip();c.drawImage(widefieldImage,0,0,canvas.width,canvas.height);c.restore();c.strokeStyle='#d4ef8a';c.lineWidth=2;c.beginPath();c.moveTo(x,0);c.lineTo(x,canvas.height);c.stroke();$('split-handle').style.left=state.split+'%'}
 $('compare').oninput=e=>{state.split=+e.target.value;compare()};
 // Use the same log scaling for every frequency view; exclude DC when setting its range.
 let spectralMax=0;for(let i=1;i<n*n;i++)spectralMax=Math.max(spectralMax,Math.log1p(Math.hypot(model.refRe[i],model.refIm[i])));
 function spectrum(id,re,im,view=120){const canvas=$(id),c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,p=c.createImageData(w,h),scale=w/view;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const fx=Math.round((x-w/2)/scale),fy=Math.round((y-h/2)/scale),idx=((fy+n)%n)*n+(fx+n)%n,v=Math.min(255,Math.log1p(Math.hypot(re[idx],im[idx]))/spectralMax*255),i=(y*w+x)*4;p.data[i]=v*.87;p.data[i+1]=v*.92;p.data[i+2]=v;p.data[i+3]=255}c.putImageData(p,0,0);c.font='11px monospace';c.fillStyle='#a3adbf';c.fillText('fₓ →',w-46,h/2+15);c.fillText('fᵧ ↓',w/2+8,h-12);return {c,w,h,scale}}
 function ring(c,x,y,r,color,dash=false){c.strokeStyle=color;c.lineWidth=1.6;c.setLineDash(dash?[3,5]:[]);c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();c.setLineDash([])}
 function renderReconstruction(stage){state.stage=stage;const result=results[stage],band=stage?model.bands[stage-1]:null;
  let a=spectrum('camera-spectrum',band?band.plusRe:result.re,band?band.plusIm:result.im);ring(a.c,a.w/2,a.h/2,24*a.scale,'#edf0f7');
  let b=spectrum('combined-spectrum',result.re,result.im);ring(b.c,b.w/2,b.h/2,48*b.scale,'#596579',true);ring(b.c,b.w/2,b.h/2,24*b.scale,'#edf0f7');
  for(let j=0;j<stage;j++)for(let sign of [-1,1])ring(b.c,b.w/2+sign*model.shifts[j][0]*b.scale,b.h/2+sign*model.shifts[j][1]*b.scale,24*b.scale,col[j]);
  paint('recovered',recoveredImages[stage]);document.querySelectorAll('[data-stage]').forEach(btn=>btn.setAttribute('aria-pressed',String(+btn.dataset.stage===stage)));
  $('coverage-status').textContent=stage?`${stage*3} exposures · ${stage*2} shifted regions`:'Uniform illumination · central band';
  $('band-caption').textContent=stage?`${(stage-1)*60}° orientation · one demodulated sideband inside the fixed camera support.`:'Uniform illumination · only the central frequency band.';
  $('recovered-caption').textContent=stage?`Reconstructed from ${stage*3} synthetic frames.`:'Simulated widefield image · same detection model.';
  $('reconstruction-note').textContent=['Only the central band reaches the camera under uniform illumination. Fine filament structure blends together.','One orientation adds a pair of regions. The pattern encodes detail along one direction.','A second orientation adds another pair of regions, recovering detail in more directions.','Three orientations reveal detail in more directions, while the microscope’s detection limit stays unchanged.'][stage];
 }
 document.querySelectorAll('[data-stage]').forEach(btn=>btn.onclick=()=>{pause();renderReconstruction(+btn.dataset.stage)});
 let fullReference=false;
 function filter(){const cutoff=+$('cutoff').value;paint('filter-image',fullReference?sourceImage:image(FourierMath.filter(model.refRe,model.refIm,n,cutoff)));const {c,w,h,scale}=spectrum('filter-spectrum',model.refRe,model.refIm,256);if(!fullReference){c.fillStyle='#10141dc4';c.beginPath();c.rect(0,0,w,h);c.arc(w/2,h/2,cutoff*scale,0,TAU,true);c.fill('evenodd');ring(c,w/2,h/2,cutoff*scale,col[0])}$('cutoff-value').textContent=fullReference?'All':`${cutoff} cycles / crop`}
 $('cutoff').oninput=()=>{fullReference=false;filter()};$('restore').onclick=()=>{fullReference=true;filter()};
 const optics={angle:0,phase:0,minus:true,plus:true};
 function renderOptics(){
  const a=optics.angle*Math.PI/180,p=optics.phase*Math.PI/180;
  for(let type of ['slm','interference']){const canvas=$(type),c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,im=c.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const u=((x-w/2)*Math.cos(a)+(y-h/2)*Math.sin(a))/w;let rgb;if(type==='slm'){rgb=Math.cos(TAU*4.9*u+p/2)>=0?[212,239,138]:[181,161,255];if(x%6===0||y%6===0)rgb=rgb.map(v=>v*.55)}else{const v=optics.minus&&optics.plus?(1+Math.cos(2*TAU*4.9*u+p))/2:optics.minus||optics.plus?.25:0;rgb=[14+v*198,21+v*218,25+v*113]}const i=(y*w+x)*4;im.data[i]=rgb[0];im.data[i+1]=rgb[1];im.data[i+2]=rgb[2];im.data[i+3]=255}c.putImageData(im,0,0)}
  const c=$('pupil').getContext('2d');c.fillStyle='#10141d';c.fillRect(0,0,360,300);ring(c,180,150,115,'#394255');c.font='11px monospace';c.textAlign='center';
  for(let sign of [-1,1]){const on=sign===-1?optics.minus:optics.plus,x=180+sign*72*Math.cos(a),y=150+sign*72*Math.sin(a);c.fillStyle=on?col[0]:'#465165';c.shadowColor=col[0];c.shadowBlur=on?16:0;c.beginPath();c.arc(x,y,9,0,TAU);c.fill();c.shadowBlur=0;c.fillStyle=on?col[0]:'#8995a8';c.fillText(sign===-1?'−1':'+1',x,y-21)}
  c.fillStyle='#8995a8';c.fillText('0 absent',180,171);c.fillText('SELECTED DIFFRACTION ORDERS',180,284);
  for(let key of ['minus','plus']){$(key).setAttribute('aria-pressed',String(optics[key]));$(key).textContent=(key==='minus'?'−1':'+1')+' beam · '+(optics[key]?'on':'off')}
  $('beam-note').textContent=optics.minus&&optics.plus?'Two beams → stripes.':optics.minus||optics.plus?'One plane wave → uniform illumination.':'No beams → no illumination.';
  $('optic-angle').value=optics.angle;$('optic-phase').value=optics.phase;$('optic-angle-value').textContent=optics.angle+'°';$('optic-phase-value').textContent=optics.phase+'°';
 }
 for(let k of ['angle','phase'])$('optic-'+k).oninput=e=>{optics[k]=+e.target.value;renderOptics()};for(let k of ['minus','plus'])$(k).onclick=()=>{optics[k]=!optics[k];renderOptics()};$('optics-reset').onclick=()=>{Object.assign(optics,{angle:0,phase:0,minus:true,plus:true});renderOptics()};
 function revealHash(){const el=document.querySelector(location.hash==='#optics'?'#optics':location.hash==='#fourier'?'#fourier':location.hash==='#provenance'?'#provenance':'.no-match');if(el){el.open=true;requestAnimationFrame(()=>el.scrollIntoView())}}
 document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{pause();const el=document.querySelector(a.getAttribute('href'));if(el?.tagName==='DETAILS')el.open=true}));
 document.querySelectorAll('details').forEach(d=>d.addEventListener('toggle',()=>{const label=d.querySelector('.expand-label');if(label)label.textContent=d.open?'Close −':'Explore +';if(d.open)pause()}));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});window.addEventListener('pagehide',pause);window.addEventListener('hashchange',revealHash);
 const observer=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)pause()},{threshold:.05});observer.observe($('acquisition'));
 showFrame(0);compare();renderReconstruction(3);filter();renderOptics();revealHash();
 // User explicitly requested a fast visual sequence. Respect reduced-motion and hidden tabs.
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&!document.hidden&&!['#optics','#fourier','#provenance','#reconstruction'].includes(location.hash))play();
})();
