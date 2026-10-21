/**
 * Filtro: fortaleza de contraseña.
 * Exige 8 caracteres como mínimo, al menos una letra y al menos un número.
 * @param {string} msg - mensaje de error.
 */
module.exports = function strongPassword(msg) {
    const message = msg || 'La contraseña debe tener al menos 8 caracteres, incluyendo una letra y un número.';
    return function (value) {
        if (value === null || value === undefined || String(value).trim() === '') return { valid: true };

        const password = String(value);
        const hasMinLength = password.length >= 8;
        const hasLetter = /[A-Za-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);

        if (hasMinLength && hasLetter && hasNumber) return { valid: true };
        return { valid: false, message };
    };
};
