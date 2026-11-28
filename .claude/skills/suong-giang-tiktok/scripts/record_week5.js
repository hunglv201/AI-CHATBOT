const {chromium}=require('playwright');const fs=require('fs');
const F=process.env.GAME||'file://'+require('path').resolve(__dirname,'../../../../game-fable/index.html');const OUT=process.env.OUT||'tt6';fs.mkdirSync(OUT+'/raw',{recursive:true});
const HIDE=`#top,#quick,#groups,#mini,#sky,#zoomBtns,#panel,#toast,#autoChip,#goal{display:none!important}`;
const only=process.argv[2];
(async()=>{const b=await chromium.launch();
 const rec=async(name,dur,setup,during,hide)=>{if(only&&!name.startsWith(only))return;const ctx=await b.newContext({viewport:{width:720,height:1280},deviceScaleFactor:1,recordVideo:{dir:''+OUT+'/raw',size:{width:720,height:1280}}});
  const p=await ctx.newPage();await p.goto(F);await p.waitForTimeout(500);await p.evaluate(setup);await p.addStyleTag({content:hide||HIDE});
  const t0=Date.now();if(during)await during(p);const left=dur*1000-(Date.now()-t0);if(left>0)await p.waitForTimeout(left);const v=p.video();await ctx.close();fs.renameSync(await v.path(),`${OUT}/${name}.webm`);console.log('ok',name)};
 // base: dọn một bãi trống ở giữa bản đồ phẳng, đuổi thú đi chỗ khác
 const base=`const G=SG.G;G.ai.nextWave=1e9;G.rain=0;G.nextRain=1e9;G.time=60;G.reveal=true;const N=Math.sqrt(G.terr.length);const Z=innerWidth/360;const look=(x,y,z)=>{SG.cam.z=z*Z;SG.cam.x=(x-y)*32;SG.cam.y=(x+y)*16};
   const cx=Math.round(N/2),cy=Math.round(N/2);const clear=(x0,y0,r)=>{for(let y=y0-r;y<=y0+r;y++)for(let x=x0-r;x<=x0+r;x++){if(x<0||y<0||x>=N||y>=N)continue;const i=y*N+x;G.obj[i]=0;G.terr[i]=0;G.hill[i]=0;G.road[i]=0}};
   const away=(x0,y0,r)=>{for(const u of G.units)if(u.team===2&&Math.hypot(u.x-x0,u.y-y0)<r){u.x=1.5;u.y=1.5;u.hx=1.5;u.hy=1.5}};clear(cx,cy,11);away(cx,cy,16);`;
 const ev=c=>new Function(c);
 const follow=(get,n,k)=>async p=>{for(let i=0;i<n;i++){await p.evaluate(([g,k])=>{const u=(new Function('return '+g))();if(!u)return;SG.cam.x+=((u.x-u.y)*32-SG.cam.x)*k;SG.cam.y+=((u.x+u.y)*16-SG.cam.y)*k},[get,k]);await p.waitForTimeout(100)}};
 const kf=(keys)=>async p=>{const t0=Date.now();while(true){const t=(Date.now()-t0)/1000;if(t>keys[keys.length-1][0])break;await p.evaluate(([keys,t])=>{let a=keys[0],b=keys[keys.length-1];for(let i=0;i<keys.length-1;i++)if(t>=keys[i][0]&&t<=keys[i+1][0]){a=keys[i];b=keys[i+1];break}const f=b[0]===a[0]?1:Math.min(1,Math.max(0,(t-a[0])/(b[0]-a[0])));const e=f*f*(3-2*f);const Z=innerWidth/360;const x=a[1]+(b[1]-a[1])*e,y=a[2]+(b[2]-a[2])*e,z=a[3]+(b[3]-a[3])*e;SG.cam.z=z*Z;SG.cam.x=(x-y)*32;SG.cam.y=(x+y)*16},[keys,t]);await p.waitForTimeout(80)}};

 const mid=(ga,gb,k)=>async p=>{for(let i=0;i<170;i++){await p.evaluate(([ga,gb,k])=>{const a=(new Function('return '+ga))(),b=(new Function('return '+gb))();if(!a||!b)return;const x=(a.x+(b.dead?a.x:b.x))/2,y=(a.y+(b.dead?a.y:b.y))/2;SG.cam.x+=((x-y)*32-SG.cam.x)*k;SG.cam.y+=((x+y)*16-SG.cam.y)*k},[ga,gb,k]);await p.waitForTimeout(90)}};
 const hallp=`const hl=G.blds.find(b=>b.type==='hall'&&b.team===0);const hx=hl.tx+1,hy=hl.ty+1;`;

 // z1 một voi đấu 12 lính giáo
 await rec('z1',17,ev(`SG.start(1,5,0,1);${base}G.teams[0].age=3;G.teams[1].age=3;SG.spawn('ele',0,cx-3,cy);for(let k=0;k<12;k++)SG.spawn('spear',1,cx+3+(k%4)*.7,cy-1.2+((k/4)|0)*.9);look(cx,cy,1.4);
   setTimeout(()=>{const e=G.units.find(u=>u.type==='ele'&&u.team===0);const s=G.units.filter(u=>u.type==='spear'&&u.team===1);e.order={type:'attack',id:s[0].id,user:1};for(const u of s)u.order={type:'attack',id:e.id,user:1}},2800)`),
   mid("SG.G.units.find(u=>u.type==='ele'&&u.team===0)","SG.G.units.find(u=>u.type==='spear'&&u.team===1)",.1));
 // z2 bảo tháp
 await rec('z2',16,ev(`SG.start(1,5,0,1);${base}G.teams[0].age=3;G.teams[0].res={food:9e3,wood:9e3,gold:9e3};SG.build('hall',0,cx-6,cy-1);look(cx-1,cy,1.2);window.__c=[cx,cy];
   setTimeout(()=>SG.build('wonder',0,cx+1,cy-1),3500)`),
   async p=>{const [cx,cy]=await p.evaluate(()=>__c);await kf([[0,cx-1,cy,1.2],[3,cx-1,cy,1.2],[6,cx+1.5,cy,1.9],[10,cx+1.5,cy,1.9],[13,cx-1,cy,1.0],[16,cx-1,cy,1.0]])(p)});
 // z3 thầy lang
 await rec('z3',17,ev(`SG.start(1,5,0,1);${base}G.teams[0].age=3;G.teams[1].age=3;for(let k=0;k<6;k++){SG.spawn('spear',0,cx-2.5+(k%3)*.7,cy-1.2+((k/3)|0)*.9);SG.spawn('spear',1,cx+2.5+(k%3)*.7,cy-1.2+((k/3)|0)*.9)}SG.spawn('healer',0,cx-3.6,cy-.3);SG.spawn('healer',0,cx-3.6,cy+.7);look(cx,cy,2.0);
   setTimeout(()=>{const a=G.units.filter(u=>u.type==='spear'&&u.team===0),b=G.units.filter(u=>u.type==='spear'&&u.team===1);a.forEach((u,k)=>u.order={type:'attack',id:b[k].id,user:1});b.forEach((u,k)=>u.order={type:'attack',id:a[k].id,user:1})},2600)`),
   mid("SG.G.units.find(u=>u.type==='spear'&&u.team===0)","SG.G.units.find(u=>u.type==='spear'&&u.team===1)",.08));
 // z4 trại chăn nuôi
 await rec('z4',15,ev(`SG.start(1,5,0,1);${base}G.teams[0].age=2;G.teams[0].res={food:9e3,wood:9e3,gold:9e3};SG.build('hall',0,cx-6,cy-1);window.__c=[cx,cy];look(cx-2,cy,1.3);
   setTimeout(()=>{SG.build('pen',0,cx-1,cy-1);for(let k=0;k<6;k++)SG.spawn('chick',0,cx+.2+(k%3)*.5,cy+.6+((k/3)|0)*.5);for(let k=0;k<3;k++)SG.spawn('pig',0,cx-1.5+k*.8,cy+2);for(let k=0;k<2;k++)SG.spawn('ox',0,cx+1.8+k*1.2,cy+1.8)},2200)`),
   async p=>{const [cx,cy]=await p.evaluate(()=>__c);await kf([[0,cx-2,cy,1.3],[2.5,cx-2,cy,1.3],[5,cx,cy+.8,2.0],[15,cx,cy+.8,2.0]])(p)});
 // z5 sáu loại bản đồ
 await rec("z5",13,ev(`SG.start(1,0,0,1);const G=SG.G;G.reveal=true;G.rain=0;G.nextRain=1e9;G.time=60`),
   async p=>{for(let m=0;m<6;m++){await p.evaluate(m=>{SG.start(1,m,0,1);const G=SG.G;G.ai.nextWave=1e9;G.reveal=true;G.rain=0;G.nextRain=1e9;G.time=60;const N=Math.sqrt(G.terr.length);const Z=innerWidth/360;SG.cam.z=.62*Z;SG.cam.x=0;SG.cam.y=N*16},m);await p.waitForTimeout(1600)}});
 // z6 kỵ binh xông vào cung thủ
 await rec('z6',17,ev(`SG.start(1,5,0,1);${base}G.teams[0].age=3;G.teams[1].age=3;for(let k=0;k<8;k++){SG.spawn('horse',0,cx-5+(k%4)*.7,cy-1.4+((k/4)|0)*1);SG.spawn('archer',1,cx+3+(k%4)*.7,cy-1.4+((k/4)|0)*1)}look(cx,cy,1.5);
   setTimeout(()=>{const h=G.units.filter(u=>u.type==='horse'&&u.team===0),a=G.units.filter(u=>u.type==='archer'&&u.team===1);h.forEach((u,k)=>u.order={type:'attack',id:a[k%a.length].id,user:1});a.forEach((u,k)=>u.order={type:'attack',id:h[k%h.length].id,user:1})},2500)`),
   mid("SG.G.units.find(u=>u.type==='horse'&&u.team===0)","SG.G.units.find(u=>u.type==='archer'&&u.team===1)",.1));
 // z7 đêm sói tới làng
 await rec('z7',20,ev(`SG.start(1,5,0,1);${base}G.time=232;G.teams[0].age=3;SG.build('hall',0,cx-1,cy-1);SG.build('tower',0,cx+3,cy-1);SG.build('tower',0,cx+3,cy+2);for(let k=0;k<4;k++)SG.spawn('spear',0,cx+2.5,cy-.6+k*.8);for(let k=0;k<2;k++)SG.spawn('archer',0,cx+1.5,cy+k*.9);look(cx+1.5,cy,1.0);
   setTimeout(()=>{for(let k=0;k<7;k++){const w=SG.spawn('wolf',1,cx+6.5+(k%3)*.7,cy-2.2+((k/3)|0)*1.1);w.order={type:'amove',goal:{t:0,x:cx,y:cy}}}},1200)`));
 await b.close()})();
