
(function () {
    const bar = document.getElementById('scroll-progress');
    const links = Array.from(document.querySelectorAll('nav a[href^="#"]'));

  
    let ticking = false;
    function updateBar() {
        const max = document.documentElement.scrollHeight - innerHeight;
        const ratio = max > 0 ? Math.min(scrollY / max, 1) : 0;
        if (bar) bar.style.transform = 'scaleX(' + ratio + ')';
        if (scrollY < 120) setActive(null); 
        ticking = false;
    }
    addEventListener('scroll', () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(updateBar);
        }
    }, { passive: true });
    addEventListener('resize', updateBar);

    function setActive(id) {
        links.forEach(a => a.classList.toggle('active', id !== null && a.getAttribute('href') === '#' + id));
    }

    const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting && scrollY >= 120) setActive(entry.target.id || null);
        });
    }, { rootMargin: '-45% 0px -50% 0px' });

    document.querySelectorAll('main section').forEach(s => io.observe(s));

    updateBar();
})();