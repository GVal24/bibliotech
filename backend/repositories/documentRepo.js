/**
* Project     : Document Vault
* Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
* License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
* Date        : Marzo 2026
*/

const db = require('../config/db');

class DocumentRepository 
{
    // Insertar un nuevo registro de document
    async create(documentData) 
    {
        const { user_id, filename, display_name, category, bpm, file_path } = documentData;
        const [rows] = await db.execute(
            'CALL sp_create_document(?, ?, ?, ?, ?, ?, ?, ?, ?)', 
            [user_id, filename, title, author, isbn, category, year, description, file_path]
        );
        return rows[0][0].insertId;
    }

    // Obtener todos los documents de un productor específico
    async findByUserId(userId) 
    {
        const [rows] = await db.execute('CALL sp_find_documents_by_user(?)', [userId]);
        return rows[0];
    }

    // Buscar y obtener un document validando el ID y el propietario
    async findById(id, userId) 
    {
        const [rows] = await db.execute('CALL sp_find_document_by_id(?, ?)', [id, userId]);
        return rows[0][0]; 
    }

    // Eliminar un document validando la propiedad del mismo
    async delete(id, userId) 
    {
        await db.execute('CALL sp_delete_document(?, ?)', [id, userId]);
        return true;
    }
}

module.exports = new DocumentRepository();
