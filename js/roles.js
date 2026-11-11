
(function () {
    const el = document.getElementById('role-text');
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const START_DELAY = 9000; 
    const HOLD = 4500;        
    const FADE = 500;         

  
    const roles = [
        el.textContent,
        'Administración de redes ISP · MikroTik · Cisco · Ubiquiti',
        'Fibra óptica · Videovigilancia IP · Linux',
        'Python · Bash · Automatización de infraestructura',
    ];
    let i = 0;

    function next() {
        el.classList.add('is-fading');
        setTimeout(() => {
            i = (i + 1) % roles.length;
            el.textContent = roles[i];
            el.classList.remove('is-fading');
            setTimeout(next, HOLD);
        }, FADE);
    }

    setTimeout(next, START_DELAY);
})();