/**
*    Project     : Bibliotech
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');

// Middleware de Multer para la subida de archivos
const uploadMiddleware = require('../config/multerConfig');
const lang = require('../utils/lang/LanguageManager');

/**
 * Envuelve a Multer para traducir sus errores (tipo no permitido, tamaño
 * excedido) a respuestas 400 claras en vez de un 500 genérico.
 */
function handleUpload(req, res, next) {
    uploadMiddleware(req, res, (err) => {
        if (err) {
            const isSize = err.code === 'LIMIT_FILE_SIZE';
            return res.status(400).json({
                message: isSize ? lang.t('file.tooLarge') : lang.t('file.type.only'),
                error: err.message
            });
        }
        next();
    });
}

const { verifyToken, verifyTokenFromQuery, hasRole } = require('../middleware/authMiddleware');

// --- Lectura del catálogo: ACCESO PÚBLICO (Student invitado sin login) ---
// Listar o buscar documentos: GET /api/documents  (opcional: ?q=término)
router.get('/', documentController.listDocuments);

// --- Ver un documento online: PÚBLICO (solo lectura, sin descargar) ---
// Va ANTES de verifyToken y de '/:id' para que no la capturen otras rutas.
// GET /api/documents/:id/file
router.get('/:id/file', documentController.viewFile);

// --- Descargar: SOLO usuarios registrados ---
// El navegador pide el archivo con <a>/<embed>, que no pueden enviar el header
// Authorization; por eso el token viaja por query string (?token=...).
// GET /api/documents/:id/download?token=<jwt>
router.get('/:id/download', verifyTokenFromQuery, documentController.downloadFile);

// --- A partir de acá todo requiere sesión ---
router.use(verifyToken);

// --- Cola de aprobación (solo Professor y Admin) ---
// IMPORTANTE: va ANTES de '/:id' para que no la capture la ruta por id.
// Listar documentos pendientes: GET /api/documents/pending/list
router.get('/pending/list', hasRole('admin', 'professor'), documentController.listPending);

// --- Subida de material (Admin, Professor y Student) ---
// Subir un documento: POST /api/documents/upload
// Student -> queda 'pending'; Professor/Admin -> 'approved' (lo decide el controlador).
// 'documentFile' es el nombre del campo file en el FormData del frontend
router.post('/upload', hasRole('admin', 'professor', 'student'), handleUpload, documentController.uploadDocument);

// --- Aprobación / rechazo de material (solo Professor y Admin) ---
router.post('/:id/approve', hasRole('admin', 'professor'), documentController.approveDocument);
router.post('/:id/reject', hasRole('admin', 'professor'), documentController.rejectDocument);

// --- Gestión del catálogo (solo administrador) ---
// Actualizar metadatos: PUT /api/documents/:id
router.put('/:id', hasRole('admin'), documentController.updateDocument);

// Eliminar un documento: DELETE /api/documents/:id
// Professor y Admin pueden borrar. El Student NO.
router.delete('/:id', hasRole('admin', 'professor'), documentController.deleteDocument);

// Ver un documento puntual: GET /api/documents/:id
// (al final para no eclipsar las rutas fijas de arriba)
router.get('/:id', documentController.getDocument);

module.exports = router;
