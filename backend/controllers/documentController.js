/**
* Project     : Documento Vault
* Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
* License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
* Date        : Marzo 2026
*/

const fileHelper = require('../utils/fileHelper');
const documentRepo = require('../repositories/documentRepo');

class DocumentController 
{
    // Método para subir un document y guardarlo en la BD
    async uploadDocument(req, res) 
    {
        try
        {
            // 1. Validación de archivo y datos obligatorios
            if (!req.file)
            {
                return res.status(400).json({ message: "No se subió ningún archivo o el formato es inválido." });
            }

            const { display_name, category, bpm } = req.body;
            
            const title = req.body.title || req.body.display_name; if (!title || !category) {
                // Si faltan datos, eliminamos el archivo físico para no dejar basura (Storage Efficiency)
                fileHelper.deleteFile(`/uploads/documents/${req.file.filename}`);
                return res.status(400).json({ message: "El nombre y la categoría son obligatorios." });
            }

            const userId = req.userId; // Proveniente del verifyToken
            const filename = req.file.filename;
            const filePath = `/uploads/documents/${filename}`;

            // 2. Persistencia mediante el SP sp_create_document
            const insertId = await documentRepo.create({
                user_id: userId,
                filename,
                title: req.body.title || req.body.display_name,
                author: req.body.author || null,
                isbn: req.body.isbn || null,
                category: req.body.category,
                year: req.body.year ? parseInt(req.body.year) : (parseInt(req.body.bpm) || null),
                description: req.body.description || null,
                file_path: filePath
            });

            res.status(201).json({ 
                message: "Documento cargado exitosamente en la biblioteca.", 
                id: insertId,
                path: filePath 
            });
        }
        catch (error)
        {
            // En caso de error de DB, intentar limpiar el archivo físico
            if (req.file) fileHelper.deleteFile(`/uploads/documents/${req.file.filename}`);
            
            res.status(500).json({ message: "Error durante la carga del document.", error: error.message });
        }
    }

    // Listar documents del productor logueado
    async getMyDocuments(req, res)
    {
        try
        {
            // El SP sp_find_documents_by_user filtra automáticamente por user_id
            const documents = await documentRepo.findByUserId(req.userId);
            res.json(documents);
        }
        catch (error)
        {
            res.status(500).json({ message: "Error al recuperar la biblioteca.", error: error.message });
        }
    }

    // Eliminar un document de la biblioteca
    async deleteDocument(req, res) 
    {
        try 
        {
            const { id } = req.params;
            const userId = req.userId;

            // 1. Obtener metadatos para conocer la ruta del archivo físico
            const document = await documentRepo.findById(id, userId);
            
            if (!document) {
                return res.status(404).json({ message: "El document no existe o no tienes permisos para eliminarlo." });
            }

            // 2. Ejecutar sp_delete_document en la base de datos
            await documentRepo.delete(id, userId);

            // 3. Eliminación física del archivo (Gestión de recursos)
            fileHelper.deleteFile(document.file_path); 
            
            return res.json({ message: "Registro eliminado y archivo físico removido con éxito." });
        }
        catch (error)
        {
            res.status(500).json({ message: "Error al eliminar el document.", error: error.message });
        }
    }
}

module.exports = new DocumentController();
