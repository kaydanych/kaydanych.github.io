(function(root){
'use strict';
const clamp=x=>Math.max(0,Math.min(1,x));
function sample(t,mode){
 const sleep=mode==='sleep',slow=sleep?clamp((t-6)/8):0;
 const theta=sleep?Math.sin(Math.PI*slow):0;
 const wave=(f,p=0)=>Math.sin(2*Math.PI*f*t+p);
 return (1-slow)*(.18*wave(20)+.24*wave(10,.7))+.32*theta*wave(6,.2)+slow*(.8*wave(.8)+.18*wave(2,.5));
}
function state(t,mode){if(mode!=='sleep')return{title:'Wake-like reference',text:'This reference stays wake-like. The other controls change spike activity, not this separately generated EEG illustration. Choose the wake-to-sleep pattern to see the transition.'};if(t<6)return{title:'Awake-like',text:'Irregular population firing accompanies a faster, mixed-frequency illustrative trace. Relaxed eyes-closed wakefulness often has prominent alpha activity.'};if(t<14)return{title:'Drifting toward sleep',text:'The teaching model blends in theta and slower activity as the spike population develops shared quiet periods. These are illustrative changes, not scored sleep stages.'};return{title:'Slow-wave-like',text:'Slow waves now dominate the illustration. Above, shared active periods alternate with relative silence. Real deep non-REM sleep is more varied than these regular cycles.'};}
let lastMode=null;
function update(t,mode){const signal=document.getElementById('eegSignal');if(!signal)return;if(lastMode!==mode){let path='';for(let i=0;i<=2400;i++){const at=i/100,x=20+at/24*920,y=76-sample(at,mode)*54;path+=(i?'L':'M')+x.toFixed(2)+' '+y.toFixed(2);}signal.setAttribute('d',path);lastMode=mode;}
 const x=20+clamp(t/24)*920;document.getElementById('eegCursor').setAttribute('d',`M${x} 12V145`);const info=state(t,mode);document.getElementById('eegState').textContent=info.title;document.getElementById('eegNarrative').textContent=info.text;
}
if(typeof module!=='undefined')module.exports={sample,state};else{
 root.updateEEG=update;
 document.querySelectorAll('svg[data-hz]').forEach(svg=>{const hz=Number(svg.dataset.hz),path=document.createElementNS('http://www.w3.org/2000/svg','path');let d='';for(let i=0;i<=480;i++)d+=(i?'L':'M')+(i/2)+' '+(30-18*Math.sin(2*Math.PI*hz*i/480)).toFixed(2);path.setAttribute('d',d);path.setAttribute('stroke','#b7a4ef');path.setAttribute('stroke-width','1.5');path.setAttribute('fill','none');svg.appendChild(path);});
}
})(globalThis);
