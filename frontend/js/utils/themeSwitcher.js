/**
 * Bibliotech - Selector de tema (bosque / cuero).
 *
 * Aplica el tema guardado en localStorage ANTES de que se pinte la página
 * (para evitar el "flash" del tema por defecto) y expone un botón que alterna
 * entre los temas disponibles. El tema se marca como [data-theme] en <html>.
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'bibliotech-theme';
    const THEMES = [
        { id: 'oceano',  label: 'Océano' },
        { id: 'celeste', label: 'Celeste' }
    ];
    const DEFAULT_THEME = 'oceano';

    function isValidTheme(id) {
        return THEMES.some(function (t) { return t.id === id; });
    }

    function getSavedTheme() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return isValidTheme(saved) ? saved : DEFAULT_THEME;
        } catch (e) {
            return DEFAULT_THEME;
        }
    }

    function applyTheme(id) {
        document.documentElement.setAttribute('data-theme', id);
    }

    function saveTheme(id) {
        try { localStorage.setItem(STORAGE_KEY, id); } catch (e) { /* ignora */ }
    }

    // 1) Aplicar cuanto antes (el <script> va en el <head>).
    applyTheme(getSavedTheme());

    // 2) Al cargar el DOM, crear los botones de tema donde se pidan.
    document.addEventListener('DOMContentLoaded', function () {
        const containers = document.querySelectorAll('[data-theme-toggle]');
        containers.forEach(function (container) {
            THEMES.forEach(function (theme) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'w3-bar-item w3-button bt-theme-toggle';
                btn.textContent = theme.label;
                btn.title = 'Cambiar al tema ' + theme.label;
                btn.addEventListener('click', function () {
                    applyTheme(theme.id);
                    saveTheme(theme.id);
                    highlightActive(container);
                });
                container.appendChild(btn);
            });
            highlightActive(container);
        });
    });

    function highlightActive(container) {
        const current = document.documentElement.getAttribute('data-theme');
        container.querySelectorAll('.bt-theme-toggle').forEach(function (btn) {
            const label = btn.textContent.toLowerCase();
            const isActive = THEMES.some(function (t) {
                return t.id === current && t.label.toLowerCase() === label;
            });
            btn.classList.toggle('is-active', isActive);
        });
    }

    window.BibliotechTheme = {
        themes: THEMES,
        get: getSavedTheme,
        set: function (id) { if (isValidTheme(id)) { applyTheme(id); saveTheme(id); } }
    };
})();
