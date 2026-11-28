const {chromium}=require('playwright');const fs=require('fs');
const F=process.env.GAME||'file:///home/user/AI-CHATBOT/game-fable/index.html';const OUT=process.env.OUT||'out';fs.mkdirSync(OUT+'/raw',{recursive:true});
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1600,height:900},deviceScaleFactor:1,recordVideo:{dir:OUT+'/raw',size:{width:1600,height:900}}});
const p=await ctx.newPage();await p.goto(F);await p.waitForTimeout(500);
await p.evaluate(()=>{SG.start(1,0,0,2);const G=SG.G;G.ai.nextWave=1e9;G.reveal=true;G.time=60;G.rain=0;G.nextRain=1e9;SG.ff(70);
 const h=G.blds.find(x=>x.type==='hall'&&x.team===0);window.__h=h?[h.tx+1,h.ty+1]:[6,32]});
await p.addStyleTag({content:'#top,#quick,#groups,#mini,#sky,#zoomBtns,#panel,#toast,#autoChip,#goal{display:none!important}'});
console.log('hall',await p.evaluate(()=>window.__h));
// keyframes: t, x, y (ô), zoom
const N=60,c=N/2,hx=(await p.evaluate(()=>__h));
const K=[[0,c,c,.5],[3,c,c,.5],[7.5,hx[0]+2,hx[1],1.15],[11.5,hx[0]+2,hx[1],1.15],[15,c-6,c-6,.95],[18.5,c+4,c+4,.9],[21,c,c,.5],[22,c,c,.5]];
const t0=Date.now();while(true){const t=(Date.now()-t0)/1000;if(t>K[K.length-1][0])break;
 await p.evaluate(([K,t])=>{let a=K[0],b=K[K.length-1];for(let i=0;i<K.length-1;i++)if(t>=K[i][0]&&t<=K[i+1][0]){a=K[i];b=K[i+1];break}const f=Math.min(1,Math.max(0,(t-a[0])/(b[0]-a[0]||1)));const e=f*f*(3-2*f);const x=a[1]+(b[1]-a[1])*e,y=a[2]+(b[2]-a[2])*e,z=a[3]+(b[3]-a[3])*e;SG.cam.z=z;SG.cam.x=(x-y)*32;SG.cam.y=(x+y)*16},[K,t]);await p.waitForTimeout(60)}
const v=p.video();await ctx.close();fs.renameSync(await v.path(),OUT+'/w0.webm');console.log('ok');await b.close()})()
