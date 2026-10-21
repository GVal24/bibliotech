/**
*    Project     : Bibliotech
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

/**
 * Configuración de Cloudinary (almacenamiento de archivos en la nube).
 *
 * En producción (Render) el disco del servidor es efímero: se borra en cada
 * reinicio/redeploy. Para que el material subido persista, los archivos se
 * guardan en Cloudinary en lugar del disco local.
 *
 * Si NO hay credenciales configuradas (desarrollo local), el sistema usa el
 * disco local como antes, de modo que se puede trabajar sin cuenta de Cloudinary.
 *
 * Variables de entorno requeridas para usar la nube:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 */

const cloudinary = require('cloudinary').v2;

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// ¿Están las tres credenciales presentes? Solo entonces usamos Cloudinary.
const isConfigured = Boolean(cloudName && apiKey && apiSecret);

if (isConfigured) {
    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true
    });
}

module.exports = {
    cloudinary,
    isConfigured
};
