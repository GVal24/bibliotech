/**
*    Project     : Bibliotech
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

const path = require('path');
const fs = require('fs');
const documentRepo = require('../repositories/documentRepo');
const fileHelper = require('../utils/fileHelper');
const lang = require('../utils/lang/LanguageManager');
const { ValidationHandler, FieldValidator, required } = require('../utils/validation');

/**
 * Estados posibles del flujo de aprobación (patrón State).
 */
const STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
};

/**
 * Roles con capacidad de publicar directamente sin aprobación.
 */
const DIRECT_PUBLISH_ROLES = ['admin', 'professor'];

/**
 * Mapa de extensión -> Content-Type para servir los archivos con el tipo
 * correcto (el visor/descarga del navegador lo necesita). Si falta, se sirve
 * como 'application/octet-stream' (descarga genérica).
 */
const CONTENT_TYPES = {
    '.pdf': 'application/pdf',
    '.epub': 'application/epub+zip',
    '.txt': 'text/plain; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    '.csv': 'text/csv; charset=utf-8',
    '.rtf': 'application/rtf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.odt': 'application/vnd.oasis.opendocument.text',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.odp': 'application/vnd.oasis.opendocument.presentation',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.flac': 'audio/flac',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogv': 'video/ogg',
    '.mov': 'video/quicktime',
    '.djvu': 'image/vnd.djvu',
    '.mobi': 'application/x-mobipocket-ebook',
    '.azw3': 'application/vnd.amazon.ebook'
};

/**
 * Devuelve el Content-Type a partir de la extensión del archivo.
 * @param {string} filename - nombre del archivo.
 * @returns {string}
 */
function contentTypeFor(filename) {
    const ext = path.extname(filename || '').toLowerCase();
    return CONTENT_TYPES[ext] || 'application/octet-stream';
}

/**
 * Envía un documento al cliente.
 * - Si file_path es una URL (Cloudinary):
 *     - 'inline'     -> redirige a la URL (el navegador lo muestra embebido).
 *     - 'attachment' -> descarga el archivo y lo reenvía con Content-Disposition
 *       para forzar la descarga con el nombre original (Cloudinary no admite
 *       nombres con punto en el flag fl_attachment).
 * - Si es una ruta local, resuelve el archivo en disco y lo sirve.
 * @param {object} res - respuesta de Express.
 * @param {object} document - documento de la base.
 * @param {'inline'|'attachment'} disposition - ver online o descargar.
 */
async function sendDocumentFile(res, document, disposition) {
    const filePath = document.file_path || '';

    // --- Archivo alojado en la nube (Cloudinary) ---
    if (/^https?:\/\//.test(filePath)) {
        if (disposition !== 'attachment') {
            return res.redirect(filePath);
        }

        // Descarga: traemos el archivo y lo reenviamos con el nombre correcto.
        try {
            const upstream = await fetch(filePath);
            if (!upstream.ok) {
                return res.status(502).json({ message: lang.t('doc.file.missing') });
            }
            const buffer = Buffer.from(await upstream.arrayBuffer());
            res.setHeader('Content-Type', contentTypeFor(document.filename || filePath));
            res.setHeader(
                'Content-Disposition',
                'attachment; filename="' + (document.filename || 'documento') + '"'
            );
            return res.send(buffer);
        }
        catch (error) {
            return res.status(502).json({ message: lang.t('doc.file.missing'), error: error.message });
        }
    }

    // --- Archivo en disco local ---
    // file_path viene como '/uploads/documents/archivo.ext' (relativo al backend)
    const absolutePath = path.join(__dirname, '..', filePath.replace(/^\//, ''));

    if (!fs.existsSync(absolutePath)) {
        return res.status(404).json({ message: lang.t('doc.file.missing') });
    }

    res.setHeader('Content-Type', contentTypeFor(document.filename || filePath));
    res.setHeader(
        'Content-Disposition',
        disposition + '; filename="' + (document.filename || 'documento') + '"'
    );
    return res.sendFile(absolutePath);
}

/**
 * Determina el estado inicial de un documento según el rol que lo sube.
 * @param {string} role - rol del usuario autenticado.
 * @returns {string} 'approved' para admin/professor, 'pending' para el resto (student).
 */
function initialStatus(role) {
    return DIRECT_PUBLISH_ROLES.includes(role) ? STATUS.APPROVED : STATUS.PENDING;
}

/**
 * Valida los campos obligatorios comunes a alta y edición de documentos.
 * @returns {ValidationHandler}
 */
function validateDocumentFields({ title, author }) {
    const handler = new ValidationHandler()
        .with(new FieldValidator('title', title, [required(lang.t('field.required'))]))
        .with(new FieldValidator('author', author, [required(lang.t('field.required'))]));

    handler.validate();
    return handler;
}

/**
 * Rutina de cambio de estado (aprobar / rechazar). Solo Professor/Admin.
 * Es una función libre, no un método, para evitar problemas de `this`
 * al pasarla como callback a Express.
 * @param {string} status - nuevo estado ('approved' | 'rejected').
 */
async function setDocumentStatus(req, res, status) {
    try
    {
        const document = await documentRepo.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ message: lang.t('doc.notFound') });
        }

        await documentRepo.setStatus(req.params.id, status);
        res.json({ message: lang.t('doc.status.updated'), status });
    }
    catch (error)
    {
        res.status(500).json({ message: lang.t('doc.status.error'), error: error.message });
    }
}

