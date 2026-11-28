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

 const village=`G.teams[0].age=2;G.teams[0].res={food:9e3,wood:9e3,gold:9e3};const N2=Math.sqrt(G.terr.length);const hl=G.blds.find(b=>b.type==='hall'&&b.team===0);const hx=hl.tx+1,hy=hl.ty+1;for(let y=hy-9;y<=hy+9;y++)for(let x=hx-4;x<=hx+13;x++){if(x<0||y<0||x>=N2||y>=N2)continue;const i=y*N2+x;if(G.bld[i])continue;G.obj[i]=0;G.hill[i]=0;G.road[i]=0;if(G.terr[i]===1)G.terr[i]=0}for(const u of G.units)if(u.team===2&&Math.hypot(u.x-hx,u.y-hy)<14){u.x=1.5;u.y=1.5;u.hx=1.5;u.hy=1.5}window.__h=[hx,hy];`;
 const vk=(keys)=>async p=>{const h=await p.evaluate(()=>__h);const K=keys.map(k=>[k[0],h[0]+k[1],h[1]+k[2],k[3]]);await kf(K)(p)};
 const fight=(a,ta,b,tb,k)=>mid(`SG.G.units.find(u=>u.type==='${a}'&&u.team===${ta})`,`SG.G.units.find(u=>u.type==='${b}'&&u.team===${tb})`,k||.1);
 // v1 chó săn đấu sói
 await rec('v1',14,ev(`SG.start(1,5,0,1);${base}SG.spawn('dog',0,cx-1.6,cy);SG.spawn('wolf',1,cx+1.6,cy);look(cx,cy,1.9);setTimeout(()=>{const a=G.units.find(u=>u.type==='dog'&&u.team===0),b=G.units.find(u=>u.type==='wolf'&&u.team===1);a.order={type:'attack',id:b.id,user:1};b.order={type:'attack',id:a.id,user:1}},2300)`),fight('dog',0,'wolf',1));
 // v2 voi đấu tê giác
 await rec('v2',14,ev(`SG.start(1,5,0,1);${base}G.teams[0].age=3;SG.spawn('ele',0,cx-2.2,cy);SG.spawn('rhino',1,cx+2.2,cy);look(cx,cy,1.7);setTimeout(()=>{const a=G.units.find(u=>u.type==='ele'&&u.team===0),b=G.units.find(u=>u.type==='rhino'&&u.team===1);a.order={type:'attack',id:b.id,user:1};b.order={type:'attack',id:a.id,user:1}},2300)`),fight('ele',0,'rhino',1));
 // v3 hai tướng đấu sáu kỵ binh
 await rec('v3',15,ev(`SG.start(1,5,0,1);${base}G.teams[0].age=3;G.teams[1].age=3;SG.spawn('hero',0,cx-3,cy-.5);SG.spawn('heroine',0,cx-3,cy+.6);for(let k=0;k<6;k++)SG.spawn('horse',1,cx+3+(k%3)*.8,cy-.9+((k/3)|0)*1.1);look(cx,cy,1.6);setTimeout(()=>{const hs=G.units.filter(u=>u.type==='horse'&&u.team===1),a=G.units.filter(u=>(u.type==='hero'||u.type==='heroine')&&u.team===0);a.forEach((u,k)=>u.order={type:'attack',id:hs[k].id,user:1});hs.forEach((u,k)=>u.order={type:'attack',id:a[k%2].id,user:1})},2400)`),fight('hero',0,'horse',1));
 // v4 tường thành chặn lính
 await rec('v4',16,ev(`SG.start(1,5,0,1);${base}G.teams[0].age=3;G.teams[1].age=3;SG.build('hall',0,cx-5,cy-1);const ws=[];for(let k=0;k<7;k++)ws.push(SG.build('wall',0,cx+2,cy-3+k));SG.build('tower',0,cx+1,cy-2);SG.build('tower',0,cx+1,cy+2);look(cx+3,cy,1.3);
   for(let k=0;k<12;k++)SG.spawn('spear',1,cx+5.5+(k%4)*.7,cy-1.6+((k/4)|0)*1.1);
   setTimeout(()=>{const e=G.units.filter(u=>u.type==='spear'&&u.team===1);e.forEach((u,k)=>u.order={type:'attack',id:ws[k%ws.length],user:1})},2300)`));
 // v5 xây làng trong 20 giây
 await rec('v5',16,ev(`SG.start(1,0,0,1);const G=SG.G;G.ai.nextWave=1e9;G.reveal=true;G.rain=0;G.nextRain=1e9;G.time=60;${village}const hx2=hx,hy2=hy;
   [[1000,'house',3,-3],[2200,'farm',3,2],[3400,'house',7,-3],[4600,'barracks',7,1],[5800,'tower',11,-1],[7000,'store',3,-6],[8200,'house',11,3]].forEach(([t,b,dx,dy])=>setTimeout(()=>SG.build(b,0,hx2+dx,hy2+dy),t))`),vk([[0,5,-.5,1.5],[10,6,0,.95],[16,6,0,.95]]));
 // v6 giáo khắc ngựa
 await rec('v6',14,ev(`SG.start(1,5,0,1);${base}G.teams[0].age=3;G.teams[1].age=3;for(let k=0;k<6;k++){SG.spawn('spear',0,cx-3+(k%3)*.7,cy-1+((k/3)|0)*1);SG.spawn('horse',1,cx+3+(k%3)*.7,cy-1+((k/3)|0)*1)}look(cx,cy,1.6);setTimeout(()=>{const a=G.units.filter(u=>u.type==='spear'&&u.team===0),b=G.units.filter(u=>u.type==='horse'&&u.team===1);a.forEach((u,k)=>u.order={type:'attack',id:b[k].id,user:1});b.forEach((u,k)=>u.order={type:'attack',id:a[k].id,user:1})},2400)`),fight('spear',0,'horse',1));
 // v7 cung thủ sau lính giáo
 await rec('v7',15,ev(`SG.start(1,5,0,1);${base}G.teams[0].age=3;G.teams[1].age=3;for(let k=0;k<4;k++){SG.spawn('spear',0,cx-1.2,cy-1.4+k*.9);SG.spawn('archer',0,cx-3,cy-1.4+k*.9)}look(cx,cy,1.6);
   for(let k=0;k<8;k++)SG.spawn('spear',1,cx+3.5+(k%4)*.7,cy-1.6+((k/4)|0)*1.1);
   setTimeout(()=>{const e=G.units.filter(u=>u.type==='spear'&&u.team===1),m=G.units.filter(u=>u.type==='spear'&&u.team===0);e.forEach((u,k)=>u.order={type:'attack',id:m[k%m.length].id,user:1})},2300)`));
 // v8 dân làng đi săn hươu
 await rec('v8',14,ev(`SG.start(1,5,0,1);${base}for(let k=0;k<4;k++)SG.spawn('vil',0,cx-2.5,cy-1.4+k*.9);for(let k=0;k<3;k++)SG.spawn('deer',2,cx+2.4+k*.8,cy-1+k*.9);look(cx,cy,1.8);setTimeout(()=>{const d=G.units.filter(u=>u.type==='deer'&&u.team===2),v=G.units.filter(u=>u.type==='vil'&&u.team===0);v.forEach((u,k)=>u.order={type:'attack',id:d[k%d.length].id,user:1})},2200)`),fight('vil',0,'deer',2));
 // v9 bình minh
 await rec('v9',14,ev(`SG.start(1,1,0,1);const G=SG.G;G.ai.nextWave=1e9;G.reveal=true;G.rain=0;G.nextRain=1e9;G.time=288;${village}`),vk([[0,6,-2,1.2],[13,2.5,-1.5,1.7]]));
 // v10 đom đóm
 await rec('v10',14,ev(`SG.start(1,2,0,1);const G=SG.G;G.ai.nextWave=1e9;G.reveal=true;G.rain=0;G.nextRain=1e9;G.time=236;${village}`),vk([[0,6,-1,1.3],[13,3,-1,1.9]]));
 // v11 mưa
 await rec('v11',14,ev(`SG.start(1,0,0,1);const G=SG.G;G.ai.nextWave=1e9;G.reveal=true;G.nextRain=1e9;G.time=60;G.rain=1e9;${village}`),vk([[0,5,0,1.3],[13,3,-1,1.8]]));
 // v12 mùa thu
 await rec('v12',14,ev(`SG.start(1,2,0,1);const G=SG.G;G.ai.nextWave=1e9;G.reveal=true;G.rain=0;G.nextRain=1e9;G.time=620;${village}`),vk([[0,6,-1,1.2],[13,3,-1,1.7]]));
 // v13 đua tốc độ
 await rec('v13',14,ev(`SG.start(1,5,0,1);${base}G.teams[0].age=3;['horse','scout','ele','vil'].forEach((t,k)=>SG.spawn(t,0,cx-7,cy-2.4+k*1.5));look(cx+1,cy,0.65);setTimeout(()=>{for(const u of G.units)if(u.team===0&&['horse','scout','ele','vil'].includes(u.type))u.order={type:'amove',goal:{t:0,x:cx+9,y:cy}}},2300)`));
 // v14 tướng đấu mười dân làng
 await rec('v14',15,ev(`SG.start(1,5,0,1);${base}G.teams[0].age=3;SG.spawn('hero',0,cx-2.5,cy);for(let k=0;k<10;k++)SG.spawn('vil',1,cx+3+(k%5)*.7,cy-1.2+((k/5)|0)*1);look(cx,cy,1.7);setTimeout(()=>{const h=G.units.find(u=>u.type==='hero'&&u.team===0),v=G.units.filter(u=>u.type==='vil'&&u.team===1);h.order={type:'attack',id:v[0].id,user:1};v.forEach(u=>u.order={type:'attack',id:h.id,user:1})},2400)`));
 // v15 nhà đổi hình theo đời
 await rec('v15',14,ev(`SG.start(1,0,0,1);const G=SG.G;G.ai.nextWave=1e9;G.reveal=true;G.rain=0;G.nextRain=1e9;G.time=60;${village}G.teams[0].age=0;SG.build('house',0,hx+4,hy-2);SG.build('barracks',0,hx+4,hy+2);
   [[3000,1],[5800,2],[8600,3]].forEach(([t,a])=>setTimeout(()=>{G.teams[0].age=a},t))`),vk([[0,2.5,0,1.7],[14,2.5,0,1.7]]));
 // v16 lính qua các đời (overlay)
 await rec('v16',14,ev(`SG.start(1,5,0,1);${base}const cv=document.createElement('canvas');cv.width=720;cv.height=1280;cv.style.cssText='position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:99';document.body.appendChild(cv);const c=cv.getContext('2d');const t0=performance.now();
   const draw=()=>{const t=(performance.now()-t0)/1000;const g=c.createLinearGradient(0,0,0,1280);g.addColorStop(0,'#1d2a38');g.addColorStop(1,'#2b3b2a');c.fillStyle=g;c.fillRect(0,0,720,1280);
    for(let i=0;i<4;i++){const ox=(i%2)*360+10,oy=430+((i/2)|0)*400;c.fillStyle='rgba(250,238,205,.14)';c.fillRect(ox,oy,340,370);c.strokeStyle='rgba(250,238,205,.5)';c.lineWidth=3;c.strokeRect(ox,oy,340,370);c.font='800 34px sans-serif';c.fillStyle='#ffe9a8';c.textAlign='center';c.fillText('Đời '+(i+1),ox+170,oy+50);
     [['archer',62],['hero',172],['spear',282]].forEach(([ty,px])=>{c.save();c.translate(ox+px,oy+300);c.scale(3.1,3.1);SG.drawUnit(c,ty,0,0,0,{face:1,anim:t*6,age:i,skin:'goc'});c.restore()})}requestAnimationFrame(draw)};draw()`));
 // v17 cá sấu rình bờ sông
 await rec('v17',14,ev(`SG.start(1,5,0,1);${base}for(let k=0;k<3;k++)SG.spawn('vil',0,cx-2.6,cy-1+k*.9);SG.spawn('croc',1,cx+2.2,cy);look(cx,cy,1.9);setTimeout(()=>{const c=G.units.find(u=>u.type==='croc'&&u.team===1),v=G.units.filter(u=>u.type==='vil'&&u.team===0);v.forEach(u=>u.order={type:'attack',id:c.id,user:1});c.order={type:'attack',id:v[1].id,user:1}},2300)`),fight('vil',0,'croc',1));
 // v18 máy bắn đá đấu chòi canh
 await rec('v18',16,ev(`SG.start(1,5,0,1);${base}G.teams[0].age=3;G.teams[1].age=3;const tw=SG.build('tower',1,cx+4,cy);for(let k=0;k<2;k++)SG.spawn('cata',0,cx-3,cy-.8+k*1.6);SG.speed=2;look(cx-1,cy,1.9);window.__c=[cx,cy];setTimeout(()=>{G.units.filter(u=>u.type==='cata'&&u.team===0).forEach(u=>u.order={type:'attack',id:tw,user:1})},2000)`),
   async p=>{const [cx,cy]=await p.evaluate(()=>__c);await kf([[0,cx-1,cy,1.1],[2,cx-3,cy,2.0],[6,cx-3,cy,2.0],[8,cx+3.5,cy,2.0],[16,cx+3.5,cy,2.0]])(p)});
 // v19 mưa tên
 await rec('v19',15,ev(`SG.start(1,5,0,1);${base}G.teams[0].age=3;G.teams[1].age=3;for(let k=0;k<20;k++){SG.spawn('archer',0,cx-4.5+(k%4)*.7,cy-2.2+((k/4)|0)*.9);}look(cx,cy,1.25);
   for(let k=0;k<20;k++)SG.spawn('spear',1,cx+4+(k%5)*.7,cy-2.4+((k/5)|0)*1.2);
   setTimeout(()=>{const e=G.units.filter(u=>u.type==='spear'&&u.team===1),m=G.units.filter(u=>u.type==='archer'&&u.team===0);e.forEach((u,k)=>u.order={type:'attack',id:m[k%m.length].id,user:1})},2400)`));
 await b.close()})();
