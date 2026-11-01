(function(root){
function fft(re,im,inverse=false){const n=re.length;for(let i=1,j=0;i<n;i++){let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){[re[i],re[j]]=[re[j],re[i]];[im[i],im[j]]=[im[j],im[i]];}}for(let len=2;len<=n;len*=2){const a=(inverse?2:-2)*Math.PI/len,wr=Math.cos(a),wi=Math.sin(a);for(let i=0;i<n;i+=len){let ur=1,ui=0;for(let j=0;j<len/2;j++){const k=i+j,l=k+len/2,tr=re[l]*ur-im[l]*ui,ti=re[l]*ui+im[l]*ur;re[l]=re[k]-tr;im[l]=im[k]-ti;re[k]+=tr;im[k]+=ti;const next=ur*wr-ui*wi;ui=ur*wi+ui*wr;ur=next;}}}if(inverse)for(let i=0;i<n;i++){re[i]/=n;im[i]/=n;}}
function fft2(re,im,n,inverse=false){const r=new Float64Array(n),v=new Float64Array(n);for(let y=0;y<n;y++){for(let x=0;x<n;x++){r[x]=re[y*n+x];v[x]=im[y*n+x];}fft(r,v,inverse);for(let x=0;x<n;x++){re[y*n+x]=r[x];im[y*n+x]=v[x];}}for(let x=0;x<n;x++){for(let y=0;y<n;y++){r[y]=re[y*n+x];v[y]=im[y*n+x];}fft(r,v,inverse);for(let y=0;y<n;y++){re[y*n+x]=r[y];im[y*n+x]=v[y];}}}
function filter(re,im,n,cutoff){const r=re.slice(),v=im.slice();for(let y=0;y<n;y++)for(let x=0;x<n;x++){const f=Math.hypot(x<=n/2?x:x-n,y<=n/2?y:y-n);const w=f<=cutoff-2?1:f>=cutoff?0:.5*(1+Math.cos(Math.PI*(f-cutoff+2)/2));r[y*n+x]*=w;v[y*n+x]*=w;}fft2(r,v,n,true);return r;}
// Integer-bin shifts preserve conjugate symmetry for the real-valued inverse image.
function supportWeight(x,y,radius,stages){
 const edge=d=>d<=radius-2?1:d>=radius?0:.5*(1+Math.cos(Math.PI*(d-radius+2)/2));
 let w=edge(Math.hypot(x,y));const shifts=[[24,0],[12,21],[-12,21]];
 for(let a=0;a<stages;a++)for(const sign of [-1,1])w=Math.max(w,edge(Math.hypot(x-sign*shifts[a][0],y-sign*shifts[a][1])));
 return w;
}
function recoverSupport(re,im,n,stages){const r=re.slice(),v=im.slice();for(let y=0;y<n;y++)for(let x=0;x<n;x++){const w=supportWeight(x<=n/2?x:x-n,-(y<=n/2?y:y-n),24,stages);r[y*n+x]*=w;v[y*n+x]*=w;}fft2(r,v,n,true);return r;}

const api={fft,fft2,filter,supportWeight,recoverSupport};if(typeof module!=='undefined')module.exports=api;else root.FourierMath=api;
})(globalThis);
