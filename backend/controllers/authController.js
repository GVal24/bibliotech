/**
*    Project     : Bibliotech
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

const bcrypt = require('bcrypt'); // Biblioteca para encriptar contraseñas
const jwt = require('jsonwebtoken'); // Para generar tokens de sesión
const userRepo = require('../repositories/userRepo'); // Importamos el repositorio de usuarios
const lang = require('../utils/lang/LanguageManager');
const {
    ValidationHandler,
    FieldValidator,
    required,
    usernameFormat,
    strongPassword
} = require('../utils/validation');

/**
 * Valida de forma modular que usuario y contraseña estén presentes (login).
 * @returns {ValidationHandler} el handler con el resultado de la validación.
 */
function validateCredentials(username, password) {
    const handler = new ValidationHandler()
        .with(new FieldValidator('username', username, [required(lang.t('field.required'))]))
        .with(new FieldValidator('password', password, [required(lang.t('field.required'))]));

    handler.validate();
    return handler;
}

/**
 * Valida el alta de usuario aplicando filtros de formato (registro).
 * Username: alfanumérico acotado. Password: fortaleza mínima.
 * @returns {ValidationHandler}
 */
function validateRegistration(username, password) {
    const handler = new ValidationHandler()
        .with(new FieldValidator('username', username, [
            required(lang.t('field.required')),
            usernameFormat(lang.t('auth.username.invalid'))
        ]))
        .with(new FieldValidator('password', password, [
            required(lang.t('field.required')),
            strongPassword()
        ]));

    handler.validate();
    return handler;
}

/**
 * Deserialización moderna: "Del objeto que devuelve este require, buscá la propiedad que se 
 * llame exactamente SECRET_KEY y creá una constante con ese mismo nombre y valor".
 *  */ 
const { SECRET_KEY } = require('../middleware/authMiddleware'); 

class AuthController 
{
    // Registro de usuarios
    async register(req, res) 
    {
        try 
        {
            const { username, password } = req.body;

            // Normalizamos el usuario: quitamos espacios al inicio/fin y
            // colapsamos espacios internos repetidos ("Guille  Valdez" -> "Guille Valdez").
            const cleanUsername = (typeof username === 'string')
                ? username.trim().replace(/\s+/g, ' ')
                : username;

            // 1. Validación modular de presencia + formato
            const handler = validateRegistration(cleanUsername, password);
            if (handler.hasErrors()) {
                const errors = handler.getErrors();
                return res.status(400).json({
                    message: errors.length ? errors[0].message : lang.t('auth.credentials.required'),
                    errors
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);            
            
            // 2. Creación mediante el repositorio (que usa el SP sp_create_user)
            //    Todo registro nuevo entra como 'student'.
            const userId = await userRepo.create(cleanUsername, hashedPassword, 'student');
            
            res.status(201).json({ 
                message: lang.t('auth.register.success'), 
                userId 
            });
        }
        catch (error)
        {
            // 3. Manejo de error específico: Usuario Duplicado (Código ER_DUP_ENTRY en MySQL)
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: lang.t('auth.user.exists') });
            }

            res.status(500).json({ 
                message: lang.t('auth.register.error'), 
                error: error.message 
            });
        }
    }

    // Inicio de sesión
    async login(req, res) 
    {
        try
        {
            const { username, password } = req.body;

            // Validación modular de presencia
            const handler = validateCredentials(username, password);
            if (handler.hasErrors()) {
                return res.status(400).json({ message: lang.t('auth.credentials.incomplete') });
            }

            // El repositorio ahora devuelve el usuario con su ROL gracias al JOIN en el SP
            const user = await userRepo.findByUsername(username);

            if (!user || !(await bcrypt.compare(password, user.password)))
            {
                return res.status(401).json({ message: lang.t('auth.login.invalid') });
            }

            // 4. Generación del Token (Payload consistente con el Middleware)
            const token = jwt.sign(
                { 
                    id: user.id, 
                    role: user.role // Este string 'admin'/'professor'/'student' viene de la tabla roles
                }, 
                SECRET_KEY, 
                { expiresIn: '2h' }
            );

            res.json({ 
                message: lang.t('auth.login.success'), 
                token, 
                role: user.role 
            });
        }
        catch (error)
        {
            res.status(500).json({ 
                message: lang.t('auth.login.error'), 
                error: error.message 
            });
        }
    }
}

module.exports = new AuthController();
