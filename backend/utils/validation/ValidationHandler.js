/**
 * ValidationHandler - Modulariza validación y manejo de errores
 */
class ValidationHandler {
    constructor(validators = []) {
        this.validators = validators;
        this.errors = [];
    }

    addValidator(validator) {
        this.validators.push(validator);
        return this;
    }

    validate() {
        this.errors = [];
        for (const validator of this.validators) {
            if (typeof validator.validate === 'function') {
                const result = validator.validate();
                if (result && result.valid === false) {
                    this.errors.push(...(result.errors || []));
                }
            }
            if (typeof validator.evaluate === 'function') {
                validator.evaluate();
            }
        }
        return this.errors.length === 0;
    }

    hasErrors() {
        return this.errors.length > 0;
    }

    getErrors() {
        return this.errors;
    }

    validationObject(data) {
        this.data = data;
        return this;
    }

    validateThis() {
        return this.validate();
    }

    with(validator) {
        this.addValidator(validator);
        return this;
    }
}

module.exports = ValidationHandler;
