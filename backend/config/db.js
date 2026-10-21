
/**
 * Importar módulo/"biblioteca" para gestionar base de datos
 */
const mysql = require('mysql2');

/**
 * Crear un pool de conexiones 
 * se usan variables de entorno  del archivo .env.
 */
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    // Algunos proveedores gestionados (Railway, Aiven, etc.) exigen SSL.
    // Se activa con DB_SSL=true en las variables de entorno.
    ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {}),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


// Exportar la promesa del pool para usar async/await en los repositorios
module.exports = pool.promise();
