/**
*    Project     : Bibliotech
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

/**
 * JSON Web Token (JWT) es un estándar abierto (RFC 7519) compacto 
 * y seguro para transmitir información entre partes como un objeto JSON. 
 * Se utiliza principalmente para autenticación y autorización en 
 * aplicaciones web, permitiendo verificar la integridad de los datos 
 * mediante una firma digital (con clave secreta o par RSA)
 */
const jwt = require('jsonwebtoken');
// En producción, siempre usar variables de entorno (.env):
const SECRET_KEY = process.env.JWT_SECRET;

/**
 * Extrae los roles del request y verifica si alguno de los esperados está presente.
 * Acepta rol como string ("admin") o como array (["student", "professor"]).
 * @param {string|string[]} currentRoles - roles que trae el token.
 * @param {string[]} allowedRoles - roles que autorizan el acceso.
 * @returns {boolean}
 */
function matchRole(currentRoles, allowedRoles) {
    const current = Array.isArray(currentRoles) ? currentRoles : [currentRoles];
    return current.some((role) => allowedRoles.includes(role));
}

const authMiddleware = {
    // 0. Agregar SECRET_KEY para que sea accesible al importar el objeto authMiddleware
    SECRET_KEY,

    // 1. Verifica que el usuario esté logueado
    verifyToken: (req, res, next) => {
        // Obtener el token del encabezado de la petición
        //un mejor nombre es authHeader, porque esta cabecera puede traer otra información
        //además del token:
        const authHeader = req.headers['authorization'];
        
        // Mejora: Validación de formato Bearer segura
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(403).json({ message: "Formato de token incorrecto o inexistente." });
        }

        // El token o authHeader suele venir como "Bearer <token>", aquí quitamos el "Bearer ":
        const pureToken = authHeader.split(" ")[1];

        jwt.verify(pureToken, SECRET_KEY, (err, decoded) => {
            if (err) return res.status(401).json({ message: "Token inválido o expirado." });
            
            // Guardamos la info del usuario decodificada en el request para usarla después:
            req.userId = decoded.id;
            req.userRole = decoded.role; // Extraemos el rol del token
            next(); // Continuar al siguiente controlador o middleware
        });
    },

    /**
     * 2. Autorización genérica y reutilizable (Open/Closed Principle).
     * Fábrica de middleware: se le pasan los roles permitidos y devuelve
     * un middleware de Express. Agregar roles nuevos NO obliga a modificar
     * este archivo.
     *
     * Importante: debe ir DESPUÉS de verifyToken en las rutas.
     * @param {...string} allowedRoles - roles autorizados (ej: 'admin', 'professor').
     */
    hasRole: (...allowedRoles) => (req, res, next) => {
        if (matchRole(req.userRole, allowedRoles)) {
            return next();
        }
        return res.status(403).json({
            message: "Acceso denegado: se requieren privilegios de " + allowedRoles.join(' o ') + "."
        });
    },

    /**
     * 3. Verifica el token viniendo por query string (?token=...).
     *    Necesario para recursos que el navegador pide directamente sin poder
     *    enviar el header Authorization: <embed>, <img>, <a download>, etc.
     *    Debe usarse SOLO para endpoints de archivos, nunca para la API general.
     */
    verifyTokenFromQuery: (req, res, next) => {
        const pureToken = req.query.token;

        if (!pureToken) {
            return res.status(403).json({ message: "Token inexistente." });
        }

        jwt.verify(pureToken, SECRET_KEY, (err, decoded) => {
            if (err) return res.status(401).json({ message: "Token inválido o expirado." });

            req.userId = decoded.id;
            req.userRole = decoded.role;
            next();
        });
    },

    // 4. Alias de compatibilidad hacia atrás: solo Admin.
    //    Es un caso particular de hasRole, así las rutas existentes no cambian.
    isAdmin: (req, res, next) => authMiddleware.hasRole('admin')(req, res, next)
};

module.exports = authMiddleware;
