
(function () {
    const lb = document.getElementById('lightbox');
    const lbImg = document.getElementById('lightbox-img');
    if (!lb || !lbImg) return;

    function open(card) {
        if (card.querySelector('.thumb').classList.contains('noimg')) return;
        lbImg.src = card.dataset.img;
        lb.classList.add('open');
    }

    document.querySelectorAll('.cert').forEach(card => {
        card.addEventListener('click', () => open(card));
        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                open(card);
            }
        });
    });

    lb.addEventListener('click', () => lb.classList.remove('open'));
    addEventListener('keydown', e => {
        if (e.key === 'Escape') lb.classList.remove('open');
    });
})();