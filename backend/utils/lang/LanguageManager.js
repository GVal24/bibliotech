/**
*    Project     : Bibliotech
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

/**
 * Manejador de idioma.
 * Centraliza todos los mensajes de la aplicación para poder
 * cambiarlos de idioma sin tocar la lógica de los controladores.
 */
const LanguageManager = {
    messages: {
        es: {
            'field.required': 'El campo es obligatorio.',
            'field.invalid': 'El campo es inválido.',
            'file.pdf.only': 'Solo se permiten archivos PDF.',
            'file.type.only': 'Tipo de archivo no permitido.',
            'file.noExtension': 'El archivo no tiene extensión. Renombralo agregando una extensión válida (por ejemplo: .pdf).',
            'file.tooLarge': 'El archivo supera el tamaño máximo permitido (10 MB). Comprimí el archivo o subí una versión más liviana.',
            'file.required': 'Debes adjuntar un archivo.',

            // Autenticación
            'auth.credentials.required': 'Usuario y contraseña son requeridos.',
            'auth.credentials.incomplete': 'Credenciales incompletas.',
            'auth.username.invalid': 'El usuario debe tener entre 3 y 50 caracteres y solo admite letras, números y espacios.',
            'auth.password.invalid': 'La contraseña debe tener al menos 8 caracteres, incluyendo una letra y un número.',
            'auth.register.success': 'Usuario registrado con éxito.',
            'auth.register.error': 'Error interno durante el registro.',
            'auth.user.exists': 'El nombre de usuario ya existe.',
            'auth.login.invalid': 'Credenciales inválidas.',
            'auth.login.success': 'Login exitoso.',
            'auth.login.error': 'Error en el proceso de autenticación.',

            // Documentos
            'doc.list.error': 'Error al obtener el catálogo de documentos.',
            'doc.get.error': 'Error al obtener el documento.',
            'doc.notFound': 'Documento no encontrado.',
            'doc.file.missing': 'El archivo físico no está disponible.',
            'doc.fields.invalid': 'Datos incompletos o inválidos.',
            'doc.upload.error': 'Error al subir el documento.',
            'doc.created': 'Documento agregado a la biblioteca.',
            'doc.created.pending': 'Material enviado. Queda pendiente de aprobación.',
            'doc.updated': 'Documento actualizado con éxito.',
            'doc.update.error': 'Error al actualizar el documento.',
            'doc.deleted': 'Documento eliminado con éxito.',
            'doc.delete.error': 'Error al eliminar el documento.',
            'doc.status.invalid': 'Estado de documento inválido.',
            'doc.status.updated': 'Estado del documento actualizado.',
            'doc.status.error': 'Error al actualizar el estado del documento.',
            'doc.pending.list.error': 'Error al obtener los documentos pendientes.',

            // Administración
            'admin.users.list.error': 'Error al obtener la lista de usuarios.',
            'admin.user.selfDelete': 'Operación denegada: no puedes eliminar tu propia cuenta.',
            'admin.user.notFound': 'Usuario no encontrado.',
            'admin.user.deleted': 'Usuario eliminado con éxito. Su material se conserva en la biblioteca.',
            'admin.user.delete.error': 'Error crítico al intentar eliminar el usuario.',
            'admin.role.updated': 'Rol del usuario actualizado con éxito.',
            'admin.role.invalid': 'Rol inválido.',
            'admin.role.error': 'Error al actualizar el rol del usuario.'
        },
        en: {
            'field.required': 'Field is required.',
            'field.invalid': 'Field is invalid.',
            'file.pdf.only': 'Only PDF files are allowed.',
            'file.type.only': 'File type not allowed.',
            'file.noExtension': 'The file has no extension. Rename it by adding a valid extension (for example: .pdf).',
            'file.tooLarge': 'File exceeds the maximum allowed size (10 MB). Compress the file or upload a lighter version.',
            'file.required': 'You must attach a file.',

            // Authentication
            'auth.credentials.required': 'Username and password are required.',
            'auth.credentials.incomplete': 'Incomplete credentials.',
            'auth.username.invalid': 'The username must be 3 to 50 characters long and allows only letters, numbers and spaces.',
            'auth.password.invalid': 'The password must be at least 8 characters long, including a letter and a number.',
            'auth.register.success': 'User registered successfully.',
            'auth.register.error': 'Internal error during registration.',
            'auth.user.exists': 'The username already exists.',
            'auth.login.invalid': 'Invalid credentials.',
            'auth.login.success': 'Login successful.',
            'auth.login.error': 'Error in the authentication process.',

            // Documents
            'doc.list.error': 'Error getting the document catalog.',
            'doc.get.error': 'Error getting the document.',
            'doc.notFound': 'Document not found.',
            'doc.file.missing': 'The physical file is not available.',
            'doc.fields.invalid': 'Incomplete or invalid data.',
            'doc.upload.error': 'Error uploading the document.',
            'doc.created': 'Document added to the library.',
            'doc.created.pending': 'Material submitted. It is pending approval.',
            'doc.updated': 'Document updated successfully.',
            'doc.update.error': 'Error updating the document.',
            'doc.deleted': 'Document deleted successfully.',
            'doc.delete.error': 'Error deleting the document.',
            'doc.status.invalid': 'Invalid document status.',
            'doc.status.updated': 'Document status updated.',
            'doc.status.error': 'Error updating the document status.',
            'doc.pending.list.error': 'Error getting the pending documents.',

            // Administration
            'admin.users.list.error': 'Error getting the user list.',
            'admin.user.selfDelete': 'Operation denied: you cannot delete your own account.',
            'admin.user.notFound': 'User not found.',
            'admin.user.deleted': 'User deleted successfully. Their material is kept in the library.',
            'admin.user.delete.error': 'Critical error while deleting the user.',
            'admin.role.updated': 'User role updated successfully.',
            'admin.role.invalid': 'Invalid role.',
            'admin.role.error': 'Error updating the user role.'
        }
    },

    current: 'es',

    // Devuelve el mensaje para la clave en el idioma actual
    t(key) {
        const dictionary = this.messages[this.current] || this.messages.es;
        return dictionary[key] || key;
    },

    // Cambia el idioma activo si existe
    set(lang) {
        if (this.messages[lang]) this.current = lang;
    }
};

module.exports = LanguageManager;
