
(function () {
    if (!window.matchMedia('(hover: hover)').matches) return;

    document.addEventListener('mousemove', e => {
        const card = e.target.closest('.card, .stat');
        if (!card) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
        card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
    }, { passive: true });
})();