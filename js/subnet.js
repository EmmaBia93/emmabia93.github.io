/* ==========================================================
   subnet.js — Calculadora CIDR IPv4
   Compatible con #sn-form, #sn-input, #sn-result y .sn-chip
   No necesita librerías externas.
   ========================================================== */

(() => {
    "use strict";

    const form = document.getElementById("sn-form");
    const input = document.getElementById("sn-input");
    const result = document.getElementById("sn-result");

    if (!form || !input || !result) return;

    const UINT32_MAX = 0xFFFFFFFF;

    const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);

    function ipToNumber(ip) {
        const parts = ip.split(".");
        if (parts.length !== 4) throw new Error("La dirección IPv4 debe tener cuatro octetos.");

        const octets = parts.map((part) => {
            if (!/^\d{1,3}$/.test(part)) throw new Error("La dirección IP contiene un octeto inválido.");
            const value = Number(part);
            if (value < 0 || value > 255) throw new Error("Cada octeto debe estar entre 0 y 255.");
            return value;
        });

        return (
            ((octets[0] << 24) >>> 0) +
            (octets[1] << 16) +
            (octets[2] << 8) +
            octets[3]
        ) >>> 0;
    }

    function numberToIP(number) {
        const value = number >>> 0;
        return [
            (value >>> 24) & 255,
            (value >>> 16) & 255,
            (value >>> 8) & 255,
            value & 255
        ].join(".");
    }

    function prefixToMask(prefix) {
        if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
            throw new Error("El prefijo CIDR debe estar entre /0 y /32.");
        }
        if (prefix === 0) return 0;
        return (UINT32_MAX << (32 - prefix)) >>> 0;
    }

    function maskToPrefix(mask) {
        const bits = mask.toString(2).padStart(32, "0");
        if (!/^1*0*$/.test(bits)) {
            throw new Error("La máscara no es válida: los bits en 1 deben ser consecutivos.");
        }
        return bits.indexOf("0") === -1 ? 32 : bits.indexOf("0");
    }

    function parseInput(raw) {
        const value = raw.trim();
        if (!value) throw new Error("Ingresá una dirección IPv4 y su prefijo o máscara.");

        let ip;
        let prefix;

        if (value.includes("/")) {
            const parts = value.split("/");
            if (parts.length !== 2 || !parts[1].trim()) {
                throw new Error("Formato inválido. Ejemplo: 192.168.10.10/24.");
            }
            ip = parts[0].trim();
            const suffix = parts[1].trim();

            if (/^\d{1,2}$/.test(suffix)) {
                prefix = Number(suffix);
                if (prefix < 0 || prefix > 32) throw new Error("El prefijo debe estar entre /0 y /32.");
            } else {
                prefix = maskToPrefix(ipToNumber(suffix));
            }
        } else {
            const parts = value.split(/\s+/);
            if (parts.length === 1) {
                throw new Error("Indicá también la máscara. Ejemplo: 192.168.10.10/24.");
            }
            if (parts.length !== 2) throw new Error("Formato inválido. Usá IP/prefijo o IP máscara.");
            ip = parts[0];
            prefix = /^\d{1,2}$/.test(parts[1])
                ? Number(parts[1])
                : maskToPrefix(ipToNumber(parts[1]));
        }

        if (prefix < 0 || prefix > 32) throw new Error("El prefijo debe estar entre /0 y /32.");

        const ipNumber = ipToNumber(ip);
        const mask = prefixToMask(prefix);
        const wildcard = (~mask) >>> 0;
        const network = (ipNumber & mask) >>> 0;
        const broadcast = (network | wildcard) >>> 0;
        const total = 2 ** (32 - prefix);

        // /31 se utiliza habitualmente en enlaces punto a punto (RFC 3021).
        // /32 representa una única dirección.
        let firstHost;
        let lastHost;
        let usable;

        if (prefix === 32) {
            firstHost = network;
            lastHost = network;
            usable = 1;
        } else if (prefix === 31) {
            firstHost = network;
            lastHost = broadcast;
            usable = 2;
        } else {
            firstHost = network + 1;
            lastHost = broadcast - 1;
            usable = Math.max(total - 2, 0);
        }

        return {
            ip,
            ipNumber,
            prefix,
            mask,
            wildcard,
            network,
            broadcast,
            firstHost,
            lastHost,
            total,
            usable
        };
    }

    function binaryOctets(number) {
        return numberToIP(number)
            .split(".")
            .map((octet) => Number(octet).toString(2).padStart(8, "0"));
    }

    function binaryRow(label, number, prefix, isMask = false) {
        const octets = binaryOctets(number);
        let bitIndex = 0;

        const markup = octets.map((octet) => {
            const bits = [...octet].map((bit) => {
                const isNetworkBit = isMask ? bit === "1" : bitIndex < prefix;
                bitIndex += 1;
                return `<span class="${isNetworkBit ? "n" : "h"}">${bit}</span>`;
            }).join("");
            return `<span>${bits}</span>`;
        }).join('<span class="h">.</span>');

        return `<div><span class="lbl">${label}</span><span>${markup}</span></div>`;
    }

    function formatCount(number) {
        return new Intl.NumberFormat("es-AR").format(number);
    }

    function infoItem(label, value, copyValue = value) {
        return `
            <div class="sn-info">
                <span>${label}</span>
                <strong>${escapeHTML(value)}</strong>
                <button type="button" class="sn-copy" data-copy="${escapeHTML(copyValue)}" aria-label="Copiar ${label}" title="Copiar">Copiar</button>
            </div>`;
    }

    function render(data) {
        const {
            ip, prefix, mask, wildcard, network, broadcast,
            firstHost, lastHost, total, usable
        } = data;

        const hostRange = prefix === 32
            ? numberToIP(firstHost)
            : `${numberToIP(firstHost)} – ${numberToIP(lastHost)}`;

        const specialNote = prefix === 31
            ? "Prefijo /31: ambos extremos se consideran utilizables en enlaces punto a punto (RFC 3021)."
            : prefix === 32
                ? "Prefijo /32: representa una única dirección IPv4."
                : prefix === 0
                    ? "Prefijo /0: abarca todo el espacio de direcciones IPv4."
                    : "En esta subred, la primera dirección identifica la red y la última es el broadcast.";

        result.innerHTML = `
            <div class="sn-output">
                <div class="sn-output-head">
                    <div>
                        <span class="sn-kicker">Resultado del cálculo</span>
                        <h3>${escapeHTML(numberToIP(network))}/${prefix}</h3>
                        <p>La IP ingresada ${escapeHTML(ip)} pertenece a esta subred.</p>
                    </div>
                    <span class="sn-prefix">/${prefix}</span>
                </div>

                <div class="sn-results-grid">
                    ${infoItem("Dirección IP ingresada", ip, ip)}
                    ${infoItem("Dirección de red", numberToIP(network))}
                    ${infoItem("Broadcast", numberToIP(broadcast))}
                    ${infoItem("Máscara de subred", numberToIP(mask))}
                    ${infoItem("Wildcard", numberToIP(wildcard))}
                    ${infoItem("Primer host", numberToIP(firstHost))}
                    ${infoItem("Último host", numberToIP(lastHost))}
                    ${infoItem("Rango de hosts", hostRange, hostRange)}
                    ${infoItem("Direcciones totales", formatCount(total), String(total))}
                    ${infoItem("Hosts utilizables", formatCount(usable), String(usable))}
                </div>

                <p class="sn-note">${specialNote}</p>

                <div class="sn-bin">
                    <div class="sn-bin-title">Representación binaria</div>
                    ${binaryRow("IP", data.ipNumber, prefix)}
                    ${binaryRow("Máscara", mask, prefix, true)}
                    ${binaryRow("Red", network, prefix)}
                    <div class="sn-legend">
                        <span class="n">●</span> Bits de red
                        <span class="h">●</span> Bits de host
                    </div>
                </div>
            </div>`;

        result.querySelectorAll(".sn-copy").forEach((button) => {
            button.addEventListener("click", async () => {
                const value = button.dataset.copy;
                try {
                    await navigator.clipboard.writeText(value);
                    const previous = button.textContent;
                    button.textContent = "Copiado";
                    button.classList.add("is-copied");
                    window.setTimeout(() => {
                        button.textContent = previous;
                        button.classList.remove("is-copied");
                    }, 1200);
                } catch {
                    button.textContent = "No disponible";
                }
            });
        });
    }

    function calculate() {
        input.removeAttribute("aria-invalid");

        try {
            const data = parseInput(input.value);
            render(data);
        } catch (error) {
            input.setAttribute("aria-invalid", "true");
            result.innerHTML = `<p class="sn-error" role="alert">${escapeHTML(error.message)}</p>`;
        }
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        calculate();
    });

    // Calcula mientras se escribe, sin esperar a enviar el formulario.
    input.addEventListener("input", calculate);

    // Los ejemplos cargan el valor y ejecutan el cálculo.
    document.querySelectorAll(".sn-chip[data-v]").forEach((chip) => {
        chip.addEventListener("click", () => {
            input.value = chip.dataset.v;
            calculate();
            input.focus();
        });
    });

    // Cálculo inicial.
    calculate();
})();
