/**
 * Filtro genérico de patrón: detecta si el valor RESPETA o no una expresión regular.
 * Es la base reutilizable para todos los filtros de formato (email, username, etc.).
 * @param {RegExp} regex - patrón que debe cumplirse.
 * @param {string} msg - mensaje de error.
 */
module.exports = function pattern(regex, msg = 'El formato es inválido.') {
    return function (value) {
        if (value === null || value === undefined || String(value).trim() === '') return { valid: true };
        if (regex.test(String(value))) return { valid: true };
        return { valid: false, message: msg };
    };
};
