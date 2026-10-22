/**
 * Bibliotech - Animaciones de la landing.
 *  - Revela los elementos con la clase .bt-reveal al entrar en pantalla.
 *  - Escribe el año actual en el footer (#btYear).
 * Es puramente visual: no afecta la lógica de sesión ni de roles.
 */
document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    // 1) Año dinámico en el copyright.
    var yearEl = document.getElementById('btYear');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    var revealItems = document.querySelectorAll('.bt-reveal');

    // 2) Si el navegador no soporta IntersectionObserver, mostramos todo.
    if (!('IntersectionObserver' in window)) {
        revealItems.forEach(function (el) { el.classList.add('is-visible'); });
        return;
    }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealItems.forEach(function (el) { observer.observe(el); });
});
