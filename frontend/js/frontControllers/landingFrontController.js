/**
 * Bibliotech - Controlador de la página de inicio (landing).
 * Ajusta la barra superior según haya sesión activa y redirige
 * a cada rol a su panel correspondiente.
 */
document.addEventListener('DOMContentLoaded', initLanding);

function initLanding() {
    const token = authHelper.getToken();
    const role = localStorage.getItem('role');

    const loginLink = document.getElementById('loginLink');
    const registerLink = document.getElementById('registerLink');
    const dashboardLink = document.getElementById('dashboardLink');
    const logoutBtn = document.getElementById('logoutBtn');

    if (!token) {
        return;
    }

    // Con sesión: ocultar ingresar/crear cuenta, mostrar acceso al panel
    if (loginLink) loginLink.style.display = 'none';
    if (registerLink) registerLink.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';

    if (dashboardLink) {
        dashboardLink.href = panelForRole(role);
        dashboardLink.style.display = 'inline-block';
    }
}

function panelForRole(role) {
    if (role === 'admin') return '/admin-dashboard';
    if (role === 'professor') return '/professor-dashboard';
    return '/catalog';
}
