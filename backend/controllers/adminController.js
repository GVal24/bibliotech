/**
* Project     : Bibliotech
* Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
* License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
* Date        : Marzo 2026
*/

const userRepo = require('../repositories/userRepo');
const documentRepo = require('../repositories/documentRepo');
const fileHelper = require('../utils/fileHelper');
const lang = require('../utils/lang/LanguageManager');

/**
 * Roles válidos del sistema. Fuente de verdad para la asignación de roles.
 */
const VALID_ROLES = ['admin', 'professor', 'student'];

class AdminController 
{
    // Listar todos los usuarios con sus roles (vía SP sp_find_all_users)
    async getAllUsers(req, res)
    {
        try
        {
            const users = await userRepo.findAll();
            // El SP ya devuelve el nombre del rol gracias al JOIN interno
            res.json(users);
        }
        catch (error)
        {
            res.status(500).json({ 
                message: lang.t('admin.users.list.error'), 
                error: error.message 
            });
        }
    }

    // PUT /api/admin/users/:id/role  (solo admin)
    // El Admin promueve a Professor, o cambia roles en general.
    async updateUserRole(req, res)
    {
        try
        {
            const { role } = req.body;

            if (!VALID_ROLES.includes(role)) {
                return res.status(400).json({ message: lang.t('admin.role.invalid') });
            }

            await userRepo.updateRole(req.params.id, role);

            res.json({ message: lang.t('admin.role.updated'), role });
        }
        catch (error)
        {
            res.status(500).json({ 
                message: lang.t('admin.role.error'), 
                error: error.message 
            });
        }
    }

    // Eliminar al usuario y sus archivos
    async deleteUser(req, res)
    {
        try
        {
            const targetUserId = req.params.id;
            const adminId = req.userId; // ID del administrador que realiza la acción (del JWT)

            // 1. Regla de Negocio: No permitir que un admin se elimine a sí mismo
            if (targetUserId == adminId) {
                return res.status(403).json({ message: lang.t('admin.user.selfDelete') });
            }

            // 2. Verificar si el usuario existe y obtener sus documentos
            const userDocuments = await documentRepo.findByUserId(targetUserId);
            
            // 3. Proceder con la eliminación en la DB (vía SP sp_delete_user)
            const success = await userRepo.delete(targetUserId);

            if (!success) {
                return res.status(404).json({ message: lang.t('admin.user.notFound') });
            }

            // 4. Limpieza de archivos físicos 
            // Solo llegamos aquí si el usuario existía y fue borrado de la DB
            userDocuments.forEach(document => {
                fileHelper.deleteFile(document.file_path);
            });

            res.json({ 
                message: `${lang.t('admin.user.deleted')} (${userDocuments.length} documentos removidos).` 
            });
        }
        catch (error)
        {
            res.status(500).json({ 
                message: lang.t('admin.user.delete.error'), 
                error: error.message 
            });
        }
    }
}

module.exports = new AdminController();
module.exports.VALID_ROLES = VALID_ROLES;
