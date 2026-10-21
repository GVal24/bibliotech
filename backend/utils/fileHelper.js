/**
*    Project     : Bibliotech
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

/**
 * Node.js fs (File System) es un módulo nativo integrado que permite
 * interactuar con el sistema de archivos del sistema operativo
 * (leer, escribir, crear, borrar directorios y archivos).
 */
const fs = require('fs'); // para manejar el filesystem al borrar archivos

/**
 * El módulo path en Node.js es una utilidad integrada que permite
 * manejar y transformar rutas de archivos y directorios de forma
 * segura y consistente entre diferentes sistemas operativos.
 */
const path = require('path'); // para el manejo de rutas

const { cloudinary, isConfigured } = require('../config/cloudinaryConfig');

/**
 * Extrae el public_id y el resource_type de una URL de Cloudinary.
 * Ej: https://res.cloudinary.com/demo/image/upload/v1699999/bibliotech/documents/123-x.pdf
 *     -> { publicId: 'bibliotech/documents/123-x', resourceType: 'image' }
 * @param {string} url
 * @returns {{publicId: string, resourceType: string}|null}
 */
function parseCloudinaryUrl(url) {
    const match = url.match(/\/(image|video|raw)\/upload\/(?:v\d+\/)?(.+)$/);
    if (!match) return null;

    const resourceType = match[1];
    let publicId = match[2];

    // Para 'image' y 'video' Cloudinary omite la extensión en el public_id;
    // para 'raw' la incluye.
    if (resourceType === 'raw') {
        return { publicId, resourceType };
    }
    publicId = publicId.replace(/\.[^/.]+$/, '');
    return { publicId, resourceType };
}

/**
 * Utilidad para gestionar archivos físicos / remotos
 */
const fileHelper =
{
    /**
     * Elimina un archivo, ya sea de Cloudinary (si la ruta es una URL) o del
     * disco local (si es una ruta relativa).
     * @param {string} pathOrUrl - Ruta guardada en la DB (puede ser /uploads/... o https://res.cloudinary.com/...)
     * @returns {Promise<boolean>}
     */
    async deleteFile(pathOrUrl)
    {
        if (!pathOrUrl) return false;

        // --- Archivo en Cloudinary ---
        if (/^https?:\/\//.test(pathOrUrl)) {
            if (!isConfigured) {
                console.warn(`⚠️ Cloudinary no configurado; no se borra: ${pathOrUrl}`);
                return false;
            }
            const parsed = parseCloudinaryUrl(pathOrUrl);
            if (!parsed) {
                console.warn(`⚠️ No se pudo interpretar la URL de Cloudinary: ${pathOrUrl}`);
                return false;
            }
            try {
                await cloudinary.uploader.destroy(parsed.publicId, {
                    resource_type: parsed.resourceType
                });
                console.log(`✅ Archivo eliminado de Cloudinary: ${parsed.publicId}`);
                return true;
            } catch (err) {
                console.error(`❌ Error al borrar en Cloudinary: ${err.message}`);
                return false;
            }
        }

        // --- Archivo en disco local ---
        /**
         * path.join maneja perfectamente la barra inicial si existe.
         * process.cwd() devuelve el directorio del proceso de Node.js.
         */
        const absolutePath = path.join(process.cwd(), pathOrUrl);

        try
        {
            if (fs.existsSync(absolutePath))
            {
                fs.unlinkSync(absolutePath);
                console.log(`✅ Archivo eliminado: ${pathOrUrl}`);
                return true;
            }
            console.warn(`⚠️ Archivo no encontrado: ${absolutePath}`);
        } catch (err) {
            console.error(`❌ Error al borrar archivo: ${err.message}`);
        }
        return false;
    }
};

module.exports = fileHelper;
