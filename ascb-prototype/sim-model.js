/* Ideal, noise-free 2D SIM forward model and linear phase demodulation.
   No reference coefficients are used during reconstruction. */
(function(root){
 'use strict';
 const F=typeof module!=='undefined'?require('./lessons/sim/fourier-math.js'):root.FourierMath;
 const shifts=[[24,0],[12,21],[-12,21]],TAU=2*Math.PI;
 const wrap=(v,n)=>(v%n+n)%n;
 function transfer(x,y,r=24){const d=Math.hypot(x,y);return d<=r-2?1:d>=r?0:.5*(1+Math.cos(Math.PI*(d-r+2)/2))}
 function create(reference,n=256,modulation=.9){
  if(reference.length!==n*n||n<128||(n&(n-1))!==0)throw Error('Expected a square, power-of-two reference of at least 128 pixels.');
  if(!(modulation>0&&modulation<=1))throw Error('Modulation must be in (0, 1].');
  const size=n*n,H=new Float64Array(size),refRe=Float64Array.from(reference),refIm=new Float64Array(size);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++)H[y*n+x]=transfer(x<=n/2?x:x-n,y<=n/2?y:y-n);
  F.fft2(refRe,refIm,n);
  function inverse(re,im){const a=re.slice(),b=im.slice();F.fft2(a,b,n,true);return a}
  const wfRe=refRe.map((v,i)=>v*H[i]),wfIm=refIm.map((v,i)=>v*H[i]);
  const frames=[];
  for(let angle=0;angle<3;angle++)for(let phaseIndex=0;phaseIndex<3;phaseIndex++){
   const phase=phaseIndex*TAU/3,[px,py]=shifts[angle],pattern=new Float64Array(size),illuminated=new Float64Array(size),re=new Float64Array(size),im=new Float64Array(size);
   for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=y*n+x;pattern[i]=1+modulation*Math.cos(TAU*(px*x+py*y)/n+phase);re[i]=illuminated[i]=reference[i]*pattern[i]}
   F.fft2(re,im,n);for(let i=0;i<size;i++){re[i]*=H[i];im[i]*=H[i]}
   frames.push({angle,phaseIndex,phase,pattern,illuminated,re,im,values:inverse(re,im)});
  }
  // D(phi) = H * [O + m/2 exp(i phi) O(k-p) + m/2 exp(-i phi) O(k+p)].
  const bands=shifts.map((shift,a)=>{
   const plusRe=new Float64Array(size),plusIm=new Float64Array(size),minusRe=new Float64Array(size),minusIm=new Float64Array(size);
   for(let j=0;j<3;j++){const frame=frames[a*3+j],co=Math.cos(frame.phase)*2/(3*modulation),si=Math.sin(frame.phase)*2/(3*modulation);
    for(let i=0;i<size;i++){plusRe[i]+=frame.re[i]*co+frame.im[i]*si;plusIm[i]+=frame.im[i]*co-frame.re[i]*si;minusRe[i]+=frame.re[i]*co-frame.im[i]*si;minusIm[i]+=frame.im[i]*co+frame.re[i]*si}
   }return {plusRe,plusIm,minusRe,minusIm,shift};
  });
  function reconstruct(count=3){
   if(!Number.isInteger(count)||count<0||count>3)throw Error('Orientation count must be 0–3.');
   if(count===0)return {re:wfRe.slice(),im:wfIm.slice(),values:inverse(wfRe,wfIm),weights:H.slice()};
   const re=new Float64Array(size),im=new Float64Array(size),weights=new Float64Array(size);
   // Average phase images to estimate the central band, using only selected angles.
   for(let i=0;i<size;i++){
    for(let j=0;j<count*3;j++){re[i]+=frames[j].re[i]/(count*3)*H[i];im[i]+=frames[j].im[i]/(count*3)*H[i]}
    weights[i]=H[i]*H[i];
   }
   for(let a=0;a<count;a++){const band=bands[a],[px,py]=band.shift;
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
     const i=y*n+x,ip=wrap(y+py,n)*n+wrap(x+px,n),imn=wrap(y-py,n)*n+wrap(x-px,n),hp=H[ip],hm=H[imn];
     re[i]+=hp*band.plusRe[ip]+hm*band.minusRe[imn];im[i]+=hp*band.plusIm[ip]+hm*band.minusIm[imn];weights[i]+=hp*hp+hm*hm;
    }
   }
   for(let i=0;i<size;i++){const den=weights[i]+1e-6;re[i]/=den;im[i]/=den}
   return {re,im,weights,values:inverse(re,im)};
  }
  return {n,reference:Float64Array.from(reference),refRe,refIm,H,frames,bands,shifts,modulation,widefield:inverse(wfRe,wfIm),reconstruct};
 }
 const api={create,transfer,shifts};if(typeof module!=='undefined')module.exports=api;else root.SIMModel=api;
})(globalThis);
