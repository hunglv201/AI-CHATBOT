const {chromium}=require('playwright');const fs=require('fs');
const F=process.env.GAME||'file://'+require('path').resolve(__dirname,'../../../../game-fable/index.html');const OUT=process.env.OUT||'out';fs.mkdirSync(OUT+'/raw',{recursive:true});
const HIDE=`#top,#quick,#groups,#mini,#sky,#zoomBtns,#panel,#toast,#autoChip,#goal{display:none!important}`;
const only=process.argv[2];
(async()=>{const b=await chromium.launch();
 const rec=async(name,dur,setup,during)=>{if(only&&!name.startsWith(only))return;const ctx=await b.newContext({viewport:{width:720,height:1280},deviceScaleFactor:1,recordVideo:{dir:''+OUT+'/raw',size:{width:720,height:1280}}});
  const p=await ctx.newPage();await p.goto(F);await p.waitForTimeout(500);await p.evaluate(setup);await p.addStyleTag({content:HIDE});
  const t0=Date.now();if(during)await during(p);const left=dur*1000-(Date.now()-t0);if(left>0)await p.waitForTimeout(left);const v=p.video();await ctx.close();fs.renameSync(await v.path(),`${OUT}/${name}.webm`);console.log('ok',name)};
 // base: dọn một bãi trống ở giữa bản đồ phẳng, đuổi thú đi chỗ khác
 const base=`const G=SG.G;G.ai.nextWave=1e9;G.rain=0;G.nextRain=1e9;G.time=60;G.reveal=true;const N=Math.sqrt(G.terr.length);const Z=innerWidth/360;const look=(x,y,z)=>{SG.cam.z=z*Z;SG.cam.x=(x-y)*32;SG.cam.y=(x+y)*16};
   const cx=Math.round(N/2),cy=Math.round(N/2);const clear=(x0,y0,r)=>{for(let y=y0-r;y<=y0+r;y++)for(let x=x0-r;x<=x0+r;x++){if(x<0||y<0||x>=N||y>=N)continue;const i=y*N+x;G.obj[i]=0;G.terr[i]=0;G.hill[i]=0;G.road[i]=0}};
   const away=(x0,y0,r)=>{for(const u of G.units)if(u.team===2&&Math.hypot(u.x-x0,u.y-y0)<r){u.x=1.5;u.y=1.5;u.hx=1.5;u.hy=1.5}};clear(cx,cy,11);away(cx,cy,16);`;
 const ev=c=>new Function(c);
 const follow=(get,n,k)=>async p=>{for(let i=0;i<n;i++){await p.evaluate(([g,k])=>{const u=(new Function('return '+g))();if(!u)return;SG.cam.x+=((u.x-u.y)*32-SG.cam.x)*k;SG.cam.y+=((u.x+u.y)*16-SG.cam.y)*k},[get,k]);await p.waitForTimeout(100)}};
 const kf=(keys)=>async p=>{const t0=Date.now();while(true){const t=(Date.now()-t0)/1000;if(t>keys[keys.length-1][0])break;await p.evaluate(([keys,t])=>{let a=keys[0],b=keys[keys.length-1];for(let i=0;i<keys.length-1;i++)if(t>=keys[i][0]&&t<=keys[i+1][0]){a=keys[i];b=keys[i+1];break}const f=b[0]===a[0]?1:Math.min(1,Math.max(0,(t-a[0])/(b[0]-a[0])));const e=f*f*(3-2*f);const Z=innerWidth/360;const x=a[1]+(b[1]-a[1])*e,y=a[2]+(b[2]-a[2])*e,z=a[3]+(b[3]-a[3])*e;SG.cam.z=z*Z;SG.cam.x=(x-y)*32;SG.cam.y=(x+y)*16},[keys,t]);await p.waitForTimeout(80)}};
 // 1. voi chiến phá cổng thành
 await rec('x1',17,ev(`SG.start(1,5,0,1);${base}G.teams[0].age=3;G.teams[1].age=3;
   for(let k=0;k<5;k++){SG.build('wall',1,cx+3,cy-2+k)}const gid=SG.build('gate',1,cx+3,cy);for(let k=0;k<2;k++){SG.build('wall',1,cx+3,cy+1+k)}for(let k=0;k<2;k++)SG.build('wall',1,cx+3,cy-2-k+0);
   SG.build('tower',1,cx+4,cy-3);SG.build('house',1,cx+6,cy-1);for(let k=0;k<3;k++)SG.spawn('archer',1,cx+5,cy-1+k*.8);
   window.__e=[];for(let k=0;k<2;k++){SG.spawn('ele',0,cx-5,cy-.6+k*1.6);}const es=G.units.filter(u=>u.type==='ele'&&u.team===0);window.__es=es;look(cx-.5,cy,1.7);
   setTimeout(()=>{for(const e of es)e.order={type:'attack',id:gid,user:1}},2200)`),
   follow("SG.G.units.find(u=>u.type==='ele'&&u.team===0)",160,.05));
 // 2. máy bắn đá phá nhà
 await rec('x2',17,ev(`SG.start(1,5,0,1);${base}G.teams[0].age=3;G.teams[1].age=3;
   const h1=SG.build('house',1,cx+4,cy-2),h2=SG.build('barracks',1,cx+4,cy+1),h3=SG.build('house',1,cx+7,cy-1);
   SG.speed=2;for(let k=0;k<3;k++)SG.spawn('cata',0,cx-2.5,cy-1.6+k*1.6);const ct=G.units.filter(u=>u.type==='cata'&&u.team===0);look(cx+1,cy,1.0);
   setTimeout(()=>{ct.forEach((c,k)=>{c.order={type:'attack',id:[h1,h2,h2][k],user:1}})},2000);setTimeout(()=>{ct.forEach((c)=>{if(!c.dead)c.order={type:'attack',id:h3,user:1}})},11500);window.__cx=cx;window.__cy=cy`),
   async p=>{const[cx,cy]=await p.evaluate(()=>[__cx,__cy]);await kf([[0,cx+1,cy,1.0],[2,cx-1.5,cy,1.8],[7,cx-1,cy,1.8],[9,cx+4.3,cy-.5,1.8],[17,cx+5.5,cy-.5,1.8]])(p)});
 // 3. cung thủ trên đồi
 await rec('x3',18,ev(`SG.start(1,5,0,1);${base}G.teams[0].age=2;
   for(let y=cy-3;y<=cy+2;y++)for(let x=cx-4;x<=cx-1;x++){G.hill[y*N+x]=1}
   for(let k=0;k<5;k++)SG.spawn('archer',0,cx-3+(k%2)*.8,cy-2+((k/2)|0)*1.1);
   look(cx+1,cy,1.25);
   const wave=()=>{for(let k=0;k<4;k++)SG.spawn('spear',1,cx+7+(k%2)*.8,cy-2.5+((k/2)|0)*1.1);for(const u of G.units)if(u.team===1&&u.type==='spear')u.order={type:'amove',goal:{t:0,x:cx-3,y:cy}}};
   setTimeout(wave,2500);window.__cx=cx;window.__cy=cy`),
   async p=>{const[cx,cy]=await p.evaluate(()=>[__cx,__cy]);await kf([[0,cx+1,cy,1.0],[2.2,cx-2,cy-.5,1.9],[18,cx-1.5,cy-.3,1.9]])(p)});
 // 4. tướng quân đấu nữ tướng
 await rec('x4',16,ev(`SG.start(1,5,0,1);${base}G.teams[0].age=3;G.teams[1].age=3;
   SG.spawn('hero',0,cx-1.6,cy);SG.spawn('heroine',1,cx+1.6,cy);const h=G.units.find(u=>u.type==='hero'&&u.team===0),w=G.units.find(u=>u.type==='heroine'&&u.team===1);
   w.max=90;w.hp=90;h.max=210;h.hp=210;window.__h=h;window.__w=w;look(cx,cy,1.6);
   setTimeout(()=>{h.order={type:'attack',id:w.id,user:1};w.order={type:'attack',id:h.id,user:1}},2800)`),
   async p=>{for(let i=0;i<150;i++){await p.evaluate(()=>{const a=window.__h,b=window.__w;const x=(a.x+(b.dead?a.x:b.x))/2,y=(a.y+(b.dead?a.y:b.y))/2;SG.cam.x+=((x-y)*32-SG.cam.x)*.12;SG.cam.y+=((x+y)*16-SG.cam.y)*.12});await p.waitForTimeout(100)}});
 // 5. thuyền chiến trên sông
 await rec('x5',17,ev(`SG.start(1,1,0,1);${base.replace('clear(cx,cy,11);','')}
   let wx=-1,wy=-1;for(let y=8;y<N-8&&wx<0;y++)for(let x=8;x<N-8;x++){let ok=true;for(let dy=-3;dy<=3&&ok;dy++)for(let dx=-3;dx<=3;dx++)if(G.terr[(y+dy)*N+x+dx]!==1||G.obj[(y+dy)*N+x+dx]){ok=false;break}if(ok){wx=x;wy=y;break}}
   if(wx<0){wx=cx;wy=cy}for(let k=0;k<3;k++){SG.spawn('wboat',0,wx-2.5,wy-1.5+k*1.4);SG.spawn('wboat',1,wx+2.5,wy-1.5+k*1.4)}
   const a=G.units.filter(u=>u.type==='wboat'&&u.team===0),e=G.units.filter(u=>u.type==='wboat'&&u.team===1);look(wx,wy,1.8);
   setTimeout(()=>{a.forEach((u,k)=>{u.order={type:'attack',id:e[k].id,user:1}});e.forEach((u,k)=>{u.order={type:'attack',id:a[k].id,user:1}})},2500)`));
 // 6. 50 đấu 50
 await rec('x6',20,ev(`SG.start(1,5,0,1);${base}G.teams[0].age=3;G.teams[1].age=3;
   const a=['spear','spear','archer','archer','horse','xbow','spear','ele','archer','horse'];for(let k=0;k<50;k++){SG.spawn(a[k%10],0,cx-8+(k%5)*.7,cy-4+((k/5)|0)*.8);SG.spawn(a[(k+4)%10],1,cx+6+(k%5)*.7,cy-4+((k/5)|0)*.8)}
   SG.spawn('hero',0,cx-9,cy);SG.spawn('hero',1,cx+10.5,cy);look(cx-.5,cy,.95);
   setTimeout(()=>{for(const u of G.units)if((u.team===0||u.team===1)&&u.type!=='vil'){const e=G.units.filter(v=>v.team===1-u.team&&v.type!=='vil'&&Math.hypot(v.x-cx,v.y-cy)<14);if(e.length)u.order={type:'attack',id:e[(Math.random()*e.length)|0].id,user:1}}},3000)`));
 // 7. giữ làng trước 3 đợt tấn công
 await rec('x7',22,ev(`SG.start(1,5,0,1);${base}G.teams[0].age=3;G.teams[0].res={food:9e3,wood:9e3,gold:9e3};
   SG.build('hall',0,cx-1,cy-1);SG.build('tower',0,cx+3,cy-1);SG.build('tower',0,cx+3,cy+2);SG.build('barracks',0,cx-5,cy-1);for(let k=0;k<5;k++)SG.spawn('spear',0,cx+2.5,cy-1+k*.7);for(let k=0;k<4;k++)SG.spawn('archer',0,cx+1.5,cy-1+k*.8);
   look(cx+1,cy,1.5);
   const wave=n=>{for(let k=0;k<n;k++){SG.spawn(k%3?'spear':'horse',1,cx+10+(k%3)*.7,cy-3+((k/3)|0)*.9)}for(const u of G.units)if(u.team===1&&u.type!=='vil')u.order={type:'amove',goal:{t:0,x:cx,y:cy}}};
   setTimeout(()=>wave(6),1500);setTimeout(()=>wave(9),7500);setTimeout(()=>wave(12),13500)`));
 await b.close()})();