/**
 * Controlador de documentos.
 * Coordina la capa de validación, la persistencia (repositorio)
 * y el manejo de archivos físicos.
 */
class DocumentController
{
    // GET /api/documents  (opcional: ?q=término)  -> catálogo público
    async listDocuments(req, res)
    {
        try
        {
            const term = (req.query.q || '').trim();
            const documents = term
                ? await documentRepo.search(term)
                : await documentRepo.findAll();

            res.json(documents);
        }
        catch (error)
        {
            res.status(500).json({ message: lang.t('doc.list.error'), error: error.message });
        }
    }

    // GET /api/documents/:id
    async getDocument(req, res)
    {
        try
        {
            const document = await documentRepo.findById(req.params.id);

            if (!document) {
                return res.status(404).json({ message: lang.t('doc.notFound') });
            }

            res.json(document);
        }
        catch (error)
        {
            res.status(500).json({ message: lang.t('doc.get.error'), error: error.message });
        }
    }

    // GET /api/documents/:id/file  -> ver online (acceso público)
    async viewFile(req, res)
    {
        try
        {
            const document = await documentRepo.findById(req.params.id);

            if (!document) {
                return res.status(404).json({ message: lang.t('doc.notFound') });
            }

            await sendDocumentFile(res, document, 'inline');
        }
        catch (error)
        {
            res.status(500).json({ message: lang.t('doc.get.error'), error: error.message });
        }
    }

    // GET /api/documents/:id/download  -> descargar (solo usuarios registrados)
    async downloadFile(req, res)
    {
        try
        {
            const document = await documentRepo.findById(req.params.id);

            if (!document) {
                return res.status(404).json({ message: lang.t('doc.notFound') });
            }

            await sendDocumentFile(res, document, 'attachment');
        }
        catch (error)
        {
            res.status(500).json({ message: lang.t('doc.get.error'), error: error.message });
        }
    }

    // GET /api/documents/pending  (solo professor/admin)
    async listPending(req, res)
    {
        try
        {
            const documents = await documentRepo.findByStatus(STATUS.PENDING);
            res.json(documents);
        }
        catch (error)
        {
            res.status(500).json({ message: lang.t('doc.pending.list.error'), error: error.message });
        }
    }

