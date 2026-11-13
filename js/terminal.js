
(function () {
    const term = document.getElementById('terminal');
    const body = document.getElementById('term-body');
    if (!term || !body) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const USER = 'emmanuel@noc';
    const TYPE_SPEED = 45;   
    const LINE_GAP = 130;    
    const FAST_GAP = 45;     
    const MAX_INPUT = 60;   

    const EMAIL = 'emmabia2013@gmail.com';
    const GITHUB = 'https://github.com/EmmaBia93';
    const LINKEDIN = 'https://www.linkedin.com/in/emmabia/';

    const L = (text, cls, href) => [[text, cls, href]];

   
    const WHOAMI = [L('emmanuel_biazzetti', 'hi'), L('Administrador de redes · San Juan, Argentina', 'dim')];
    const INTRO_STACK = [L('mikrotik · cisco · ubiquiti · zte-olt · linux · python')];
    const PROJECTS = [[['AirPulse/', 'dir'], ['  ', ''], ['CashFlow/', 'dir'], ['  ', ''], ['PyScript/', 'dir'], ['  ', ''], ['UbiBatch/', 'dir']]];
    const PING = [
        L('PING oportunidades (10.0.0.1): 56 data bytes', 'dim'),
        L('64 bytes from 10.0.0.1: icmp_seq=1 ttl=64 time=0.4 ms'),
        L('64 bytes from 10.0.0.1: icmp_seq=2 ttl=64 time=0.3 ms'),
        L('64 bytes from 10.0.0.1: icmp_seq=3 ttl=64 time=0.4 ms'),
        L('--- oportunidades ping statistics ---', 'dim'),
        L('3 packets transmitted, 3 received, 0% packet loss', 'ok'),
        L('status: disponible ✔', 'ok'),
    ];

    const HELP = [
        L('Comandos disponibles:', 'hi'),
        [['  help      ', 'dir'], ['esta ayuda', '']],
        [['  whoami    ', 'dir'], ['quién soy', '']],
        [['  ls        ', 'dir'], ['mis proyectos', '']],
        [['  stack     ', 'dir'], ['herramientas con las que trabajo', '']],
        [['  contacto  ', 'dir'], ['cómo encontrarme', '']],
        [['  neofetch  ', 'dir'], ['lo que tu navegador cuenta de vos', '']],
        [['  myip      ', 'dir'], ['tu IP pública (consulta un servicio externo)', '']],
        [['  uname     ', 'dir'], ['sistema y navegador (probá uname -a)', '']],
        [['  ipcalc    ', 'dir'], ['calculadora de subredes (ipcalc 10.0.0.0/24)', '']],
        [['  ping      ', 'dir'], ['probá: ping oportunidades', '']],
        [['  clear     ', 'dir'], ['limpiar la pantalla', '']],
        [['  replay    ', 'dir'], ['repetir la presentación', '']],
        L('Pista: hay algunos comandos ocultos 😉', 'dim'),
    ];
    const STACK = [
        [['redes     ', 'dim'], ['mikrotik · cisco · ubiquiti · zte · bgp · ospf · vlan · ftth/gpon', '']],
        [['sistemas  ', 'dim'], ['linux · python · bash · docker · zabbix · grafana', '']],
        [['dev       ', 'dim'], ['java · spring boot · hibernate/jpa · sql · git', '']],
    ];
    const CONTACT = [
        [['email     ', 'dim'], [EMAIL, 'link', 'mailto:' + EMAIL]],
        [['github    ', 'dim'], ['github.com/EmmaBia93', 'link', GITHUB]],
        [['linkedin  ', 'dim'], ['linkedin.com/in/emmabia', 'link', LINKEDIN]],
    ];
    const TRACE = [
        L('traceroute to oportunidades (10.0.0.1), 30 hops max', 'dim'),
        L(' 1  gateway.local (192.168.1.1)    0.4 ms'),
        L(' 2  mikrotik-core (10.10.0.1)      0.9 ms'),
        L(' 3  olt-zte (10.20.0.2)            1.3 ms'),
        L(' 4  oportunidades (10.0.0.1)       1.8 ms', 'ok'),
    ];

   
    const script = [
        { cmd: 'whoami' },
        { out: WHOAMI },
        { cmd: 'cat stack.txt' },
        { out: INTRO_STACK },
        { cmd: 'ls ~/proyectos' },
        { out: PROJECTS },
        { cmd: 'ping -c 3 oportunidades' },
        { out: PING, gap: 420 },
    ];

   
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
    const short = s => (s.length > 30 ? s.slice(0, 30) + '…' : s);
    const browserInfo = () => (window.BrowserInfo ? window.BrowserInfo.collect() : null);

    
    async function fetchWithTimeout(url, ms) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), ms);
        try {
            return await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
        } finally {
            clearTimeout(timer);
        }
    }

    
    async function lookupIP() {
        const sources = [
            { host: 'api64.ipify.org', url: 'https://api64.ipify.org?format=json', parse: async r => (await r.json()).ip },
            { host: 'one.one.one.one', url: 'https://one.one.one.one/cdn-cgi/trace', parse: async r => ((await r.text()).match(/^ip=(.+)$/m) || [])[1] },
        ];
        for (const s of sources) {
            try {
                const r = await fetchWithTimeout(s.url, 3500);
                if (!r.ok) continue;
                const ip = String((await s.parse(r)) || '').trim();
                if (/^[0-9a-f:.]{3,45}$/i.test(ip)) return { ip, host: s.host };
            } catch (e) { /* se prueba con el siguiente servicio */ }
        }
        return null;
    }

    let token = 0;        
    let anchor = null;    
    let engaged = false;  
    const history = [];
    let hIndex = 0;
    let draft = '';

    function scrollDown() { body.scrollTop = body.scrollHeight; }

    function line(segments) {
        const el = document.createElement('div');
        el.className = 't-line';
        (segments || []).forEach(([text, cls, href]) => {
            const node = document.createElement(href ? 'a' : 'span');
            if (href) {
                node.href = href;
                if (/^https?:/.test(href)) { node.target = '_blank'; node.rel = 'noopener'; }
            }
            const classes = [cls ? 't-' + cls : '', href ? 't-link' : ''].filter(Boolean).join(' ');
            if (classes) node.className = classes;
            node.textContent = text;
            el.appendChild(node);
        });
        body.insertBefore(el, anchor);
        scrollDown();
        return el;
    }

    async function print(lines, gap = FAST_GAP) {
        const my = token;
        for (const l of lines) {
            line(l);
            if (!reduce) await sleep(gap);
            if (my !== token) return;
        }
    }

  
    function prompt() {
        const el = line([[USER, 'user'], [':', ''], ['~', 'path'], ['$ ', '']]);
        const typed = document.createElement('span');
        const cursor = document.createElement('span');
        cursor.className = 't-cursor';
        el.append(typed, cursor);
        return { typed, cursor };
    }

   
    function livePrompt() {
        const el = line([[USER, 'user'], [':', ''], ['~', 'path'], ['$', '']]);
        el.classList.add('t-prompt');

        const input = document.createElement('input');
        input.className = 't-input';
        input.type = 'text';
        input.maxLength = MAX_INPUT;
        input.placeholder = 'escribí help…';
        input.setAttribute('aria-label', 'Comando de la terminal');
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('autocapitalize', 'off');
        input.setAttribute('autocorrect', 'off');
        input.setAttribute('spellcheck', 'false');
        input.setAttribute('enterkeyhint', 'send');
        input.addEventListener('keydown', onKeydown);
        input.addEventListener('focus', () => { engaged = true; });
        el.appendChild(input);
        scrollDown();
        return { el, input };
    }

    // ---------- Comandos ----------
    const commands = {
        help: () => print(HELP),
        whoami: () => print(WHOAMI),
        ls: () => print(PROJECTS),
        stack: () => print(STACK),
        contacto: () => print(CONTACT),
        clear: () => { [...body.children].forEach(c => { if (c !== anchor) c.remove(); }); },
        replay: () => run(),

        cat: args => {
            if (!args.length) return print([[['cat: ', 'err'], ['falta el nombre del archivo. Probá: ', ''], ['cat stack.txt', 'dir']]]);
            if (args[0].toLowerCase() === 'stack.txt') return print(STACK);
            return print([[['cat: ', 'err'], [short(args[0]) + ': no existe el archivo o directorio', '']]]);
        },

        ping: args => {
            if (!args.length) return print([[['ping: ', 'err'], ['falta un destino. Probá: ', ''], ['ping oportunidades', 'dir']]]);
            if (args.some(a => a.toLowerCase() === 'oportunidades')) return print(PING, 420);
            return print([
                [['ping: ', 'err'], [short(args[args.length - 1]) + ': fallo temporal en la resolución de nombres', '']],
                L("(solo respondo a 'oportunidades' 😉)", 'dim'),
            ]);
        },

        neofetch: () => {
            const info = browserInfo();
            if (!info) return print([[['neofetch: ', 'err'], ['no pude leer los datos de tu navegador.', '']]]);
            const row = (k, v) => [[k.padEnd(11), 'dir'], [v, '']];
            return print([
                L('visitante@tu-navegador', 'hi'),
                L('----------------------', 'dim'),
                row('SO', info.os),
                row('Navegador', info.browser),
                row('Idioma', info.lang),
                row('Zona', info.tz),
                row('Pantalla', info.screen),
                row('CPU', info.cores),
                row('RAM', info.memory),
                row('Red', info.connection),
                row('Huella', info.fp),
                [['Todo esto lo leí sin pedirte permiso 😉  ', 'dim'], ['Ver más ↓', 'link', '#tu-navegador']],
            ]);
        },

        uname: args => {
            const info = browserInfo();
            if (!info) return print([L('Web')]);
            return print([L(args.includes('-a') ? info.uname : info.os)]);
        },

        myip: async () => {
            const my = token;
            await print([L('Consultando tu IP pública a un servicio externo…', 'dim')]);
            const res = await lookupIP();
            if (my !== token) return;
            if (!res) {
                return print([[['myip: ', 'err'], ['no pude consultarla (sin conexión o un bloqueador de anuncios en el medio).', '']]]);
            }
            return print([
                [['IP pública  ', 'dim'], [res.ip, 'hi']],
                [['Tipo        ', 'dim'], [res.ip.includes(':') ? 'IPv6' : 'IPv4', '']],
                [['Servicio    ', 'dim'], [res.host, '']],
                L('Si usás VPN o proxy, ves la IP de ese servicio y no la de tu casa.', 'dim'),
                L('El dato se muestra solo en tu pantalla: esta página no lo guarda ni lo envía.', 'dim'),
            ]);
        },

        ipcalc: args => {
            if (!window.Subnet) return print([[['ipcalc: ', 'err'], ['no pude cargar la calculadora.', '']]]);
            if (!args.length) {
                return print([
                    [['uso: ', ''], ['ipcalc <ip>/<prefijo>', 'dir']],
                    L('ej: ipcalc 192.168.10.0/26   ·   ipcalc 10.0.0.0 255.0.0.0', 'dim'),
                ]);
            }
            const r = window.Subnet.calc(args.join(' '));
            if (!r.ok) return print([[['ipcalc: ', 'err'], [r.error, '']]]);
            const row = (k, v, cls) => [[k.padEnd(13), 'dim'], [v, cls || '']];
            const lines = [
                row('Dirección', r.ip + '/' + r.cidr, 'hi'),
                row('Máscara', r.mask),
                row('Wildcard', r.wildcard),
                row('Red', r.network),
                row('Broadcast', r.broadcast || 'no aplica'),
                row('Primer host', r.first),
                row('Último host', r.last),
                row('Hosts', window.Subnet.fmt(r.hosts)),
                row('Tipo', r.type),
            ];
            if (r.note) lines.push(L(r.note, 'dim'));
            return print(lines);
        },

       
        nmap: async args => {
            if (!args.length) return print([[['uso: ', ''], ['nmap <objetivo>', 'dir'], ['   (probá: nmap localhost)', 'dim']]]);
            if (!/^(localhost|127\.0\.0\.1|::1)$/i.test(args[args.length - 1])) {
                return print([
                    [['nmap: ', 'err'], ['solo escaneo localhost, que de eso no se enoja nadie 😄', '']],
                    L('(esto es un juego: no se escanea nada de verdad)', 'dim'),
                ]);
            }
            const port = (p, state, svc, note) => {
                const cls = state === 'open' ? 'ok' : state === 'closed' ? 'err' : 'dim';
                return [[p.padEnd(10), ''], [state.padEnd(9), cls], [svc.padEnd(6), ''], [note, 'dim']];
            };
            return print([
                L('Starting Nmap a las ' + new Date().toTimeString().slice(0, 5), 'dim'),
                L('Nmap scan report for localhost (127.0.0.1)'),
                L('Host is up (0.00012s latency).', 'dim'),
                L('PORT      STATE    SVC   NOTA', 'hi'),
                port('22/tcp', 'closed', 'ssh', 'nada acá'),
                port('80/tcp', 'open', 'http', 'mi sitio'),
                port('443/tcp', 'open', 'https', 'TLS ok'),
                port('3389/tcp', 'filtered', 'rdp', 'ni lo intentes'),
                port('31337/tcp', 'open', 'elite', '¿hacker? 😎'),
                L('Nmap done: 1 IP address (1 host up) scanned in 0.07 seconds'),
                L('(simulado: no se escaneó nada de tu equipo)', 'dim'),
            ], 220);
        },

        curl: args => {
            if (!args.length) return print([[['curl: ', 'err'], ["try 'curl --help' for more information", '']]]);
            if (/ifconfig|icanhazip|ipify|ipinfo|checkip/i.test(args.join(' '))) return commands.myip();
            return print([[['curl: ', 'err'], ['(6) Could not resolve host: ' + short(args[args.length - 1]), '']]]);
        },

        traceroute: args => {
            if (!args.length || args.some(a => a.toLowerCase() === 'oportunidades')) return print(TRACE, 450);
            return print([[['traceroute: ', 'err'], [short(args[args.length - 1]) + ': fallo temporal en la resolución de nombres', '']]]);
        },

        sudo: async args => {
            if (!args.length) return print([[['uso: ', ''], ['sudo <comando>', 'dir']]]);
            if (/hire|contrat/i.test(args.join(' '))) {
                await print([L('[sudo] contraseña para visitante: ********', 'dim')], 700);
                await print([
                    L('✔ Permisos concedidos. Buena decisión.', 'ok'),
                    [['→ Escribime a ', ''], [EMAIL, 'link', 'mailto:' + EMAIL]],
                ], 450);
                return;
            }
            return print([[['visitante no está en el archivo sudoers. ', 'err'], ['Este incidente será reportado. 🙂', 'dim']]]);
        },

        rm: () => print([
            [['rm: ', 'err'], ["no se puede borrar '/': permiso denegado", '']],
            L('Buen intento 😄  Hago backups, tranquilo.', 'dim'),
        ], 350),
    };

    const ALIASES = {
        contact: 'contacto', mail: 'contacto', email: 'contacto',
        proyectos: 'ls', projects: 'ls', ll: 'ls', dir: 'ls',
        ayuda: 'help', '?': 'help', cls: 'clear', tracert: 'traceroute',
        ifconfig: 'myip', neo: 'neofetch', fastfetch: 'neofetch', screenfetch: 'neofetch',
        subnet: 'ipcalc', subred: 'ipcalc', calc: 'ipcalc',
    };
    const COMPLETABLE = ['help', 'whoami', 'ls', 'stack', 'contacto', 'neofetch', 'myip', 'uname', 'ipcalc', 'ping', 'clear', 'replay'];

    async function execute(text) {
        const parts = text.split(/\s+/);
        let name = parts[0].toLowerCase();
        if (own(ALIASES, name)) name = ALIASES[name];
        if (!own(commands, name)) {
            return print([[['bash: ', 'err'], [short(parts[0]) + ': comando no encontrado. Escribí ', ''], ['help', 'dir'], ['.', '']]]);
        }
        return commands[name](parts.slice(1));
    }


    function onKeydown(e) {
        const input = e.currentTarget;

        if (e.key === 'Enter') {
            if (e.isComposing) return;
            e.preventDefault();
            submit(input);
            return;
        }

        if (e.key === 'ArrowUp') {
            if (!history.length) return;
            e.preventDefault();
            if (hIndex === history.length) draft = input.value;
            hIndex = Math.max(0, hIndex - 1);
            input.value = history[hIndex];
            input.setSelectionRange(input.value.length, input.value.length);
            return;
        }

        if (e.key === 'ArrowDown') {
            if (hIndex >= history.length) return;
            e.preventDefault();
            hIndex++;
            input.value = hIndex === history.length ? draft : history[hIndex];
            input.setSelectionRange(input.value.length, input.value.length);
            return;
        }

        if (e.key === 'Tab') {
           
            if (!v || /\s/.test(v)) return;
            const matches = COMPLETABLE.filter(c => c.startsWith(v));
            if (matches.length === 1) {
                e.preventDefault();
                input.value = matches[0];
            }
            return;
        }

        if (e.ctrlKey && e.key.toLowerCase() === 'l') {
            e.preventDefault();
            const mine = input.closest('.t-line');
            [...body.children].forEach(c => { if (c !== mine) c.remove(); });
        }
    }

    async function submit(input) {
        const raw = input.value.slice(0, MAX_INPUT);
        const text = raw.trim();

       
        const frozen = document.createElement('span');
        frozen.className = 't-cmd';
        frozen.textContent = raw;
        input.replaceWith(frozen);

        if (text) {
            if (history[history.length - 1] !== text) history.push(text);
        }
        hIndex = history.length;
        draft = '';

        anchor = null;
        const next = livePrompt();
        const my = token;

        if (text) {
            next.el.classList.add('is-busy');
            next.input.readOnly = true;
            anchor = next.el;
        }
        if (engaged) next.input.focus({ preventScroll: true });

        if (text) {
            await execute(text);
            if (my !== token) return; 
            anchor = null;
            next.el.classList.remove('is-busy');
            next.input.readOnly = false;
            scrollDown();
        }
    }

    
    async function run() {
        const mine = ++token;
        anchor = null;
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

        if (mine !== token) return;
        line(L("Escribí 'help' para ver los comandos disponibles.", 'dim'));
        const p = livePrompt();
        if (engaged) p.input.focus({ preventScroll: true });
    }

   
    term.addEventListener('click', e => {
        if (e.target.closest('a')) return;
        if (window.getSelection && String(window.getSelection())) return;
        engaged = true;
        const input = body.querySelector('.t-input');
        if (input) input.focus({ preventScroll: true });
    });


    const io = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
            io.disconnect();
            setTimeout(run, reduce ? 0 : 500);
        }
    }, { threshold: 0.3 });
    io.observe(term);
})();