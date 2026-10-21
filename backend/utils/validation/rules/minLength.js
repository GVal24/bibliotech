/**
 * Filtro: longitud mínima de un valor de texto.
 * @param {number} min - cantidad mínima de caracteres.
 * @param {string} msg - mensaje de error.
 */
module.exports = function minLength(min, msg = `Debe tener al menos ${min} caracteres.`) {
    return function (value) {
        if (value === null || value === undefined) return { valid: true };
        if (String(value).length < min) return { valid: false, message: msg };
        return { valid: true };
    };
};
