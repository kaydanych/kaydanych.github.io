const test=require('node:test');
const assert=require('node:assert/strict');
const {create}=require('../sim-model.js');
const n=128,ref=Float64Array.from({length:n*n},(_,i)=>{const x=i%n,y=Math.floor(i/n);return .4+.1*Math.cos(2*Math.PI*40*x/n)+.07*Math.cos(2*Math.PI*40*y/n)+.03*Math.cos(2*Math.PI*60*x/n)});
const model=create(ref,n);
function amplitude(values,qx,qy){let r=0,im=0;for(let y=0;y<n;y++)for(let x=0;x<n;x++){const p=2*Math.PI*(qx*x+qy*y)/n,v=values[y*n+x];r+=v*Math.cos(p);im-=v*Math.sin(p)}return 2*Math.hypot(r,im)/(n*n)}
test('phase averaging returns uniform illumination through the same detector',()=>{
 for(let a=0;a<3;a++)for(let i=0;i<n*n;i++){const mean=(model.frames[a*3].values[i]+model.frames[a*3+1].values[i]+model.frames[a*3+2].values[i])/3;assert.ok(Math.abs(mean-model.widefield[i])<1e-10)}
});
test('demodulation recovers a detail blocked in widefield only with a useful orientation',()=>{
 const one=model.reconstruct(1),all=model.reconstruct(3);
 assert.ok(amplitude(model.widefield,40,0)<1e-10);
 assert.ok(Math.abs(amplitude(one.values,40,0)-.1)<1e-5);
 assert.ok(amplitude(one.values,0,40)<1e-10);
 assert.ok(Math.abs(amplitude(all.values,0,40)-.07)<1e-5);
 assert.ok(amplitude(all.values,60,0)<1e-10,'unsupported detail must remain absent');
 const mean=all.values.reduce((a,b)=>a+b,0)/(n*n);assert.ok(Math.abs(mean-.4)<1e-6,'overlapping bands must not inflate brightness');
});
test('three phases and orientations form nine distinct measurements',()=>{
 assert.equal(model.frames.length,9);
 for(let a=0;a<3;a++)assert.deepEqual(model.frames.slice(a*3,a*3+3).map(f=>f.phaseIndex),[0,1,2]);
 assert.ok(model.frames[0].values.some((v,i)=>Math.abs(v-model.frames[1].values[i])>.001));
 assert.throws(()=>model.reconstruct(4));assert.throws(()=>create(ref,n,0));
});
