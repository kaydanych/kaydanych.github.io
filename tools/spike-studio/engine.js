(function(root){
'use strict';
const duration=24, units=48;
function rng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function generate({seed=42,rate=5,strength=.75,interval=4,mode='burst'}={}){
 const random=rng(seed), events=[];
 for(let unit=0;unit<units;unit++){
  const hz=rate*(.55+.9*random());
  for(let t=-Math.log(1-random())/hz;t<duration;t+=-Math.log(1-random())/hz){
   let keep=1;
   if(mode==='sleep'){const blend=Math.min(1,Math.max(0,(t-6)/8)),active=(t%1.25)<.42;keep=1-blend+blend*(active?1:.035);}
   if(random()<keep)events.push({time:t,unit});
  }
  if(mode==='burst')for(let center=interval;center<duration;center+=interval)if(random()<strength){for(let j=0,n=2+Math.floor(random()*3);j<n;j++){const t=center+(random()-.5)*.12;if(t>=0&&t<duration)events.push({time:t,unit});}}
  if(mode==='sleep')for(let t=6;t<duration;t+=.004){const blend=Math.min(1,(t-6)/8);if(t%1.25<.42&&random()<rate*2*blend*.004)events.push({time:t,unit});}
 }
 events.sort((a,b)=>a.time-b.time||a.unit-b.unit);
 const rows=Array.from({length:units},()=>[]);events.forEach(e=>rows[e.unit].push(e.time));
 const bin=.05,counts=new Float32Array(Math.ceil(duration/bin));events.forEach(e=>counts[Math.floor(e.time/bin)]++);
 return{events,rows,counts:Array.from(counts,x=>x/(units*bin)),bin,duration,units,settings:{seed,rate,strength,interval,mode}};
}
function audible(unit,selected,mode){return mode==='all'||mode==='selected'&&unit===selected||mode==='group'&&(unit-selected+units)%units<6;}
function audio(data,{selected=16,mode='selected',speed=1,volume=.35,sampleRate=22050}={}){
 const samples=new Float32Array(Math.ceil(data.duration/speed*sampleRate));
 const gain=volume*(mode==='all'?.12:mode==='group'?.3:.65);
 for(const e of data.events){if(!audible(e.unit,selected,mode))continue;const start=Math.round(e.time/speed*sampleRate),length=Math.ceil(.009*sampleRate),freq=1400+e.unit*19;
  for(let k=0;k<length&&start+k<samples.length;k++)samples[start+k]+=gain*Math.sin(2*Math.PI*freq*k/sampleRate)*Math.exp(-k/(sampleRate*.0018));
 }
 for(let i=0;i<samples.length;i++)samples[i]=Math.tanh(samples[i]);return samples;
}
function wav(samples,sampleRate=22050){const buffer=new ArrayBuffer(44+samples.length*2),view=new DataView(buffer);function str(pos,s){for(let i=0;i<s.length;i++)view.setUint8(pos+i,s.charCodeAt(i));}str(0,'RIFF');view.setUint32(4,36+samples.length*2,true);str(8,'WAVE');str(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);str(36,'data');view.setUint32(40,samples.length*2,true);for(let i=0;i<samples.length;i++)view.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,samples[i]))*32767),true);return buffer;}
const api={generate,audio,wav,audible,rng,duration,units};if(typeof module!=='undefined')module.exports=api;else root.Spikes=api;
})(globalThis);
