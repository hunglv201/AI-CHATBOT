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
 // y1 hổ đấu cá sấu
 await rec('y1',17,ev(`SG.start(1,5,0,1);${base}SG.spawn('tiger',0,cx-1.7,cy);SG.spawn('croc',1,cx+1.7,cy);
   const a=G.units.find(u=>u.type==='tiger'&&u.team===0),b=G.units.find(u=>u.type==='croc'&&u.team===1);look(cx,cy,1.9);
   setTimeout(()=>{a.order={type:'attack',id:b.id,user:1};b.order={type:'attack',id:a.id,user:1}},2800)`),
   mid("SG.G.units.find(u=>u.type==='tiger'&&u.team===0)","SG.G.units.find(u=>u.type==='croc'&&u.team===1)",.12));
 // y2 chỉ dùng dân làng
 await rec('y2',17,ev(`SG.start(1,5,0,1);${base}for(let k=0;k<15;k++)SG.spawn('vil',0,cx-3.5+(k%5)*.7,cy-1.4+((k/5)|0)*.9);for(let k=0;k<3;k++)SG.spawn('wolf',1,cx+3+k*.8,cy-.8+k*.8);
   look(cx,cy,1.55);
   setTimeout(()=>{const w=G.units.filter(u=>u.type==='wolf');for(const u of G.units){if(u.type==='vil'&&u.team===0)u.order={type:'attack',id:w[(Math.random()*3)|0].id,user:1}}for(const x of w){const v=G.units.filter(u=>u.type==='vil');x.order={type:'attack',id:v[(Math.random()*v.length)|0].id,user:1}}},2500)`));
 // y3 timelapse tự chơi
 await rec('y3',16,ev(`SG.start(1,0,0,1);const G=SG.G;G.reveal=true;G.rain=0;G.nextRain=1e9;G.time=60;${hallp}__setAuto(true);window.__hx=hx;window.__hy=hy;SG.cam.z=1.6;SG.cam.x=(hx-hy)*32;SG.cam.y=(hx+hy)*16`),
   async p=>{for(let i=0;i<58;i++){await p.evaluate(()=>{SG.ff(8);const z=1.6-Math.min(.8,SG.G.time/500);SG.cam.z+=(z-SG.cam.z)*.3;const hx=__hx+3,hy=__hy-3;SG.cam.x=(hx-hy)*32;SG.cam.y=(hx+hy)*16});await p.waitForTimeout(210)}});
 // y4 bộ giáp
 await rec('y4',16,ev(`SG.start(1,5,0,1);${base}const cv=document.createElement('canvas');cv.width=720;cv.height=1280;cv.style.cssText='position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:99';document.body.appendChild(cv);const c=cv.getContext('2d');
   const ks=[['camve','Cấm vệ'],['dahanh','Dạ hành'],['bodoi','Bộ đội'],['cogiap','Cơ giáp']];const t0=performance.now();
   const draw=()=>{const t=(performance.now()-t0)/1000;const g=c.createLinearGradient(0,0,0,1280);g.addColorStop(0,'#1d2a38');g.addColorStop(1,'#2b3b2a');c.fillStyle=g;c.fillRect(0,0,720,1280);
    ks.forEach(([k,n],i)=>{const ox=(i%2)*360+10,oy=430+((i/2)|0)*400;c.fillStyle='rgba(250,238,205,.14)';c.fillRect(ox,oy,340,370);c.strokeStyle='rgba(250,238,205,.5)';c.lineWidth=3;c.strokeRect(ox,oy,340,370);
     c.font='800 34px sans-serif';c.fillStyle='#ffe9a8';c.textAlign='center';c.fillText(n,ox+170,oy+50);
     [['archer',62],['hero',172],['spear',282]].forEach(([ty,px])=>{c.save();c.translate(ox+px,oy+300);c.scale(3.1,3.1);SG.drawUnit(c,ty,0,0,0,{face:1,anim:t*6,age:3,skin:k});c.restore()})});requestAnimationFrame(draw)};draw()`));
 // y5 năm mẹo
 await rec('y5',22,ev(`SG.start(1,0,0,1);const G=SG.G;G.ai.nextWave=1e9;G.reveal=true;G.rain=0;G.nextRain=1e9;G.time=60;const N=Math.sqrt(G.terr.length);${hallp}G.teams[0].res={food:9e3,wood:9e3,gold:9e3};
   for(let y=hy-9;y<=hy+9;y++)for(let x=hx-4;x<=hx+12;x++){if(x<0||y<0||x>=N||y>=N)continue;const i=y*N+x;if(G.bld[i])continue;G.obj[i]=0;G.hill[i]=0;G.road[i]=0;if(G.terr[i]===1)G.terr[i]=0}
   for(const u of G.units)if(u.team===2&&Math.hypot(u.x-hx,u.y-hy)<14){u.x=1.5;u.y=1.5;u.hx=1.5;u.hy=1.5}
   window.__hx=hx;window.__hy=hy;const Z=innerWidth/360;SG.cam.z=1.5*Z;SG.cam.x=((hx+3)-(hy-1))*32;SG.cam.y=((hx+3)+(hy-1))*16;
   setTimeout(()=>SG.build('house',0,hx+4,hy-3),2500);setTimeout(()=>SG.build('farm',0,hx+4,hy+2),5500);setTimeout(()=>SG.build('barracks',0,hx+8,hy-3),11500);
   setTimeout(()=>{for(let y=hy+4;y<=hy+6;y++)for(let x=hx+8;x<=hx+10;x++)G.hill[y*N+x]=1;for(let k=0;k<4;k++)SG.spawn('archer',0,hx+8.6+(k%2)*.8,hy+4.8+((k/2)|0)*.9)},8000);`),
   async p=>{const t0=Date.now();while((Date.now()-t0)<21500){const t=(Date.now()-t0)/1000;await p.evaluate(t=>{const Z=innerWidth/360;const hx=__hx,hy=__hy;const k=t<9?[hx+4,hy-.5,1.5]:t<13?[hx+9,hy+4,1.7]:[hx+6,hy,1.05];SG.cam.z+=(k[2]*Z-SG.cam.z)*.06;SG.cam.x+=(((k[0]-k[1])*32)-SG.cam.x)*.06;SG.cam.y+=(((k[0]+k[1])*16)-SG.cam.y)*.06},t);await p.waitForTimeout(80)}});
 // y6 thuyền chiến (cận)
 await rec('y6',17,ev(`SG.start(1,1,0,1);${base.replace('clear(cx,cy,11);','')}
   let wx=-1,wy=-1;for(let y=8;y<N-8&&wx<0;y++)for(let x=8;x<N-8;x++){let ok=true;for(let dy=-3;dy<=3&&ok;dy++)for(let dx=-3;dx<=3;dx++)if(G.terr[(y+dy)*N+x+dx]!==1||G.obj[(y+dy)*N+x+dx]){ok=false;break}if(ok){wx=x;wy=y;break}}
   if(wx<0){wx=cx;wy=cy}for(let k=0;k<3;k++){SG.spawn('wboat',0,wx-2.5,wy-1.5+k*1.4);SG.spawn('wboat',1,wx+2.5,wy-1.5+k*1.4)}
   const a=G.units.filter(u=>u.type==='wboat'&&u.team===0),e=G.units.filter(u=>u.type==='wboat'&&u.team===1);look(wx,wy,2.1);window.__w=[wx,wy];
   setTimeout(()=>{a.forEach((u,k)=>{u.order={type:'attack',id:e[k].id,user:1}});e.forEach((u,k)=>{u.order={type:'attack',id:a[k].id,user:1}})},2500)`));
 // y7 mã bí mật
 await rec('y7',20,ev(`SG.start(1,5,0,1);const G=SG.G;G.ai.nextWave=1e9;G.rain=0;G.nextRain=1e9;G.time=60;G.reveal=false;${hallp}const Z=innerWidth/360;SG.cam.z=1.6*Z;SG.cam.x=((hx+1)-hy)*32;SG.cam.y=((hx+1)+hy)*16;window.__hx=hx;window.__hy=hy;
   setTimeout(()=>{const r=G.teams[0].res;r.food+=1000;r.wood+=1000;r.gold+=1000},3500);
   setTimeout(()=>{const t=['spear','spear','archer','archer','horse','hero'];t.forEach((ty,k)=>SG.spawn(ty,0,hx+2.5+(k%3)*.9,hy-1.2+((k/3)|0)*1.1))},6500);
   setTimeout(()=>{G.reveal=true;const z=.7*Z;SG.cam.z=z},9500)`),null,HIDE.replace('#top,',''));
 await b.close()})();
