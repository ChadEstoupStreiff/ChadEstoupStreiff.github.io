document.getElementById("y").textContent = new Date().getFullYear();

  // Mobile nav toggle
  const btn = document.querySelector(".nav-toggle");
  const body = document.body;
  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
    body.classList.toggle("nav-open", !open);
  });

  // Close menu on link click (nice UX)
  document.querySelectorAll('#primary-nav a').forEach(a => {
    a.addEventListener('click', () => {
      btn.setAttribute("aria-expanded","false");
      body.classList.remove("nav-open");
    });
  });

(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = document.querySelector('.hero');
  if (!hero || reduce) return;

  const c = document.createElement('canvas');
  c.className = 'hero-canvas';
  const ctx = c.getContext('2d');
  hero.appendChild(c);

  let W=0,H=0,dpr=Math.max(1,window.devicePixelRatio||1);
  let P=[], rafId=null;
  const mouse = {x:null,y:null,active:false};

  const CFG = {
    density: 0.00012,
    max: 220, maxM: 120,
    linkDist: 120,
    maxLinksPerNode: 6,
    speed: 0.25,
    keep: 0.08,          // snap back to original velocity
    jitter: 0.002,
    // mouse field
    radius: 160,         // influence radius (px)
    core: 26,            // soft repulsion core (px)
    strength: 0.9        // overall field strength
  };

  function resize(){
    const r = hero.getBoundingClientRect();
    W = Math.floor(r.width); H = Math.floor(r.height);
    c.width = Math.floor(W*dpr); c.height = Math.floor(H*dpr);
    c.style.width=W+'px'; c.style.height=H+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    reflow();
  }
  function target(){
    const n = Math.floor(W*H*CFG.density);
    const cap = (W<700)?CFG.maxM:CFG.max;
    return Math.min(n,cap);
  }
  function reflow(){
    const need = target();
    if(P.length>need){ P.length=need; return; }
    while(P.length<need){
      const a = Math.random()*Math.PI*2;
      const s = CFG.speed*(0.5+Math.random());
      const v0x = Math.cos(a)*s, v0y = Math.sin(a)*s;
      P.push({
        x: Math.random()*W, y: Math.random()*H,
        vx: v0x, vy: v0y, v0x, v0y
      });
    }
  }

  function step(){
    ctx.clearRect(0,0,W,H);

    // Update
    for(const p of P){
      // --- Mouse field with Gaussian falloff + soft core ---
      if(mouse.active && mouse.x!=null){
        const dx = mouse.x - p.x, dy = mouse.y - p.y;
        const r = Math.hypot(dx,dy);
        if(r < CFG.radius){
          // Gaussian falloff: peaks near r ~ radius/√2, small near 0
          const g = Math.exp(- (r*r) / (2*CFG.radius*CFG.radius));
          let ax = (dx/(r||1)) * CFG.strength * g * 0.12;
          let ay = (dy/(r||1)) * CFG.strength * g * 0.12;
          // Soft repulsive core to avoid clumping at cursor
          if(r < CFG.core){
            const t = 1 - (r/CFG.core);
            ax -= (dx/(r||1)) * t * 0.25;
            ay -= (dy/(r||1)) * t * 0.25;
          }
          p.vx += ax; p.vy += ay;
        }
      }

      // Relax toward original trajectory + small organic noise
      p.vx += (p.v0x - p.vx) * CFG.keep;
      p.vy += (p.v0y - p.vy) * CFG.keep;
      p.vx += (Math.random()-0.5)*CFG.jitter;
      p.vy += (Math.random()-0.5)*CFG.jitter;

      // Soft speed cap
      const vmax = CFG.speed*2.0;
      const v = Math.hypot(p.vx,p.vy);
      if(v>vmax){ p.vx = p.vx/v*vmax; p.vy = p.vy/v*vmax; }

      p.x += p.vx; p.y += p.vy;

      // Wrap
      if(p.x<-6) p.x=W+6; if(p.x>W+6) p.x=-6;
      if(p.y<-6) p.y=H+6; if(p.y>H+6) p.y=-6;
    }

    // Links (cap neighbors per node to avoid blob)
    const L2 = CFG.linkDist*CFG.linkDist;
    const linked = new Uint16Array(P.length); // counts per node
    for(let i=0;i<P.length;i++){
      if(linked[i]>=CFG.maxLinksPerNode) continue;
      const a=P[i];
      for(let j=i+1;j<P.length;j++){
        if(linked[j]>=CFG.maxLinksPerNode) continue;
        const b=P[j];
        const dx=a.x-b.x, dy=a.y-b.y, d2=dx*dx+dy*dy;
        if(d2<L2){
          const alpha = 1 - Math.sqrt(d2)/CFG.linkDist;
          ctx.beginPath();
          ctx.moveTo(a.x,a.y);
          ctx.lineTo(b.x,b.y);
          ctx.strokeStyle = `rgba(0,230,255,${0.14*alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          linked[i]++; linked[j]++;
          if(linked[i]>=CFG.maxLinksPerNode) break;
        }
      }
    }

    // Nodes
    ctx.fillStyle='rgba(183,108,255,0.65)';
    for(const p of P){ ctx.beginPath(); ctx.arc(p.x,p.y,1.1,0,Math.PI*2); ctx.fill(); }

    rafId = requestAnimationFrame(step);
  }

  function setMouse(e){
    const r=hero.getBoundingClientRect();
    if('touches'in e && e.touches.length){
      mouse.x=e.touches[0].clientX-r.left; mouse.y=e.touches[0].clientY-r.top; mouse.active=true;
    } else if('clientX'in e){
      mouse.x=e.clientX-r.left; mouse.y=e.clientY-r.top; mouse.active=true;
    }
  }
  function clearMouse(){ mouse.active=false; }

  hero.addEventListener('mousemove',setMouse,{passive:true});
  hero.addEventListener('touchmove',setMouse,{passive:true});
  hero.addEventListener('mouseleave',clearMouse);
  hero.addEventListener('touchend',clearMouse);
  hero.addEventListener('touchcancel',clearMouse);

  window.addEventListener('resize',resize);
  document.addEventListener('visibilitychange',()=> {
    if(document.hidden) cancelAnimationFrame(rafId);
    else rafId=requestAnimationFrame(step);
  });

  resize(); rafId=requestAnimationFrame(step);
})();