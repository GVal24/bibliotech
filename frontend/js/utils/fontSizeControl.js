/**
 * Bibliotech - Control de tamaño de fuente (accesibilidad).
 *
 * Pensado para personas con baja visión: permite agrandar o achicar el texto
 * de toda la página. Igual que el selector de tema, guarda la preferencia en
 * localStorage y la aplica lo antes posible para evitar parpadeos.
 *
 * Implementación: se aplica `zoom` al <body>, lo que escala de forma uniforme
 * TODO el contenido (incluidos los componentes de W3.CSS, que fijan tamaños en
 * píxeles y no se ajustarían solo cambiando el font-size raíz).
 *
 * El valor activo se marca como [data-fontscale] en <html>.
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'bibliotech-fontscale';
    const STEPS = [
        { id: 'sm',   label: 'A−',  title: 'Reducir el tamaño del texto', zoom: 0.9 },
        { id: 'base', label: 'A',   title: 'Tamaño de texto normal',      zoom: 1.0 },
        { id: 'lg',   label: 'A+',  title: 'Aumentar el tamaño del texto', zoom: 1.15 },
        { id: 'xl',   label: 'A++', title: 'Aumentar mucho el texto',      zoom: 1.3 }
    ];
    const DEFAULT_STEP = 'base';

    function isValidStep(id) {
        return STEPS.some(function (s) { return s.id === id; });
    }

    function getSavedStep() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return isValidStep(saved) ? saved : DEFAULT_STEP;
        } catch (e) {
            return DEFAULT_STEP;
        }
    }

    function getZoom(id) {
        const step = STEPS.find(function (s) { return s.id === id; });
        return step ? step.zoom : 1.0;
    }

    function applyStep(id) {
        const zoom = getZoom(id);
        document.documentElement.setAttribute('data-fontscale', id);
        document.body.style.zoom = zoom;
    }

    function saveStep(id) {
        try { localStorage.setItem(STORAGE_KEY, id); } catch (e) { /* ignora */ }
    }

    // 1) Aplicar cuanto antes (el <script> va en el <head>, el body todavía
    //    no existe, así que esperamos a que el DOM esté listo).
    document.addEventListener('DOMContentLoaded', function () {
        applyStep(getSavedStep());

        // 2) Crear los botones donde se pidan.
        const containers = document.querySelectorAll('[data-fontsize-toggle]');
        containers.forEach(function (container) {
            const label = document.createElement('span');
            label.className = 'bt-fontsize-label';
            label.textContent = 'Texto';
            container.appendChild(label);

            STEPS.forEach(function (step) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'w3-bar-item w3-button bt-fontsize-toggle';
                btn.textContent = step.label;
                btn.title = step.title;
                btn.setAttribute('aria-label', step.title);
                btn.addEventListener('click', function () {
                    applyStep(step.id);
                    saveStep(step.id);
                    highlightActive(container);
                });
                container.appendChild(btn);
            });
            highlightActive(container);
        });
    });

    function highlightActive(container) {
        const current = document.documentElement.getAttribute('data-fontscale');
        container.querySelectorAll('.bt-fontsize-toggle').forEach(function (btn) {
            const isActive = STEPS.some(function (s) {
                return s.id === current && btn.textContent === s.label;
            });
            btn.classList.toggle('is-active', isActive);
        });
    }

    window.BibliotechFontSize = {
        steps: STEPS,
        get: getSavedStep,
        set: function (id) { if (isValidStep(id)) { applyStep(id); saveStep(id); } }
    };
})();
