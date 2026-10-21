/**
 * Bibliotech - Control de tamaño de fuente (accesibilidad).
 *
 * Pensado para personas con baja visión. Muestra un ícono de accesibilidad en
 * el navbar; al presionarlo se despliega un panel con un deslizador para
 * agrandar el texto de todo el sitio hasta el 200%.
 *
 * Igual que el selector de tema, guarda la preferencia en localStorage y la
 * aplica lo antes posible para evitar parpadeos.
 *
 * Implementación: se aplica `zoom` al <body>, lo que escala de forma uniforme
 * TODO el contenido (incluidos los componentes de W3.CSS, que fijan tamaños en
 * píxeles y no se ajustarían solo cambiando el font-size raíz).
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'bibliotech-fontscale';
    const MIN = 100;   // %
    const MAX = 200;   // %
    const STEP = 10;   // %
    const DEFAULT = 100;

    // ---------- Estado ----------
    function clamp(value) {
        const n = parseInt(value, 10);
        if (isNaN(n)) return DEFAULT;
        return Math.min(MAX, Math.max(MIN, n));
    }

    function getSaved() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved != null ? clamp(saved) : DEFAULT;
        } catch (e) {
            return DEFAULT;
        }
    }

    function apply(value) {
        const percent = clamp(value);
        document.body.style.zoom = percent / 100;
        document.documentElement.setAttribute('data-fontscale', percent);
    }

    function save(value) {
        try { localStorage.setItem(STORAGE_KEY, clamp(value)); } catch (e) { /* ignora */ }
    }

    // ---------- Render ----------
    // Ícono estándar de accesibilidad (persona con brazos abiertos).
    const ICON_SVG =
        '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">' +
        '<circle cx="12" cy="4" r="2"/>' +
        '<path d="M12 7c-2.6 0-4.7-.4-6.5-1a1 1 0 1 0-.7 1.9c1.3.4 2.7.8 4.2 1v3.1l-1.8 5.5a1 1 0 1 0 1.9.6L11 13h2l1.9 5.1a1 1 0 1 0 1.9-.6L15 12V8.9c1.5-.2 2.9-.6 4.2-1a1 1 0 0 0-.7-1.9c-1.8.6-3.9 1-6.5 1z"/>' +
        '</svg>';

    function buildControl(container) {
        container.classList.add('bt-a11y');

        // W3.CSS le pone overflow:hidden a .w3-bar, lo que recortaría el panel
        // desplegable. Permitimos que la barra muestre contenido desbordado.
        const bar = container.closest('.w3-bar');
        if (bar) bar.classList.add('bt-bar-overflow');

        // Botón-ícono
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'w3-button bt-a11y-btn';
        toggle.title = 'Opciones de accesibilidad';
        toggle.setAttribute('aria-label', 'Opciones de accesibilidad');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.innerHTML = ICON_SVG;

        // Panel desplegable
        const panel = document.createElement('div');
        panel.className = 'bt-a11y-panel';
        panel.setAttribute('role', 'group');
        panel.setAttribute('aria-label', 'Tamaño del texto');

        const row = document.createElement('div');
        row.className = 'bt-a11y-row';

        const reduceBtn = document.createElement('button');
        reduceBtn.type = 'button';
        reduceBtn.className = 'w3-button bt-a11y-step';
        reduceBtn.textContent = 'A-';
        reduceBtn.title = 'Reducir el tamaño del texto';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'bt-a11y-slider';
        slider.min = String(MIN);
        slider.max = String(MAX);
        slider.step = String(STEP);
        slider.value = String(getSaved());
        slider.setAttribute('aria-label', 'Porcentaje del tamaño del texto');

        const increaseBtn = document.createElement('button');
        increaseBtn.type = 'button';
        increaseBtn.className = 'w3-button bt-a11y-step';
        increaseBtn.textContent = 'A+';
        increaseBtn.title = 'Aumentar el tamaño del texto';

        const valueLabel = document.createElement('span');
        valueLabel.className = 'bt-a11y-value';

        const resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.className = 'w3-button bt-a11y-reset';
        resetBtn.textContent = 'Restablecer';
        resetBtn.title = 'Volver al tamaño normal (100%)';

        row.append(reduceBtn, slider, increaseBtn, valueLabel);
        panel.append(row, resetBtn);
        container.append(toggle, panel);

        // ---------- Interacción ----------
        function setValue(value, fromSlider) {
            const percent = clamp(value);
            apply(percent);
            save(percent);
            if (!fromSlider) slider.value = String(percent);
            valueLabel.textContent = percent + '%';
            toggle.classList.toggle('is-active', percent !== DEFAULT);
        }

        toggle.addEventListener('click', function (e) {
            e.stopPropagation();
            const open = panel.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });

        // Cerrar al hacer click fuera
        document.addEventListener('click', function (e) {
            if (!container.contains(e.target)) {
                panel.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
        // Cerrar con Escape
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                panel.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });

        slider.addEventListener('input', function () {
            setValue(slider.value, true);
        });
        reduceBtn.addEventListener('click', function () {
            setValue(getSaved() - STEP, false);
        });
        increaseBtn.addEventListener('click', function () {
            setValue(getSaved() + STEP, false);
        });
        resetBtn.addEventListener('click', function () {
            setValue(DEFAULT, false);
        });

        // Valor inicial
        valueLabel.textContent = getSaved() + '%';
    }

    // 1) Aplicar cuanto antes posible (esperando al DOM para tocar <body>).
    document.addEventListener('DOMContentLoaded', function () {
        apply(getSaved());

        // 2) Crear el control donde se pida.
        const containers = document.querySelectorAll('[data-fontsize-toggle]');
        containers.forEach(buildControl);
    });

    window.BibliotechFontSize = {
        min: MIN,
        max: MAX,
        get: getSaved,
        set: function (v) { apply(v); save(v); }
    };
})();
