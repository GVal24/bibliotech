/**
*    Project     : Bibliotech
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');

//configuración de Multer para subir archivos de documento:
const uploadMiddleware = require('../config/multerConfig');

const { verifyToken } = require('../middleware/authMiddleware');

// Todas las rutas de documents requieren que el usuario esté logueado
router.use(verifyToken);

// Subir un nuevo documento: POST /api/documents/upload
// 'documentFile' es el nombre que debe tener el campo file en el FormData del frontend
router.post('/upload', uploadMiddleware, documentController.uploadDocument);

// Listar mis documents: GET /api/documents/my-documents
router.get('/my-documents', documentController.getMyDocuments);

// Eliminar un document: DELETE /api/documents/:id
router.delete('/:id', documentController.deleteDocument);

module.exports = router;