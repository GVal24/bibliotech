/**
 * Filtro: longitud máxima de un valor de texto.
 * @param {number} max - cantidad máxima de caracteres.
 * @param {string} msg - mensaje de error.
 */
module.exports = function maxLength(max, msg = `No debe superar los ${max} caracteres.`) {
    return function (value) {
        if (value === null || value === undefined) return { valid: true };
        if (String(value).length > max) return { valid: false, message: msg };
        return { valid: true };
    };
};
