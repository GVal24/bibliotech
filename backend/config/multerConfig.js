/**
*    Project     : Bibliotech
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

/**
 * Importación del módulo multer
 * Multer es un middleware de Node.js diseñado para Express, 
 * esencial para manejar la carga de archivos (imágenes, documentos, etc.)
 * enviados en formato multipart/form-data. Simplifica la gestión 
 * de archivos al permitir configuraciones de almacenamiento en disco 
 * o memoria, filtrado de tipos y límites de tamaño, añadiendo un objeto
 * file o files al objeto request.
 */
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary, isConfigured } = require('./cloudinaryConfig');

// 1. Definimos la ruta absoluta al directorio de subidas de documentos
// process.cwd() apunta a la raíz del proyecto donde se ejecutó 'node'
// (solo se usa como respaldo local cuando Cloudinary no está configurado).
const uploadDir = path.join(process.cwd(), 'uploads', 'documents');

// 2. Comprobación y creación de directorio en tiempo de inicialización
// Esto se ejecuta UNA SOLA VEZ cuando el servidor arranca.
if (!isConfigured && !fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`📁 Directorio creado automáticamente: ${uploadDir}`);
}

/**
 * Extensiones permitidas para material de una biblioteca digital:
 * documentos/libros, planillas, presentaciones, imágenes y media.
 * (fuente única de verdad para el filtro de subida).
 */
const ALLOWED_EXTENSIONS = [
    // Documentos / libros
    '.pdf', '.epub', '.doc', '.docx', '.odt', '.rtf', '.txt', '.md', '.djvu', '.mobi', '.azw3',
    // Planillas y presentaciones
    '.ppt', '.pptx', '.xls', '.xlsx', '.csv', '.ods', '.odp',
    // Imágenes
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg',
    // Audio
    '.mp3', '.wav', '.ogg', '.m4a', '.flac',
    // Video
    '.mp4', '.webm', '.ogv', '.mov'
];

/**
 * Configuración de almacenamiento de Multer.
 *
 * - Si Cloudinary está configurado, los archivos se suben a la nube (persisten
 *   entre reinicios). req.file.path = URL segura, req.file.filename = public_id.
 * - Si no, se guardan en disco local como tradicionalmente.
 */
const storage = isConfigured
    ? new CloudinaryStorage({
        cloudinary,
        params: {
            folder: 'bibliotech/documents',
            resource_type: 'auto',
            // public_id único: timestamp + nombre original (sin extensión)
            public_id: (req, file) => {
                const ext = path.extname(file.originalname);
                const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
                return Date.now() + '-' + base;
            }
        }
    })
    : multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDir); // Carpeta donde se guardarán físicamente los archivos
        },
        filename: (req, file, cb) => {
            // Renombramos el archivo: timestamp + nombre original para que sea único
            cb(null, Date.now() + '-' + file.originalname);
        }
    });

/**
 * Filtro de primer nivel: acepta sólo las extensiones de la lista blanca.
 * El mimetype lo declara el cliente y es falsificable, por eso la decisión
 * se toma por la extensión del archivo y no por el mimetype.
 */
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (ALLOWED_EXTENSIONS.includes(ext)) {
        cb(null, true);
    }
    else if (ext === '') {
        // Sin extensión: caso típico cuando Windows oculta extensiones.
        const error = new Error('El archivo "' + file.originalname + '" no tiene extensión.');
        error.status = 400;
        error.code = 'NO_EXTENSION';
        cb(error, false);
    }
    else {
        const error = new Error('Extensión "' + ext + '" no permitida. Permitidas: ' + ALLOWED_EXTENSIONS.join(', '));
        error.status = 400;
        error.code = 'BAD_EXTENSION';
        error.extension = ext;
        cb(error, false);
    }
};

// Límite de tamaño (60 MB) para evitar subidas desmedidas.
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 60 * 1024 * 1024 }
});

// 'documentFile' es el nombre del campo en el formulario
module.exports = upload.single('documentFile');
module.exports.ALLOWED_EXTENSIONS = ALLOWED_EXTENSIONS;
module.exports.usingCloudinary = isConfigured;
