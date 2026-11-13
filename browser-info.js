
(function () {
    const NA = 'no lo expone tu navegador';

    function parseUA(ua) {
        let name = 'Desconocido';
        let ver = '';
        let m;
        if ((m = ua.match(/\bEdg(?:e|A|iOS)?\/([\d.]+)/))) { name = 'Edge'; ver = m[1]; }
        else if ((m = ua.match(/\bOPR\/([\d.]+)/))) { name = 'Opera'; ver = m[1]; }
        else if ((m = ua.match(/\bSamsungBrowser\/([\d.]+)/))) { name = 'Samsung Internet'; ver = m[1]; }
        else if ((m = ua.match(/\b(?:Firefox|FxiOS)\/([\d.]+)/))) { name = 'Firefox'; ver = m[1]; }
        else if ((m = ua.match(/\b(?:Chrome|CriOS)\/([\d.]+)/))) { name = 'Chrome'; ver = m[1]; }
        else if ((m = ua.match(/Version\/([\d.]+).*Safari/))) { name = 'Safari'; ver = m[1]; }

        let os = 'Desconocido';
        if (/Windows/.test(ua)) os = 'Windows';
        else if (/Android/.test(ua)) os = 'Android';          
        else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
        else if (/Mac OS X|Macintosh/.test(ua)) os = 'macOS';
        else if (/CrOS/.test(ua)) os = 'ChromeOS';
        else if (/Linux|X11/.test(ua)) os = 'Linux';

        return { name, major: ver.split('.')[0], os };
    }


    function hash(str) {
        let h = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 0x01000193) >>> 0;
        }
        return h.toString(16).padStart(8, '0');
    }

    function collect() {
        const nav = navigator;
        const ua = nav.userAgent || '';
        const p = parseUA(ua);
        if (nav.brave) p.name = 'Brave';

        const uaData = nav.userAgentData;
        const os = (uaData && uaData.platform) || p.os;
        const browser = p.name + (p.major ? ' ' + p.major : '');

        const langs = nav.languages && nav.languages.length ? Array.from(nav.languages) : [nav.language || '—'];
        const lang = langs[0] + (langs.length > 1 ? ' (+' + (langs.length - 1) + ')' : '');

        let tz = '—';
        try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '—'; } catch (e) { /* sin Intl */ }

        const sw = screen.width, sh = screen.height;
        const dpr = Math.round((window.devicePixelRatio || 1) * 100) / 100;

        const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
        const connection = conn && conn.effectiveType
            ? conn.effectiveType.toUpperCase() + (conn.downlink ? ' · ~' + conn.downlink + ' Mbps' : '')
            : NA;

        const dark = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const privacy = nav.globalPrivacyControl === true || nav.doNotTrack === '1' || window.doNotTrack === '1';
        const touch = nav.maxTouchPoints || 0;

        const fp = hash([
            ua, langs.join(','), tz, sw, sh, screen.colorDepth, dpr,
            nav.hardwareConcurrency, nav.deviceMemory, touch,
        ].join('|'));

        return {
            browser,
            os,
            lang,
            tz,
            screen: sw + '×' + sh + ' @' + dpr + 'x',
            viewport: window.innerWidth + '×' + window.innerHeight,
            cores: nav.hardwareConcurrency ? nav.hardwareConcurrency + ' núcleos lógicos' : NA,
            memory: nav.deviceMemory ? '≈ ' + nav.deviceMemory + ' GB' : NA,
            connection,
            theme: dark ? 'oscuro' : 'claro',
            privacy: privacy ? 'activada (DNT/GPC)' : 'no activada',
            input: touch > 0 ? 'pantalla táctil (' + touch + ' puntos)' : 'mouse y teclado',
            fp,
            uname: [os, p.name.toLowerCase().replace(/\s+/g, '-') + (p.major ? '-' + p.major : ''), langs[0], sw + 'x' + sh, 'GNU/Web'].join(' '),
        };
    }

    window.BrowserInfo = { collect };


    const cells = document.querySelectorAll('[data-k]');
    if (!cells.length) return;

    const info = collect();
    cells.forEach(el => {
        const v = info[el.dataset.k];
        if (v !== undefined) el.textContent = v;
    });

    
    window.addEventListener('resize', () => {
        document.querySelectorAll('[data-k="viewport"]').forEach(el => {
            el.textContent = window.innerWidth + '×' + window.innerHeight;
        });
    });
})();