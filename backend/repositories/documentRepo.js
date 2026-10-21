/**
*    Project     : Bibliotech
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

const db = require('../config/db');

/**
 * Repositorio de documentos.
 * Encapsula el acceso a datos a través de los Stored Procedures.
 * El catálogo es compartido: cualquiera puede listar/buscar/leer,
 * pero solo el administrador crea, actualiza y borra.
 */
class DocumentRepository
{
    // Listar todo el catálogo de la biblioteca
    async findAll()
    {
        const [rows] = await db.execute('CALL sp_find_all_documents()');
        return rows[0];
    }

    // Buscar por término (título, autor, ISBN o categoría)
    async search(term)
    {
        const [rows] = await db.execute('CALL sp_search_documents(?)', [term]);
        return rows[0];
    }

    // Obtener un documento por su id
    async findById(id)
    {
        const [rows] = await db.execute('CALL sp_find_document_by_id(?)', [id]);
        return rows[0][0];
    }

    // Listar los documentos subidos por un usuario (limpieza al borrar admin)
    async findByUserId(userId)
    {
        const [rows] = await db.execute('CALL sp_find_documents_by_user(?)', [userId]);
        return rows[0];
    }

    // Listar documentos por estado (cola de aprobación del Professor/Admin)
    async findByStatus(status)
    {
        const [rows] = await db.execute('CALL sp_find_documents_by_status(?)', [status]);
        return rows[0];
    }

    // Crear un documento y devolver su id generado
    async create(data)
    {
        const [rows] = await db.execute(
            'CALL sp_create_document(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                data.user_id, data.filename, data.title, data.author,
                data.isbn, data.category, data.year, data.description,
                data.file_path, data.status
            ]
        );
        // El SP realiza un SELECT LAST_INSERT_ID() as insertId al final
        return rows[0][0].insertId;
    }

    // Cambiar el estado de un documento (aprobar / rechazar)
    async setStatus(id, status)
    {
        await db.execute('CALL sp_set_document_status(?, ?)', [id, status]);
        return true;
    }

    // Actualizar los metadatos de un documento
    async update(id, data)
    {
        await db.execute(
            'CALL sp_update_document(?, ?, ?, ?, ?, ?, ?)',
            [id, data.title, data.author, data.isbn, data.category, data.year, data.description]
        );
        return true;
    }

    // Borrar un documento
    async delete(id)
    {
        await db.execute('CALL sp_delete_document(?)', [id]);
        return true;
    }
}

module.exports = new DocumentRepository();
