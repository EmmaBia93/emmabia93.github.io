
(function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = document.getElementById('net');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const CONFIG = {
        maxNodes: 70,              
        linkDist: 140,               
        mouseDist: 190,              
        attraction: 0.03,            
        holdMin: 60,                
        holdMax: 150,               
        minGap: 54,                  
        repel: 0.15,                 
        nodeColor: '56, 189, 248',  
        linkColor: '99, 102, 241',   
        packetColor: '186, 230, 253',
        maxPackets: 4,               
        packetDuration: 1.4,         
        spawnMin: 0.6,              
        spawnMax: 1.2,               
    };

    let w, h, nodes, packets;
    let rafId = 0, last = 0, spawnIn = 1;
    const mouse = { x: null, y: null };

    
    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = innerWidth;
        h = innerHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const count = Math.min(CONFIG.maxNodes, Math.floor(w * h / 22000));
        nodes = Array.from({ length: count }, () => {
            const z = 0.4 + Math.random() * 0.6; 
            return {
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.7 * z, 
                vy: (Math.random() - 0.5) * 0.7 * z,
                z,
                hold: CONFIG.holdMin + Math.random() * (CONFIG.holdMax - CONFIG.holdMin), 
                r: 1.1 + z * 1.4,                    
                pulse: 0,                            
            };
        });
        packets = [];
    }

    function drawLine(ax, ay, bx, by, color, alpha, width) {
        ctx.strokeStyle = `rgba(${color}, ${alpha})`;
        ctx.lineWidth = width || 1;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
    }

    function update(n, step) {
        
        if (mouse.x !== null) {
            const dx = mouse.x - n.x;
            const dy = mouse.y - n.y;
            const d = Math.hypot(dx, dy) || 1;
            if (d < CONFIG.mouseDist) {
                const pull = (d - n.hold) * CONFIG.attraction * step; // + acerca, - aleja
                n.x += (dx / d) * pull;
                n.y += (dy / d) * pull;
            }
        }
        n.x += n.vx * step;
        n.y += n.vy * step;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        if (n.pulse > 0) n.pulse = Math.max(0, n.pulse - 0.03 * step);
    }

    // Separa los nodos que quedaron más cerca que minGap, para que mantengan distancia
    function separate(step) {
        const min = CONFIG.minGap;
        if (!min) return;

        for (let i = 0; i < nodes.length; i++) {
            const a = nodes[i];
            for (let j = i + 1; j < nodes.length; j++) {
                const b = nodes[j];
                let dx = b.x - a.x;
                let dy = b.y - a.y;
                if (Math.abs(dx) > min || Math.abs(dy) > min) continue; // descarte rápido
                let d = Math.hypot(dx, dy);
                if (d >= min) continue;
                if (d < 0.01) { // exactamente encimados: se empujan en una dirección al azar
                    const ang = Math.random() * Math.PI * 2;
                    dx = Math.cos(ang); dy = Math.sin(ang); d = 1;
                }
                const push = (min - d) * 0.5 * CONFIG.repel * step;
                const nx = dx / d, ny = dy / d;
                a.x -= nx * push; a.y -= ny * push;
                b.x += nx * push; b.y += ny * push;
            }
        }

        
        for (const n of nodes) {
            n.x = Math.min(Math.max(n.x, 0), w);
            n.y = Math.min(Math.max(n.y, 0), h);
        }
    }

    
    function spawnPacket() {
        if (packets.length >= CONFIG.maxPackets || nodes.length < 2) return;
        const a = nodes[Math.floor(Math.random() * nodes.length)];
        const near = nodes.filter(b => {
            if (b === a) return false;
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            return d < CONFIG.linkDist * 0.9;
        });
        if (!near.length) return;
        const b = near[Math.floor(Math.random() * near.length)];
        packets.push({ a, b, t: 0 });
    }

    function drawPackets(dt) {
        for (let k = packets.length - 1; k >= 0; k--) {
            const p = packets[k];
            p.t += dt / CONFIG.packetDuration;

            
            const d = Math.hypot(p.a.x - p.b.x, p.a.y - p.b.y);
            if (d > CONFIG.linkDist * 1.15) { packets.splice(k, 1); continue; }
            if (p.t >= 1) { p.b.pulse = 1; packets.splice(k, 1); continue; }

            const x = p.a.x + (p.b.x - p.a.x) * p.t;
            const y = p.a.y + (p.b.y - p.a.y) * p.t;
            const tt = Math.max(0, p.t - 0.12);
            const tx = p.a.x + (p.b.x - p.a.x) * tt;
            const ty = p.a.y + (p.b.y - p.a.y) * tt;

            drawLine(tx, ty, x, y, CONFIG.packetColor, 0.55, 1.6); 
            ctx.beginPath();
            ctx.arc(x, y, 2.6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${CONFIG.packetColor}, 0.95)`;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${CONFIG.nodeColor}, 0.18)`;
            ctx.fill();
        }
    }

    function frame(now) {
        const dt = Math.min((now - last) / 1000, 0.05); 
        last = now;
        const step = dt * 60; 

        ctx.clearRect(0, 0, w, h);

        for (const n of nodes) update(n, step);
        separate(step);

      
        for (let i = 0; i < nodes.length; i++) {
            const a = nodes[i];
            for (let j = i + 1; j < nodes.length; j++) {
                const b = nodes[j];
                const d = Math.hypot(a.x - b.x, a.y - b.y);
                if (d < CONFIG.linkDist) {
                    const depth = Math.min(a.z, b.z);
                    drawLine(a.x, a.y, b.x, b.y, CONFIG.linkColor, (1 - d / CONFIG.linkDist) * 0.45 * depth);
                }
            }
            if (mouse.x !== null) {
                const d = Math.hypot(a.x - mouse.x, a.y - mouse.y);
                if (d < CONFIG.mouseDist) {
                    drawLine(a.x, a.y, mouse.x, mouse.y, CONFIG.nodeColor, (1 - d / CONFIG.mouseDist) * 0.8);
                }
            }
        }

        
        spawnIn -= dt;
        if (spawnIn <= 0) {
            spawnPacket();
            spawnIn = CONFIG.spawnMin + Math.random() * (CONFIG.spawnMax - CONFIG.spawnMin);
        }
        drawPackets(dt);

        
        for (const n of nodes) {
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${CONFIG.nodeColor}, ${0.3 + n.z * 0.55})`;
            ctx.fill();

            if (n.pulse > 0) {
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.r + (1 - n.pulse) * 12, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(${CONFIG.packetColor}, ${n.pulse * 0.6})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        rafId = requestAnimationFrame(frame);
    }

    function start() {
        if (rafId) return;
        last = performance.now();
        rafId = requestAnimationFrame(frame);
    }

    function stop() {
        cancelAnimationFrame(rafId);
        rafId = 0;
    }

    addEventListener('resize', resize);
    addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    document.addEventListener('mouseleave', () => { mouse.x = mouse.y = null; });
    
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

    resize();
    start();
})();