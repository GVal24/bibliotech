const pattern = require('./pattern');

/**
 * Filtro: nombre de usuario.
 * Permite letras, números, espacios, punto, guion y guion bajo (3 a 50 caracteres).
 * No admite espacios al inicio/fin ni espacios consecutivos (se normaliza antes de validar).
 * @param {string} msg - mensaje de error.
 */
module.exports = function usernameFormat(msg = 'El usuario debe tener entre 3 y 50 caracteres y solo admite letras, números y espacios.') {
    const isValidFormat = pattern(/^[A-Za-z0-9._-]+(?: [A-Za-z0-9._-]+)*$/, msg);

    return function (value) {
        if (value === null || value === undefined) return { valid: true };
        const str = String(value);
        if (str.trim() === '') return { valid: true }; // lo cubre 'required'

        const len = str.length;
        if (len < 3 || len > 50) return { valid: false, message: msg };

        return isValidFormat(value);
    };
};
