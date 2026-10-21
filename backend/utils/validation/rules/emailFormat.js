const pattern = require('./pattern');

/**
 * Filtro: dirección de correo electrónico.
 * Detecta el patrón clásico usuario@dominio.tld.
 * @param {string} msg - mensaje de error.
 */
module.exports = function emailFormat(msg = 'El correo electrónico no tiene un formato válido.') {
    return pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, msg);
};
