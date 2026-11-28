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

 const OV=(cells,cols,cw,ch,sc,y0,title)=>`const cv=document.createElement('canvas');cv.width=720;cv.height=1280;cv.style.cssText='position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:99';document.body.appendChild(cv);const c=cv.getContext('2d');const t0=performance.now();const cells=${JSON.stringify(cells)};
   const draw=()=>{const t=(performance.now()-t0)/1000;const g=c.createLinearGradient(0,0,0,1280);g.addColorStop(0,'#1d2a38');g.addColorStop(1,'#2b3b2a');c.fillStyle=g;c.fillRect(0,0,720,1280);
    ${title?`c.font='800 40px sans-serif';c.fillStyle='#ffe9a8';c.textAlign='center';c.fillText(${JSON.stringify(title)},360,${y0-40});`:''}
    cells.forEach(([ty,lb],i)=>{const ox=10+(i%${cols})*${cw},oy=${y0}+((i/${cols})|0)*${ch};c.fillStyle='rgba(250,238,205,.14)';c.fillRect(ox,oy,${cw}-10,${ch}-10);c.strokeStyle='rgba(250,238,205,.5)';c.lineWidth=3;c.strokeRect(ox,oy,${cw}-10,${ch}-10);
     c.font='800 26px sans-serif';c.fillStyle='#ffe9a8';c.textAlign='center';c.fillText(lb,ox+(${cw}-10)/2,oy+34);
     c.save();c.translate(ox+(${cw}-10)/2,oy+${ch}-50);c.scale(${sc},${sc});try{SG.drawUnit(c,ty,0,0,0,{face:1,anim:t*6,age:3,skin:'goc'})}catch(e){}c.restore()});requestAnimationFrame(draw)};draw()`;
 // u1 xếp hạng ba binh chủng
 await rec('u1',13,ev(`SG.start(1,5,0,1);${base}${OV([['horse','Hạng 3'],['archer','Hạng 2'],['ele','Hạng 1']],3,236,380,2.5,470,'')}`));
 // u2 mười ba loài thú
 await rec('u2',14,ev(`SG.start(1,5,0,1);${base}${OV([['tiger','Hổ'],['croc','Cá sấu'],['ele','Voi'],['rhino','Tê giác'],['bear','Gấu'],['wolf','Sói'],['buff','Trâu rừng'],['boar','Lợn rừng'],['whorse','Ngựa hoang'],['monkey','Khỉ'],['peacock','Công'],['deer','Hươu'],['snake','Rắn']],4,178,230,1.7,330,'')}`));
 // u3 một ngày ở làng (tự chơi cho dân làng làm việc)
 await rec('u3',15,ev(`SG.start(1,0,0,1);const G=SG.G;G.ai.nextWave=1e9;G.reveal=true;G.rain=0;G.nextRain=1e9;G.time=60;${village}__setAuto(true);SG.ff(110);SG.speed=2;SG.cam.z=1.5*(innerWidth/360)`),vk([[0,3,1,1.5],[14,5,2,1.6]]));
 // u4 tường thành và voi
 await rec('u4',15,ev(`SG.start(1,5,0,1);${base}G.teams[0].age=3;G.teams[1].age=3;const ws=[];for(let k=0;k<5;k++)ws.push(SG.build('wall',0,cx+1,cy-2+k));SG.spawn('ele',1,cx+4,cy-.6);SG.spawn('ele',1,cx+4,cy+.9);look(cx+2,cy,1.7);
   setTimeout(()=>{G.units.filter(u=>u.type==='ele'&&u.team===1).forEach((u,k)=>u.order={type:'attack',id:ws[1+k*2],user:1})},2300)`));
 // u5 truyện mở đầu (bình minh sương)
 await rec('u5',16,ev(`SG.start(1,1,0,1);const G=SG.G;G.ai.nextWave=1e9;G.reveal=true;G.rain=0;G.nextRain=1e9;G.time=287;${village}`),vk([[0,2,-1,2.0],[15,5,-.5,1.2]]));
 // u6 bốn mùa
 await rec('u6',14,ev(`SG.start(1,0,0,1);const G=SG.G;G.ai.nextWave=1e9;G.reveal=true;G.rain=0;G.nextRain=1e9;G.time=60;${village}SG.cam.z=1.6*(innerWidth/360)`),
   async p=>{const h=await p.evaluate(()=>__h);for(let i=0;i<140;i++){await p.evaluate(([i,hx,hy])=>{const times=[60,310,620,745];G=SG.G;G.time=times[Math.min(3,Math.floor(i/35))]+((i%35)*.5);const z=(1.5+(i%35)*.004)*(innerWidth/360);SG.cam.z=z;SG.cam.x=((hx+4)-(hy-1))*32;SG.cam.y=((hx+4)+(hy-1))*16},[i,h[0],h[1]]);await p.waitForTimeout(95)}});
 // u7 bốn nhân vật đặc biệt
 await rec('u7',14,ev(`SG.start(1,5,0,1);${base}${OV([['hero','Tướng quân'],['heroine','Nữ tướng'],['healer','Thầy lang'],['monk','Thầy tu']],2,355,420,4.8,430,'')}`));
 // u9 mã xây nhanh
 await rec('u9',16,ev(`SG.start(1,0,0,1);const G=SG.G;G.ai.nextWave=1e9;G.reveal=true;G.rain=0;G.nextRain=1e9;G.time=60;${village}const hx2=hx,hy2=hy;
   [[1500,'house',3,-3],[2300,'barracks',7,0],[3100,'tower',3,3],[3900,'store',7,-4]].forEach(([t,b,dx,dy])=>setTimeout(()=>SG.build(b,0,hx2+dx,hy2+dy),t));
   setTimeout(()=>{['spear','spear','archer','archer','horse','hero'].forEach((ty,k)=>SG.spawn(ty,0,hx2+3+(k%3)*.9,hy2+6+((k/3)|0)*1.1))},6500)`),vk([[0,5,0,1.2],[6,6,2,1.5],[16,6,3,1.5]]));
 await b.close()})();
