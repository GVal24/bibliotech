/**
*    Project     : Bibliotech
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

/**
 * Validador de contenido PDF.
 *
 * A diferencia del filtro de Multer (que solo mira el mimetype declarado
 * por el cliente y es falsificable), esta utilidad lee los "magic bytes"
 * del archivo real. Todo PDF comienza con la firma '%PDF-' dentro de los
 * primeros bytes del archivo (la especificación admite datos previos,
 * por eso se busca en una ventana inicial).
 */
const fs = require('fs');

const PDF_SIGNATURE = '%PDF-';
const HEAD_WINDOW = 1024; // bytes iniciales donde debe aparecer la firma

const pdfValidator = {
    /**
     * Verifica si un archivo en disco es realmente un PDF.
     * @param {string} absolutePath - Ruta absoluta del archivo.
     * @returns {boolean} true si contiene la firma PDF.
     */
    isPdf(absolutePath) {
        if (!absolutePath) return false;

        let fd;
        try {
            fd = fs.openSync(absolutePath, 'r');
            const buffer = Buffer.alloc(HEAD_WINDOW);
            const bytesRead = fs.readSync(fd, buffer, 0, HEAD_WINDOW, 0);
            return buffer.subarray(0, bytesRead).includes(PDF_SIGNATURE);
        }
        catch (err) {
            return false;
        }
        finally {
            if (fd !== undefined) fs.closeSync(fd);
        }
    }
};

module.exports = pdfValidator;
