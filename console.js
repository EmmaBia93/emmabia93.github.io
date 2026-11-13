
(function () {
    if (!window.console || typeof console.log !== 'function') return;

    const art = [
        '  ┌────────────────────────────────┐',
        '  │  emmanuel@noc:~$ ./hola.sh     │',
        '  └────────────────────────────────┘',
    ].join('\n');

    console.log('%c' + art, 'color:#38bdf8;font-family:monospace;font-size:12px;line-height:1.4');
    console.log(
        '%c ¿Mirando el código? Eso me gusta. ',
        'color:#fff;background:#6366f1;font-size:14px;font-weight:700;padding:4px 8px;border-radius:6px'
    );
    console.log(
        '%cSoy Emmanuel, administrador de redes en San Juan. Si algo de esto te sirve, escribime: emmabia2013@gmail.com',
        'color:#9fb0cf;font-size:12px'
    );
    console.log(
        '%cPista: escribí %ccontacto()%c y apretá Enter.',
        'color:#9fb0cf;font-size:12px',
        'color:#38bdf8;font-family:monospace;font-size:12px;font-weight:700',
        'color:#9fb0cf;font-size:12px'
    );

    // Función disponible en la consola: contacto()
    window.contacto = function () {
        console.log('%cemail     %cemmabia2013@gmail.com', 'color:#9fb0cf', 'color:#e8eefc');
        console.log('%cgithub    %chttps://github.com/EmmaBia93', 'color:#9fb0cf', 'color:#e8eefc');
        console.log('%clinkedin  %chttps://www.linkedin.com/in/emmabia/', 'color:#9fb0cf', 'color:#e8eefc');
        return 'ping oportunidades → 0% packet loss ✔';
    };
})();