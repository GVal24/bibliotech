/**
*    Project     : Bibliotech
*    Author      : TECAS(2do año) - ISFT N°151 - MdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

/**
 * Utilidad para gestionar la persistencia de la sesión
 * Centraliza el uso de localStorage/sessionStorage
 */
 const authHelper = {
    /**
     * Se puede cambiar 'localStorage' por 'sessionStorage' aquí y afectará a toda la app
     */    
    storage: localStorage,

    saveSession(token, role) {
        this.storage.setItem('token', token);
        this.storage.setItem('role', role);
    },

    getToken() {
        return this.storage.getItem('token');
    },

    logout() {
        this.storage.clear();
        window.location.href = '/login';
    },

    
    initLogoutButtons() {
        const logoutBtns = document.querySelectorAll('.btn-logout');
        logoutBtns.forEach(btn => {
            btn.addEventListener('click', () => this.logout());
        });
    },

    /**
     * URL pública para ver un documento online (sin descargar).
     */
    viewUrl(id) {
        return `/api/documents/${id}/file`;
    },

    /**
     * URL de descarga para usuarios registrados. El token viaja por query
     * porque <a>/<embed> no pueden enviar el header Authorization.
     */
    downloadUrl(id) {
        const token = this.getToken();
        return `/api/documents/${id}/download?token=${encodeURIComponent(token || '')}`;
    }
};

// Inicializar escuchadores de logout al cargar
document.addEventListener('DOMContentLoaded', () => authHelper.initLogoutButtons());