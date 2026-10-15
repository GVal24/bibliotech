/**
 * FieldValidator genérico
 */
class FieldValidator {
    constructor(fieldName, value, rules = []) {
        this.fieldName = fieldName;
        this.value = value;
        this.rules = rules;
        this.errors = [];
    }

    validate() {
        this.errors = [];
        for (const rule of this.rules) {
            if (typeof rule === 'function') {
                const res = rule(this.value, this.fieldName);
                if (res && res.valid === false) {
                    this.errors.push({ field: this.fieldName, message: res.message });
                }
            }
        }
        return this.errors.length === 0 ? { valid: true } : { valid: false, errors: this.errors };
    }

    evaluate() {
        return this.validate();
    }
}

module.exports = FieldValidator;
