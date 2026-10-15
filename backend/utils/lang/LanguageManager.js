const LanguageManager = {
    messages: {
        es: {
            'field.required': 'El campo es obligatorio.',
            'field.invalid': 'El campo es inválido.',
            'file.pdf.only': 'Solo se permiten archivos PDF.'
        },
        en: {
            'field.required': 'Field is required.',
            'field.invalid': 'Field is invalid.',
            'file.pdf.only': 'Only PDF files are allowed.'
        }
    },
    current: 'es',
    t(key) {
        const m = this.messages[this.current] || this.messages.es;
        return m[key] || key;
    },
    set(lang) {
        if (this.messages[lang]) this.current = lang;
    }
};
module.exports = LanguageManager;
