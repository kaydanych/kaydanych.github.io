'use strict';
const $=id=>document.getElementById(id),canvas=$('scope'),ctx=canvas.getContext('2d');
let seed=42,data,position=0,playing=false,context=null,source=null,started=0,offset=0,frame=0,width=800,height=540,playbackSpeed=1,playRequest=0;
function options(){return{selected:Number($('unit').value)-1,mode:$('audio').value,speed:Number($('speed').value),volume:Number($('volume').value)/100};}
function current(){return playing?Math.min(24,offset+(context.currentTime-started)*playbackSpeed):position;}
function stop(){playRequest++;position=current();playing=false;if(source){source.onended=null;try{source.stop();}catch{}source.disconnect();source=null;}cancelAnimationFrame(frame);$('play').textContent='▶ Play';if(context&&context.state==='running')context.suspend();draw();}
async function play(){if(playing){stop();return;}const request=++playRequest;try{if(!context)context=new (window.AudioContext||window.webkitAudioContext)();await context.resume();if(request!==playRequest)return;if(position>=24)position=0;const opts=options(),samples=Spikes.audio(data,opts),buffer=context.createBuffer(1,samples.length,22050);buffer.copyToChannel(samples,0);source=context.createBufferSource();source.buffer=buffer;source.connect(context.destination);offset=position;playbackSpeed=opts.speed;started=context.currentTime;playing=true;source.start(0,position/opts.speed);source.onended=()=>{if(playing){position=24;playing=false;source.disconnect();source=null;context.suspend();cancelAnimationFrame(frame);$('play').textContent='▶ Play';draw();}};$('play').textContent='Ⅱ Pause';tick();}catch(error){stop();$('status').textContent='Audio could not start: '+error.message;}}
function tick(){draw();if(playing)frame=requestAnimationFrame(tick);}
function rebuild(){stop();position=0;data=Spikes.generate({seed,rate:+$('rate').value,strength:+$('strength').value/100,interval:+$('interval').value,mode:$('mode').value});$('rateOut').textContent=$('rate').value+' Hz';$('strengthOut').textContent=$('strength').value+'%';$('intervalOut').textContent=$('interval').value+' s';$('seedLabel').textContent='Seed '+seed+' · same settings, same events';const burst=$('mode').value==='burst';$('strength').disabled=!burst;$('interval').disabled=!burst;$('modeLabel').textContent={burst:'INDEPENDENT FIRING + SHARED BURSTS',independent:'INDEPENDENT FIRING',sleep:'WAKE → SLOW-WAVE-LIKE ACTIVITY'}[$('mode').value];draw();}
function resize(){const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
function text(s,x,y,color='#91a097',size=10){ctx.fillStyle=color;ctx.font=size+'px ui-monospace, monospace';ctx.fillText(s,x,y);}
function draw(){if(!data)return;const t=current(),left=32,right=width-12,plotWidth=right-left,top=35,bottom=height*.61,rowH=(bottom-top)/48,selected=options().selected,windowSize=6,start=Math.max(0,Math.min(18,t-3)),end=start+windowSize;
 ctx.clearRect(0,0,width,height);ctx.fillStyle='#0c1511';ctx.fillRect(0,0,width,height);text('NEURON',0,14);text('6-SECOND WINDOW',Math.max(100,width-130),14);
 const x=time=>left+(time-start)/windowSize*plotWidth;
 ctx.fillStyle='#ed9c6510';ctx.fillRect(left,top+selected*rowH,plotWidth,rowH);
 for(let s=Math.ceil(start);s<=end;s++){ctx.strokeStyle='#213129';ctx.beginPath();ctx.moveTo(x(s),top);ctx.lineTo(x(s),bottom);ctx.stroke();text(s+'s',x(s)-6,bottom+17);}
 for(let u=0;u<48;u++){const y=top+(u+.5)*rowH;if(u===0||u===47||u===selected)text(String(u+1).padStart(2,'0'),0,y+3,u===selected?'#ef9a65':'#718779',9);
  for(const spike of data.rows[u]){if(spike<start||spike>end)continue;const recent=playing&&t>=spike&&t-spike<.09;ctx.fillStyle=u===selected?'#ef9a65':recent?'#c6ffd8':'#8daca0';ctx.globalAlpha=recent||u===selected?1:.65;ctx.fillRect(x(spike),y-rowH*.3,recent?3:1.5,rowH*.6);}
 }ctx.globalAlpha=1;
 const waveY=height*.76; text('UNIT '+String(selected+1).padStart(2,'0')+' / SYNTHETIC WAVEFORM',left,waveY-33,'#ef9a65');
 ctx.beginPath();ctx.strokeStyle='#ef9a65';ctx.lineWidth=1;for(let px=0;px<=plotWidth;px++){const at=start+px/plotWidth*windowSize;let val=1.3*Math.sin(at*313)+.8*Math.sin(at*711);for(const sp of data.rows[selected]){const d=at-sp;if(Math.abs(d)<.025)val+=-25*Math.exp(-Math.pow(d/.003,2))+12*Math.exp(-Math.pow((d-.007)/.005,2));}const yy=waveY+val;px?ctx.lineTo(left+px,yy):ctx.moveTo(left+px,yy);}ctx.stroke();
 const rateY=height-20,rateH=height*.1,max=Math.max(15,...data.counts);text('POPULATION RATE / SPIKES PER SECOND PER NEURON',left,rateY-rateH-10,'#91a097',width<500?8:9);ctx.beginPath();ctx.moveTo(left,rateY);for(let i=0;i<data.counts.length;i++){const at=(i+.5)*data.bin;if(at<start||at>end)continue;ctx.lineTo(x(at),rateY-data.counts[i]/max*rateH);}ctx.lineTo(right,rateY);ctx.closePath();ctx.fillStyle='#a5e7b929';ctx.fill();ctx.strokeStyle='#78b88c';ctx.stroke();
 const playX=x(t);if(playX>=left&&playX<=right){ctx.strokeStyle='#a5e7b9';ctx.lineWidth=1;ctx.shadowBlur=8;ctx.shadowColor='#a5e7b9';ctx.beginPath();ctx.moveTo(playX,top-7);ctx.lineTo(playX,rateY);ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle='#a5e7b9';ctx.beginPath();ctx.moveTo(playX-4,top-8);ctx.lineTo(playX+4,top-8);ctx.lineTo(playX,top-3);ctx.fill();}
 $('clock').textContent=t.toFixed(2)+' / 24 s';$('seek').value=t;
}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('status').textContent='Saved '+name;}
$('play').onclick=play;$('reset').onclick=()=>{stop();position=0;draw();};
// Capture the slider target before stop() redraws the old playback position.
$('seek').oninput=event=>{const target=+event.target.value;stop();position=target;draw();};
for(const id of ['rate','strength','interval','mode'])$(id).oninput=rebuild;
for(const id of ['unit','volume','audio','speed'])$(id).oninput=()=>{const wasPlaying=playing;
 stop();$('unitOut').textContent=$('unit').value;$('volumeOut').textContent=$('volume').value+'%';draw();if(wasPlaying)return play();};
$('newSeed').onclick=()=>{seed++;rebuild();};
canvas.onclick=event=>{const y=event.clientY-canvas.getBoundingClientRect().top,top=35,bottom=height*.61;if(y<top||y>=bottom)return;$('unit').value=Math.floor((y-top)/(bottom-top)*48)+1;$('unit').dispatchEvent(new Event('input'));};
$('wav').onclick=()=>download(new Blob([Spikes.wav(Spikes.audio(data,options()))],{type:'audio/wav'}),'spike-studio-'+seed+'.wav');
$('json').onclick=()=>download(new Blob([JSON.stringify({schema:'spike-studio/1',description:'Simulated spike times in seconds; zero-based unit IDs. Not an animal recording.',...data},null,2)],{type:'application/json'}),'spike-studio-'+seed+'.json');
$('png').onclick=()=>canvas.toBlob(blob=>{if(blob)download(blob,'spike-studio-frame.png');});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)stop();});window.addEventListener('pagehide',()=>{stop();if(context)context.close();});window.addEventListener('resize',resize);
rebuild();resize();
