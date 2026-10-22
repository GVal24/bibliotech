const pattern = require('./pattern');

// Caracteres permitidos: letras, números, espacio, punto, guion y guion bajo.
const ALLOWED = /^[A-Za-z0-9 ._-]$/;

/**
 * Construye la lista de caracteres NO permitidos presentes en el texto,
 * para mostrarlos en el mensaje de error (más intuitivo para el usuario).
 * @param {string} str
 * @returns {string[]} lista de caracteres únicos, en orden de aparición.
 */
function disallowedChars(str) {
    const found = [];
    for (const ch of str) {
        if (!ALLOWED.test(ch) && !found.includes(ch)) found.push(ch);
    }
    return found;
}

/**
 * Filtro: nombre de usuario.
 * Permite letras, números, espacios, punto, guion y guion bajo (3 a 50 caracteres).
 * No admite espacios al inicio/fin ni espacios consecutivos (se normaliza antes de validar).
 * @param {string} msg - mensaje de error genérico (opcional).
 */
module.exports = function usernameFormat(msg = 'El usuario debe tener entre 3 y 50 caracteres y solo admite letras, números y espacios.') {
    const isValidFormat = pattern(/^[A-Za-z0-9._-]+(?: [A-Za-z0-9._-]+)*$/, msg);

    return function (value) {
        if (value === null || value === undefined) return { valid: true };
        const str = String(value);
        if (str.trim() === '') return { valid: true }; // lo cubre 'required'

        const len = str.length;
        if (len < 3 || len > 50) {
            return { valid: false, message: 'El usuario debe tener entre 3 y 50 caracteres (tiene ' + len + ').' };
        }

        // Si hay caracteres no permitidos, los mostramos explícitamente.
        const bad = disallowedChars(str);
        if (bad.length > 0) {
            const list = bad.map((c) => '"' + c + '"').join(', ');
            return {
                valid: false,
                message: 'El usuario no admite estos caracteres: ' + list +
                         '. Solo se permiten letras, números, espacios, punto (.), guion (-) y guion bajo (_).'
            };
        }

        // Espacios al inicio/fin o repetidos (tras la normalización del controlador normalmente no ocurre).
        return isValidFormat(value);
    };
};
