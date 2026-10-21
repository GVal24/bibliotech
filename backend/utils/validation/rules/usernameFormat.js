const pattern = require('./pattern');

/**
 * Filtro: nombre de usuario alfanumérico.
 * Permite letras, números, punto, guion y guion bajo (3 a 50 caracteres).
 * @param {string} msg - mensaje de error.
 */
module.exports = function usernameFormat(msg = 'El usuario solo admite letras, números, ".", "_" y "-".') {
    return pattern(/^[A-Za-z0-9._-]{3,50}$/, msg);
};
