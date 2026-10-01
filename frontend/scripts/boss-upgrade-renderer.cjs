/* Local, preview-only 2.5D renderer. No game imports, network requests or gameplay writes. */
class BossScene {
  constructor(canvas, entry, original, hull, factory, hullMask=null) {
    this.canvas=canvas; this.ctx=canvas.getContext('2d'); this.makeCanvas=factory;
    this.W=1000; this.H=690; this.shipX=48; this.shipY=55; this.shipW=904;
    this.entry=entry; this.original=original; this.hull=hull; this.S=this.shipW/entry.sourceWidth;
    this.shipH=this.shipW*entry.sourceHeight/entry.sourceWidth;
    this.t=0; this.player={x:500,y:585}; this.target={x:500,y:585}; this.manual=0;
    this.bullets=[]; this.shots=[]; this.view='animation'; this.focus=-1;
    this.guns=entry.guns.map((g,i)=>({...g,x:this.shipX+(g.anchorX??g.sourceX)*this.S,y:this.shipY+(g.anchorY??g.sourceY)*this.S,
      a:g.base,velocity:0,lock:0,next:1.1+i*.09,shots:0,fired:-100}));
    this.paintedHull=this.paint(hull); this.paintedOriginal=this.paint(original);
    if(hullMask) {const h=this.paintedHull.getContext('2d');h.globalCompositeOperation='destination-in';h.drawImage(hullMask,0,0,this.paintedHull.width,this.paintedHull.height);h.globalCompositeOperation='source-over';}
    // Old 41's two outer short tube mouths are sealed armour fittings in the repaired hull.
    // This prevents a stationary barrel from remaining underneath an independently aimed turret.
    if(entry.oldId===41){const h=this.paintedHull.getContext('2d');for(const [x,y,r] of [[17,306,13],[55,316,14],[1519,306,13],[1481,316,14]]){const m=h.createLinearGradient(x-r,y-r,x+r,y+r);m.addColorStop(0,'#a7a085');m.addColorStop(.5,'#586571');m.addColorStop(1,'#253443');this.ellipse(h,x,y,r,r*.87,m);}}
    this.depthHull=this.makeCanvas(this.paintedHull.width,this.paintedHull.height);
    const d=this.depthHull.getContext('2d'); d.drawImage(this.paintedHull,0,0);
    d.globalCompositeOperation='source-in'; d.fillStyle='#101b28'; d.fillRect(0,0,this.depthHull.width,this.depthHull.height);
    this.guns.forEach(g=>this.prepareGun(g));
    this.stars=Array.from({length:75},(_,i)=>({x:(37+i*131.77)%1000,y:(19+i*91.3)%690,r:i%7===0?1.4:.65}));
    this.backdrops=new Map();this.backdropSize='';this.backdropBuilds=0;
  }
  paint(image) {
    const w=1536,h=Math.round(w*this.entry.sourceHeight/this.entry.sourceWidth);
    const c=this.makeCanvas(w,h),x=c.getContext('2d'); x.drawImage(image,0,0,w,h);
    const im=x.getImageData(0,0,w,h),p=im.data,pl=this.entry.palette;
    const hsv=(h,s,v)=>{const f=(n)=>{const k=(n+h/60)%6;return v-v*s*Math.max(0,Math.min(k,4-k,1));};return [f(5),f(3),f(1)];};
    const armor=hsv(pl.hue,pl.sat,1),glow=this.rgb(pl.glow);
    for(let i=0;i<p.length;i+=4) {
      if(!p[i+3])continue;
      const r=p[i]/255,g=p[i+1]/255,b=p[i+2]/255,v=Math.max(r,g,b),m=Math.min(r,g,b),delta=v-m;
      const lum=.2126*r+.7152*g+.0722*b;
      // Original violet lacquer, silver armour and cyan emitters have separate masks.
      const purple=b>g*1.18&&r>g*1.08&&b>r*.83&&delta>.045;
      const cyan=(g>r*1.2&&b>r*1.3&&b>g*.9&&delta>.10);
      const neutral=delta<.12||(delta<.19&&lum>.30);
      let q;
      if(purple) {const light=Math.min(1,Math.pow(v,.82)*1.19);q=armor.map(z=>(.07+z*.93)*light);}
      else if(cyan) {q=glow.map(z=>z*Math.min(1,v*1.08));}
      else if(neutral) {const light=Math.min(1,Math.pow(lum,.91)*1.38);q=pl.metal.map(z=>z*light+.09*Math.max(0,light-.55));}
      if(q) {p[i]=Math.min(255,q[0]*255);p[i+1]=Math.min(255,q[1]*255);p[i+2]=Math.min(255,q[2]*255);}
    }
    x.putImageData(im,0,0);
    return c;
  }
  rgb(hex) {return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);}
  ellipse(c,x,y,rx,ry,fill) {c.beginPath();c.ellipse(x,y,Math.max(.2,rx),Math.max(.2,ry),0,0,Math.PI*2);c.fillStyle=fill;c.fill();}
  capsule(c,x,y,w,h,fill) {c.beginPath();c.roundRect(x,y,w,h,Math.min(w/2,h/2));c.fillStyle=fill;c.fill();}
  prepareGun(g) {
    const radius=g.halfWidth,back=g.back,front=g.bodyFront;
    const pad=12,w=Math.ceil(radius*2+pad*2),h=Math.ceil(back+g.muzzle+pad*2);
    // Supersampling is done once, preserving round collars in the enlarged inspection view.
    const samples=2,c=this.makeCanvas(w*samples,h*samples),x=c.getContext('2d');
    g.sprite=c;g.spriteScale=samples;g.spritePivot={x:w/2,y:back+pad};
    const reference={laser:6,pulse:6,plasma:9.5,heavy:17.5,siege:28,rocket:5.04}[g.kind];
    g.visualShotWidth=g.shotWidth*Math.max(.8,Math.min(1.45,g.radius/reference));
    x.setTransform(samples,0,0,samples,0,0);
    x.translate(g.spritePivot.x,g.spritePivot.y);
    // Rounded barrel shafts and end collars are built as separate geometry, not a rectangular image cut.
    for(const side of g.barrels) {
      const r=g.radius,y0=front*.24,length=g.muzzle-y0;
      const metal=x.createLinearGradient(side-r,0,side+r,0);
      metal.addColorStop(0,'#17212b');metal.addColorStop(.18,'#ced8d9');metal.addColorStop(.35,'#778d99');
      metal.addColorStop(.64,'#4a5e6d');metal.addColorStop(.89,'#182b38');metal.addColorStop(1,'#0b151d');
      this.capsule(x,side-r,y0,2*r,length,metal);
      // Narrow specular crown gives a cylindrical, rather than box-like, profile.
      this.capsule(x,side-r*.37,y0+2,Math.max(1,r*.16),Math.max(2,length-7),'#dbe2da');
      const bands=g.muzzle>120?3:2;
      for(let k=0;k<bands;k++) {
        const y=y0+length*(.29+k*.24);
        this.capsule(x,side-r*1.15,y,2*r*1.15,Math.max(3,r*.37),'#263745');
        this.ellipse(x,side,y,r*1.15,Math.max(1,r*.20),'#b3b5a0');
      }
      this.capsule(x,side-r*1.13,g.muzzle-r*.36,r*2.26,r*.7,'#1c2d3d');
      this.ellipse(x,side,g.muzzle,r*1.13,Math.max(2,r*.42),'#c9c5a6');
      this.ellipse(x,side,g.muzzle+.4,r*.76,Math.max(1.5,r*.27),'#071321');
      this.ellipse(x,side,g.muzzle+.4,r*.43,Math.max(.8,r*.12),g.shotColor);
    }
    const metal=x.createLinearGradient(-radius,-back,radius,front);
    metal.addColorStop(0,'#e9e7d3');metal.addColorStop(.25,'#aab5b2');metal.addColorStop(.55,'#5c6f7b');metal.addColorStop(1,'#1b2b3a');
    this.ellipse(x,1,3,radius,Math.max(back,front)*.88,'#081320');
    this.ellipse(x,0,-3,radius,Math.max(back,front)*.85,metal);
    // Keep an original, individually textured armoured crown inside a smooth head.
    x.save();x.beginPath();x.ellipse(0,-4,radius*.79,Math.max(back,front)*.66,0,0,Math.PI*2);x.clip();
    x.rotate(-g.base);x.drawImage(this.paintedOriginal,-g.sourceX,-g.sourceY);x.restore();
    x.strokeStyle='rgba(235,216,170,.78)';x.lineWidth=1.8;
    x.beginPath();x.ellipse(0,-3,radius*.91,Math.max(back,front)*.77,0,0,Math.PI*2);x.stroke();
    this.ellipse(x,-radius*.3,-back*.45,Math.max(2,radius*.1),Math.max(1,back*.06),'#e5e8dc');
    this.capsule(x,-Math.max(4,radius*.19),-back*.2,Math.max(8,radius*.38),3,g.shotColor);
    // Cached soft contact shadow; no blur or recolouring in the animation loop.
    g.shadow=this.makeCanvas((w+24)*samples,(h+24)*samples);const sh=g.shadow.getContext('2d');sh.setTransform(samples,0,0,samples,0,0);
    sh.drawImage(c,12,12,w,h);sh.globalCompositeOperation='source-in';sh.fillStyle='rgba(0,6,14,.65)';sh.fillRect(0,0,w+24,h+24);
    g.baseRadius=radius*this.S*1.03;
  }
  delta(a,b) {return Math.atan2(Math.sin(a-b),Math.cos(a-b));}
  point(g,side,muzzle=g.muzzle,recoil=0) {
    return {x:g.x+(-Math.sin(g.a)*(muzzle*this.S-recoil)+Math.cos(g.a)*side*this.S),
      y:g.y+(Math.cos(g.a)*(muzzle*this.S-recoil)+Math.sin(g.a)*side*this.S)};
  }
  move(x,y) {this.target.x=Math.max(32,Math.min(968,x));this.target.y=Math.max(495,Math.min(655,y));this.manual=7;}
  fire(g,remaining,first=true) {
    g.fired=this.t;if(first)g.shots++;
    this.shots.push({key:g.key,t:this.t,error:remaining,lock:g.lock,caliber:g.caliber,kind:g.kind});
    if(this.shots.length>3000)this.shots.splice(0,1000);
    for(const side of g.barrels) {
      const p=this.point(g,side,g.muzzle,g.recoil);
      this.bullets.push({...p,dx:-Math.sin(g.a),dy:Math.cos(g.a),age:0,life:3.5,color:g.shotColor,
        kind:g.kind,width:g.visualShotWidth,speed:g.shotSpeed,source:g.key,caliber:g.caliber});
    }
  }
  step(dt) {
    dt=Math.min(.04,dt);this.t+=dt;this.manual=Math.max(0,this.manual-dt);
    if(!this.manual) {this.target.x=500+Math.sin(this.t*.31)*306;this.target.y=579+Math.sin(this.t*.48)*31;}
    const ease=1-Math.exp(-dt*7);this.player.x+=(this.target.x-this.player.x)*ease;this.player.y+=(this.target.y-this.player.y)*ease;
    for(const [i,g] of this.guns.entries()) {
      const desired=Math.atan2(-(this.player.x-g.x),this.player.y-g.y),diff=this.delta(desired,g.a);
      const speed=Math.min(g.turnSpeed,Math.abs(diff)*6);g.a+=Math.sign(diff)*Math.min(Math.abs(diff),speed*dt);
      const remaining=Math.abs(this.delta(desired,g.a));
      g.lock=remaining<.035?g.lock+dt:0;
      // Each rocket rack has three rows. All rows obey the same aim gate individually.
      if(g.burst>0&&this.t>=g.burstNext&&g.lock>=.16) {this.fire(g,remaining,false);g.burst--;g.burstNext=this.t+.13;}
      if(this.t>=g.next&&g.lock>=.16) {
        this.fire(g,remaining);
        if(g.rows>1){g.burst=g.rows-1;g.burstNext=this.t+.13;}
        g.next=this.t+g.interval+(i%3)*.11;
      }
    }
    for(const b of this.bullets) {b.x+=b.dx*b.speed*dt;b.y+=b.dy*b.speed*dt;b.age+=dt;b.life-=dt;}
    this.bullets=this.bullets.filter(b=>b.life>0&&b.x>-40&&b.x<1040&&b.y>-40&&b.y<730).slice(-260);
  }
  drawHull(c) {
    const {shipX:x,shipY:y,shipW:w,shipH:h}=this;
    if(this.view==='original') {c.drawImage(this.original,x,y,w,h);return;}
    c.save();c.shadowColor='rgba(0,0,0,.7)';c.shadowBlur=20;c.shadowOffsetY=13;
    c.drawImage(this.depthHull,x+3,y+11,w,h);c.restore();
    for(let i=8;i>=2;i-=2)c.drawImage(this.depthHull,x+i*.28,y+i,w,h);
    c.drawImage(this.paintedHull,x,y,w,h);
    // A gentle world-fixed highlight emphasises raised armour without rocking the hull.
    c.save();c.globalCompositeOperation='screen';c.globalAlpha=.055;
    c.drawImage(this.paintedHull,x-1,y-1,w,h);c.restore();
  }
  turret(c,g,scale=1,detail=false) {
    const S=this.S*scale,r=g.baseRadius*scale;
    c.save();c.translate(g.x,g.y);
    this.ellipse(c,2,6,r*1.10,r*.87,'rgba(0,5,12,.78)');
    const base=c.createLinearGradient(-r,-r,r,r);base.addColorStop(0,'#c6bf9a');base.addColorStop(.25,'#716e60');base.addColorStop(.6,'#243643');base.addColorStop(1,'#101c27');
    this.ellipse(c,0,1,r,r*.72,base);this.ellipse(c,0,-1,r*.81,r*.56,'#152738');
    const recoil=Math.max(0,1-(this.t-g.fired)/.25)*g.recoil*scale;
    c.save();c.rotate(g.a);c.translate(0,-recoil);
    c.globalAlpha=.64;c.drawImage(g.shadow,-g.spritePivot.x*S-12*S+3*scale,-g.spritePivot.y*S-12*S+6*scale,g.shadow.width/g.spriteScale*S,g.shadow.height/g.spriteScale*S);
    c.globalAlpha=1;c.drawImage(g.sprite,-g.spritePivot.x*S,-g.spritePivot.y*S,g.sprite.width/g.spriteScale*S,g.sprite.height/g.spriteScale*S);c.restore();
    // Lock indicator is an instrument light, independent of ammunition colour.
    this.ellipse(c,-r*.45,-r*.31,Math.max(1.5,2*scale),Math.max(1,1.2*scale),g.lock>=.16?'#c8f0db':'#d5934f');
    c.restore();
    if(this.t-g.fired<.08) {
      for(const side of g.barrels) {const p=this.point(g,side,g.muzzle,recoil/scale);c.save();c.translate(p.x,p.y);c.rotate(g.a);
        const power=g.visualShotWidth;c.globalAlpha=1-(this.t-g.fired)/.08;
        const flash=c.createRadialGradient(0,5,1,0,5,13+power*1.1);flash.addColorStop(0,'#fff8da');flash.addColorStop(.25,g.shotColor);flash.addColorStop(1,'rgba(0,0,0,0)');
        this.ellipse(c,0,8,9+power*1.2,15+power*1.8,flash);c.restore();}
    }
  }
  shot(c,b) {
    c.save();c.translate(b.x,b.y);c.rotate(Math.atan2(-b.dx,b.dy));c.strokeStyle=b.color;c.fillStyle=b.color;
    const w=b.width;
    if(b.kind==='laser') {c.lineCap='round';c.lineWidth=w*2.8;c.globalAlpha=.2;c.beginPath();c.moveTo(0,-23);c.lineTo(0,0);c.stroke();c.globalAlpha=1;c.lineWidth=w;c.stroke();}
    else if(b.kind==='pulse'||b.kind==='plasma') {this.ellipse(c,0,-4,w*1.5,w*2.3,b.color);this.ellipse(c,-w*.2,-6,w*.53,w*1.1,'#edfaff');}
    else if(b.kind==='rocket') {this.ellipse(c,0,-5,w,w*1.9,'#e6d5aa');c.beginPath();c.moveTo(-w*.65,-12);c.lineTo(0,-27);c.lineTo(w*.65,-12);c.fillStyle='#ed8439';c.fill();}
    else {this.ellipse(c,0,-5,w*1.28,w*1.9,b.color);this.ellipse(c,0,-7,w*.55,w,'#ffefb6');
      const trail=c.createLinearGradient(0,-38,0,-8);trail.addColorStop(0,'rgba(255,79,33,0)');trail.addColorStop(1,b.color);this.capsule(c,-w*.55,-39,w*1.1,31,trail);}
    c.restore();
  }
  fighter(c) {
    c.save();c.translate(this.player.x,this.player.y);
    const flame=c.createLinearGradient(0,15,0,43);flame.addColorStop(0,'#ffd490');flame.addColorStop(.45,'#e28cff');flame.addColorStop(1,'rgba(160,66,255,0)');
    this.ellipse(c,0,27,5,14+Math.sin(this.t*21)*2,flame);
    c.beginPath();for(const [i,p] of [[0,-28],[9,-7],[28,20],[8,13],[0,21],[-8,13],[-28,20],[-9,-7]].entries())i?c.lineTo(...p):c.moveTo(...p);c.closePath();
    const m=c.createLinearGradient(-25,0,25,0);m.addColorStop(0,'#392960');m.addColorStop(.4,'#af81d5');m.addColorStop(1,'#423162');c.fillStyle=m;c.fill();c.strokeStyle='#b28cdd';c.lineWidth=1;c.stroke();
    this.capsule(c,-4,-22,8,33,'#eac06a');this.ellipse(c,0,-11,3.4,7,'#9ad5e7');c.restore();
  }
  backdrop() {
    const size=this.canvas.width+'x'+this.canvas.height;
    if(size!==this.backdropSize){this.backdrops.clear();this.backdropSize=size;}
    const key=this.view==='original'?'original':'animation';
    if(this.backdrops.has(key))return this.backdrops.get(key);
    const layer=this.makeCanvas(this.canvas.width,this.canvas.height),c=layer.getContext('2d');
    c.setTransform(layer.width/this.W,0,0,layer.height/this.H,0,0);
    const bg=c.createRadialGradient(500,210,20,500,320,640);bg.addColorStop(0,'#172133');bg.addColorStop(1,'#060d17');c.fillStyle=bg;c.fillRect(0,0,this.W,this.H);
    for(const s of this.stars)this.ellipse(c,s.x,s.y,s.r,s.r,'#65798a');
    this.drawHull(c);
    this.backdrops.set(key,layer);this.backdropBuilds++;return layer;
  }
  draw() {
    const c=this.ctx;c.setTransform(1,0,0,1,0,0);c.drawImage(this.backdrop(),0,0);
    c.setTransform(this.canvas.width/this.W,0,0,this.canvas.height/this.H,0,0);
    if(this.view!=='original') {
      for(const g of this.guns)this.turret(c,g);
      for(const b of this.bullets)this.shot(c,b);
    }
    if(this.focus>=0&&this.view!=='original') {
      const g=this.guns[this.focus];c.strokeStyle='#ccbd94';c.lineWidth=1;c.beginPath();c.ellipse(g.x,g.y,g.baseRadius+7,g.baseRadius+7,0,0,Math.PI*2);c.stroke();
    }
    this.fighter(c);
  }
}
if(typeof module!=='undefined')module.exports=BossScene;
