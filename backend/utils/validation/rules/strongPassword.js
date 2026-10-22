/**
 * Filtro: fortaleza de contraseña.
 * Exige 8 caracteres como mínimo, al menos una letra y al menos un número.
 * El mensaje detalla qué requisito falta, para que el usuario lo entienda.
 * @param {string} msg - mensaje de error (opcional).
 */
module.exports = function strongPassword(msg) {
    return function (value) {
        if (value === null || value === undefined || String(value).trim() === '') return { valid: true };

        const password = String(value);
        const hasMinLength = password.length >= 8;
        const hasLetter = /[A-Za-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);

        if (hasMinLength && hasLetter && hasNumber) return { valid: true };

        // Construimos la lista de lo que falta, para un mensaje preciso.
        const missing = [];
        if (!hasMinLength) missing.push('al menos 8 caracteres (tiene ' + password.length + ')');
        if (!hasLetter) missing.push('al menos una letra');
        if (!hasNumber) missing.push('al menos un número');

        return { valid: false, message: 'La contraseña debe incluir ' + missing.join(' y ') + '.' };
    };
};
