// Terminal del hero: presentación animada + comandos que el visitante puede escribir
(function () {
    const term = document.getElementById('terminal');
    const body = document.getElementById('term-body');
    if (!term || !body) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const USER = 'emmanuel@noc';
    const TYPE_SPEED = 45;   // ms por carácter al tipear la presentación
    const LINE_GAP = 130;    // ms entre líneas de la presentación
    const FAST_GAP = 45;     // ms entre líneas en la salida de los comandos
    const MAX_INPUT = 60;    // largo máximo de lo que se puede escribir

    const EMAIL = 'emmabia2013@gmail.com';
    const GITHUB = 'https://github.com/EmmaBia93';
    const LINKEDIN = 'https://www.linkedin.com/in/emmabia/';

    // Una línea = lista de segmentos [texto, clase, enlace opcional]
    // Clases: hi, dim, dir, ok, err, link
    const L = (text, cls, href) => [[text, cls, href]];

    // ---------- Contenido ----------
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

    // Guion de la presentación inicial. cmd = comando que se tipea, out = líneas de salida
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

    // ---------- Utilidades ----------
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
    const short = s => (s.length > 30 ? s.slice(0, 30) + '…' : s);

    let token = 0;        // permite cancelar una ejecución en curso (por ejemplo, al hacer replay)
    let anchor = null;    // mientras corre un comando, la salida se inserta antes de este prompt
    let engaged = false;  // el visitante ya interactuó con la terminal
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
                if (!href.startsWith('mailto:')) { node.target = '_blank'; node.rel = 'noopener'; }
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

    // Prompt que se "tipea" solo (presentación)
    function prompt() {
        const el = line([[USER, 'user'], [':', ''], ['~', 'path'], ['$ ', '']]);
        const typed = document.createElement('span');
        const cursor = document.createElement('span');
        cursor.className = 't-cursor';
        el.append(typed, cursor);
        return { typed, cursor };
    }

    // Prompt interactivo: una línea con un <input> donde el visitante escribe
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

        // --- comandos ocultos ---
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
    };
    const COMPLETABLE = ['help', 'whoami', 'ls', 'stack', 'contacto', 'ping', 'clear', 'replay'];

    async function execute(text) {
        const parts = text.split(/\s+/);
        let name = parts[0].toLowerCase();
        if (own(ALIASES, name)) name = ALIASES[name];
        if (!own(commands, name)) {
            return print([[['bash: ', 'err'], [short(parts[0]) + ': comando no encontrado. Escribí ', ''], ['help', 'dir'], ['.', '']]]);
        }
        return commands[name](parts.slice(1));
    }

    // ---------- Entrada del teclado ----------
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
            // solo se intercepta si hay un único comando que completar (así no se bloquea la navegación con Tab)
            const v = input.value.toLowerCase();
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

        // la línea escrita queda "congelada" como texto
        const frozen = document.createElement('span');
        frozen.className = 't-cmd';
        frozen.textContent = raw;
        input.replaceWith(frozen);

        if (text) {
            if (history[history.length - 1] !== text) history.push(text);
        }
        hIndex = history.length;
        draft = '';

        // El siguiente prompt se crea enseguida (dentro del mismo evento del teclado), oculto y de solo lectura
        // mientras corre el comando, para que el foco no se pierda (importante en celulares).
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
            if (my !== token) return; // se hizo replay: la presentación se encarga del resto
            anchor = null;
            next.el.classList.remove('is-busy');
            next.input.readOnly = false;
            scrollDown();
        }
    }

    // ---------- Presentación ----------
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

    // Un clic en la terminal enfoca la línea de comandos (sin molestar si se está seleccionando texto)
    term.addEventListener('click', e => {
        if (e.target.closest('a')) return;
        if (window.getSelection && String(window.getSelection())) return;
        engaged = true;
        const input = body.querySelector('.t-input');
        if (input) input.focus({ preventScroll: true });
    });

    // Arranca apenas se ve la terminal
    const io = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
            io.disconnect();
            setTimeout(run, reduce ? 0 : 500);
        }
    }, { threshold: 0.3 });
    io.observe(term);
})();