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
     * Determina si la página se está viendo en un celular o tablet.
     * Los navegadores móviles (Android / iOS) no muestran PDFs dentro de
     * <embed> ni de <iframe>: en esos dispositivos hay que usar el visor
     * nativo del sistema (abriendo el archivo en una pestaña nueva).
     * iPadOS 13+ se identifica como "Macintosh", por eso se detecta con el
     * soporte táctil.
     * @returns {boolean}
     */
    isMobileDevice() {
        const ua = navigator.userAgent || '';
        const isIPadOS = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
        return isIPadOS || /Android|iPhone|iPad|iPod|Mobile|Tablet|Kindle|Silk|Opera Mini|IEMobile|Windows Phone|BlackBerry/i.test(ua);
    },

    /**
     * URL pública para ver un documento online (sin descargar).
     */
    viewUrl(id) {
        return `/api/documents/${id}/file`;
    },

    /**
     * Abre una URL en una pestaña nueva usando un enlace real.
     * Se usa un <a> en lugar de window.open porque los bloqueadores de
     * pop-ups suelen bloquear window.open, pero no la navegación de un
     * enlace disparada por un click del usuario.
     * @param {string} url - dirección a abrir.
     */
    openUrlInNewTab(url) {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
    },

    /**
     * Abre un documento para lectura online en una pestaña nueva.
     * Para admin/professor se incluye el token por query, de modo que puedan
     * previsualizar también material pendiente/rechazado.
     * @param {number|string} id - id del documento.
     * @param {object} [options] - { forStaff: boolean } para adjuntar el token.
     */
    openViewer(id, options) {
        const token = this.getToken();
        const forStaff = options && options.forStaff;
        let url = this.viewUrl(id);
        if (forStaff && token) {
            url += `?token=${encodeURIComponent(token)}`;
        }
        this.openUrlInNewTab(url);
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