
(function () {
    const term = document.getElementById('terminal');
    const body = document.getElementById('term-body');
    if (!term || !body) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const USER = 'emmanuel@noc';
    const TYPE_SPEED = 45;   
    const LINE_GAP = 130;    

   
    const L = (text, cls) => [[text, cls]];

    
    const script = [
        { cmd: 'whoami' },
        { out: [L('emmanuel_biazzetti', 'hi'), L('Administrador de redes · San Juan, Argentina', 'dim')] },

        { cmd: 'cat stack.txt' },
        { out: [L('mikrotik · cisco · ubiquiti · zte-olt · linux · python')] },

        { cmd: 'ls ~/proyectos' },
        { out: [[['AirPulse/', 'dir'], ['  ', ''], ['CashFlow/', 'dir'], ['  ', ''], ['PyScript/', 'dir'], ['  ', ''], ['UbiBatch/', 'dir']]] },

        { cmd: 'ping -c 3 oportunidades' },
        {
            gap: 420,
            out: [
                L('PING oportunidades (10.0.0.1): 56 data bytes', 'dim'),
                L('64 bytes from 10.0.0.1: icmp_seq=1 ttl=64 time=0.4 ms'),
                L('64 bytes from 10.0.0.1: icmp_seq=2 ttl=64 time=0.3 ms'),
                L('64 bytes from 10.0.0.1: icmp_seq=3 ttl=64 time=0.4 ms'),
                L('--- oportunidades ping statistics ---', 'dim'),
                L('3 packets transmitted, 3 received, 0% packet loss', 'ok'),
                L('status: disponible ✔', 'ok'),
            ],
        },
    ];

    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    function line(segments) {
        const el = document.createElement('div');
        el.className = 't-line';
        (segments || []).forEach(([text, cls]) => {
            const span = document.createElement('span');
            if (cls) span.className = 't-' + cls;
            span.textContent = text;
            el.appendChild(span);
        });
        body.appendChild(el);
        return el;
    }

    function prompt() {
        const el = line([[USER, 'user'], [':', ''], ['~', 'path'], ['$ ', '']]);
        const typed = document.createElement('span');
        const cursor = document.createElement('span');
        cursor.className = 't-cursor';
        el.append(typed, cursor);
        return { typed, cursor };
    }

    let running = false;
    let token = 0; 

    async function run() {
        const mine = ++token;
        running = true;
        body.replaceChildren();

        for (const step of script) {
            if (mine !== token) return;

            if (step.cmd) {
                const p = prompt();
                for (const ch of step.cmd) {
                    p.typed.textContent += ch;
                    if (!reduce) await sleep(TYPE_SPEED);
                    if (mine !== token) return;
                }
                if (!reduce) await sleep(280);
                p.cursor.remove();
            } else {
                for (const l of step.out) {
                    line(l);
                    if (!reduce) await sleep(step.gap || LINE_GAP);
                    if (mine !== token) return;
                }
            }
        }

        prompt(); 
        running = false;
    }

    
    term.addEventListener('click', () => {
        if (!running) run();
    });

    
    const io = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
            io.disconnect();
            setTimeout(run, reduce ? 0 : 500);
        }
    }, { threshold: 0.3 });
    io.observe(term);
})();