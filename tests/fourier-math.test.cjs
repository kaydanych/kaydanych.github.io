const {test}=require('node:test'),assert=require('node:assert/strict'),F=require('../tools/slm-to-sample/fourier-math.js');
test('2D FFT and inverse retain amplitude and phase',()=>{const n=32,r=Float64Array.from({length:n*n},(_,i)=>.3+.2*Math.cos(2*Math.PI*3*(i%n)/n+.8)+.1*Math.sin(2*Math.PI*5*Math.floor(i/n)/n)),original=r.slice(),im=new Float64Array(n*n);F.fft2(r,im,n);F.fft2(r,im,n,true);assert.ok(r.every((x,i)=>Math.abs(x-original[i])<1e-12));assert.ok(im.every(x=>Math.abs(x)<1e-12));});
test('frequency filtering removes fine pattern but keeps broad pattern and mean',()=>{const n=32,r=Float64Array.from({length:n*n},(_,i)=>.5+.15*Math.cos(2*Math.PI*2*(i%n)/n)+.1*Math.cos(2*Math.PI*12*(i%n)/n)),im=new Float64Array(n*n);F.fft2(r,im,n);const filtered=F.filter(r,im,n,6);assert.ok(filtered.every((v,i)=>Math.abs(v-(.5+.15*Math.cos(2*Math.PI*2*(i%n)/n)))<1e-12));});

test('cell SIM coverage preserves central disk and adds directional bands',()=>{
 const M=require('../tools/slm-to-sample/fourier-math.js');
 assert.equal(M.supportWeight(40,0,24,0),0);
 assert.equal(M.supportWeight(40,0,24,1),1);
 assert.equal(M.supportWeight(0,40,24,1),0);
 assert.ok(M.supportWeight(0,40,24,2)>0);
 for(let s=0;s<=3;s++)for(let y=-50;y<=50;y+=5)for(let x=-50;x<=50;x+=5){
  assert.equal(M.supportWeight(x,y,24,s),M.supportWeight(-x,-y,24,s));
  if(s)assert.ok(M.supportWeight(x,y,24,s)>=M.supportWeight(x,y,24,s-1));
 }
 const n=128,r=Float64Array.from({length:n*n},(_,i)=>.5+.2*Math.cos(2*Math.PI*40*(i%n)/n)),im=new Float64Array(n*n);
 M.fft2(r,im,n);const low=M.recoverSupport(r,im,n,0),high=M.recoverSupport(r,im,n,1),filter=M.filter(r,im,n,24);
 assert.ok(Math.abs(high[0]-.7)<1e-10);assert.ok(Math.abs(low[0]-.5)<1e-10);
 assert.ok(low.every((v,i)=>Math.abs(v-filter[i])<1e-10));
});
