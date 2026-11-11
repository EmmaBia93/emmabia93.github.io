
(function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = document.getElementById('net');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const CONFIG = {
        maxNodes: 70,        
        linkDist: 140,       
        mouseDist: 190,     
        attraction: 0.025,   
        nodeColor: '56, 189, 248',   
        linkColor: '99, 102, 241', 
    };

    let w, h, nodes;
    const mouse = { x: null, y: null };

    function init() {
        w = canvas.width = innerWidth;
        h = canvas.height = innerHeight;
        const count = Math.min(CONFIG.maxNodes, Math.floor(w * h / 22000));
        nodes = Array.from({ length: count }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
        }));
    }

    function drawLine(ax, ay, bx, by, color, alpha) {
        ctx.strokeStyle = `rgba(${color}, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
    }

    function update(n) {
        
        if (mouse.x !== null) {
            const dx = mouse.x - n.x;
            const dy = mouse.y - n.y;
            const d = Math.hypot(dx, dy);
            if (d < CONFIG.mouseDist && d > 40) {
                n.x += dx * CONFIG.attraction;
                n.y += dy * CONFIG.attraction;
            }
        }
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
    }

    function frame() {
        ctx.clearRect(0, 0, w, h);

        for (const n of nodes) {
            update(n);
            ctx.beginPath();
            ctx.arc(n.x, n.y, 1.8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${CONFIG.nodeColor}, 0.8)`;
            ctx.fill();
        }

        for (let i = 0; i < nodes.length; i++) {
            
            for (let j = i + 1; j < nodes.length; j++) {
                const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
                if (d < CONFIG.linkDist) {
                    drawLine(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y,
                             CONFIG.linkColor, (1 - d / CONFIG.linkDist) * 0.45);
                }
            }
            
            if (mouse.x !== null) {
                const d = Math.hypot(nodes[i].x - mouse.x, nodes[i].y - mouse.y);
                if (d < CONFIG.mouseDist) {
                    drawLine(nodes[i].x, nodes[i].y, mouse.x, mouse.y,
                             CONFIG.nodeColor, (1 - d / CONFIG.mouseDist) * 0.8);
                }
            }
        }
        requestAnimationFrame(frame);
    }

    addEventListener('resize', init);
    addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    document.addEventListener('mouseleave', () => { mouse.x = mouse.y = null; });

    init();
    frame();
})();