    // POST /api/documents/upload  (admin, professor y student)
    async uploadDocument(req, res)
    {
        // Ruta/referencia del archivo tal como la devuelve el storage:
        //  - Cloudinary: req.file.path = URL segura (https://res.cloudinary.com/...)
        //  - Disco local: '/uploads/documents/archivo.ext' (relativo al backend)
        // Se guarda en la DB y sirve para borrarlo si algo falla.
        const storedPath = req.file
            ? (req.file.path && /^https?:\/\//.test(req.file.path)
                ? req.file.path
                : `/uploads/documents/${req.file.filename}`)
            : null;

        try
        {
            const { title, author, isbn, category, year, description } = req.body;

            // 1. Validación modular de campos obligatorios
            const handler = validateDocumentFields({ title, author });

            if (handler.hasErrors())
            {
                if (storedPath) await fileHelper.deleteFile(storedPath);
                return res.status(400).json({
                    message: lang.t('doc.fields.invalid'),
                    errors: handler.getErrors()
                });
            }

            // 2. Debe existir el archivo
            if (!req.file)
            {
                return res.status(400).json({ message: lang.t('file.required') });
            }

            // 3. Verificación defensiva de tipo: la extensión debe estar permitida
            //    (Multer ya filtra, pero revalidamos por si se saltea el middleware).
            const ext = path.extname(req.file.originalname).toLowerCase();
            const allowed = require('../config/multerConfig').ALLOWED_EXTENSIONS;
            if (!allowed.includes(ext))
            {
                await fileHelper.deleteFile(storedPath);
                return res.status(400).json({ message: lang.t('file.type.only') });
            }

            // 4. Estado inicial según rol (State): professor/admin publican directo,
            //    student entra en la cola de aprobación.
            const status = initialStatus(req.userRole);

            // 5. Persistir en la base de datos
            const id = await documentRepo.create({
                user_id: req.userId,
                filename: req.file.originalname,
                title,
                author,
                isbn: isbn || null,
                category: category || null,
                year: year ? parseInt(year, 10) : null,
                description: description || null,
                file_path: storedPath,
                status
            });

            res.status(201).json({
                message: status === STATUS.PENDING
                    ? lang.t('doc.created.pending')
                    : lang.t('doc.created'),
                id,
                status
            });
        }
        catch (error)
        {
            // Si algo falló después de guardar el archivo, evitamos dejar basura en disco
            if (storedPath) await fileHelper.deleteFile(storedPath);
            res.status(500).json({ message: lang.t('doc.upload.error'), error: error.message });
        }
    }

    // POST /api/documents/:id/approve  (solo professor/admin)
    async approveDocument(req, res)
    {
        return setDocumentStatus(req, res, STATUS.APPROVED);
    }

    // POST /api/documents/:id/reject  (solo professor/admin)
    async rejectDocument(req, res)
    {
        return setDocumentStatus(req, res, STATUS.REJECTED);
    }

    // PUT /api/documents/:id  (solo admin)
    async updateDocument(req, res)
    {
        try
        {
            const document = await documentRepo.findById(req.params.id);

            if (!document) {
                return res.status(404).json({ message: lang.t('doc.notFound') });
            }

            const { title, author, isbn, category, year, description } = req.body;

            const handler = validateDocumentFields({ title, author });

            if (handler.hasErrors())
            {
                return res.status(400).json({
                    message: lang.t('doc.fields.invalid'),
                    errors: handler.getErrors()
                });
            }

            await documentRepo.update(req.params.id, {
                title,
                author,
                isbn: isbn || null,
                category: category || null,
                year: year ? parseInt(year, 10) : null,
                description: description || null
            });

            res.json({ message: lang.t('doc.updated') });
        }
        catch (error)
        {
            res.status(500).json({ message: lang.t('doc.update.error'), error: error.message });
        }
    }

    // DELETE /api/documents/:id  (solo professor/admin)
    async deleteDocument(req, res)
    {
        try
        {
            const document = await documentRepo.findById(req.params.id);

            if (!document) {
                return res.status(404).json({ message: lang.t('doc.notFound') });
            }

            // 1. Borrar primero la fila (si falla, no perdemos el archivo)
            await documentRepo.delete(req.params.id);

            // 2. Borrar el archivo físico (local o en Cloudinary)
            await fileHelper.deleteFile(document.file_path);

            res.json({ message: lang.t('doc.deleted') });
        }
        catch (error)
        {
            res.status(500).json({ message: lang.t('doc.delete.error'), error: error.message });
        }
    }
}

// Exportamos la clase y los estados para reutilizarlos (tests, adminController, etc.)
module.exports = new DocumentController();
module.exports.STATUS = STATUS;
