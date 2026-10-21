SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

-- 1. Creación o borrado de la base de datos si existe
DROP DATABASE IF EXISTS bibliotech;
CREATE DATABASE bibliotech;
USE bibliotech;

-- 2. Configuración de usuario de DB (Restricción de privilegios)
-- creamos la identidad (si no existe)
CREATE USER IF NOT EXISTS 'bibliotech'@'localhost' IDENTIFIED BY 'bibliotech';

-- Asignamos los permisos específicos
-- Aplicamos SELECT para lectura y EXECUTE para poder invocar los Stored Procedures.
GRANT SELECT, EXECUTE ON bibliotech.* TO 'bibliotech'@'localhost';

-- 3. Tabla de Roles
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE
);

-- 4. Tabla de Usuarios
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla Intermedia: users_roles
CREATE TABLE users_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- 6. Tabla de Documentos
--    status: máquina de estados del flujo de aprobación (patrón State)
--      pending  -> subido por un Student, espera revisión de Professor/Admin
--      approved -> visible en el catálogo público
--      rejected -> rechazado por Professor/Admin, no se comparte
--    user_id: puede quedar NULL (ON DELETE SET NULL). Al dar de baja un usuario,
--    su material se CONSERVA en la biblioteca (pasa a "sin dueño").
CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    filename VARCHAR(255) NOT NULL,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    year INT NULL, description TEXT NULL, isbn VARCHAR(20) NULL, author VARCHAR(150) NULL,
    file_path VARCHAR(255) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 7. InserciA3n de Datos Maestros (Roles)
--    Roles del sistema: admin (rompe todo), professor (publica y aprueba),
--    student (consulta y propone material que debe aprobarse).
INSERT INTO roles (name) VALUES ('admin'), ('professor'), ('student');

-- 8. Datos de prueba iniciales (pass: 12345 para todos)
-- Usuario 'admin' -> Rol Admin
INSERT INTO users (id, username, password) VALUES (1, 'admin', '$2b$10$.n0s847tiSxBqDvIo6Vg5ujXC5zIUmm98bTjBWnRdqX9CxxbIo7wS');
INSERT INTO users_roles (user_id, role_id) VALUES (1, 1);

-- Usuario 'profe' -> Rol Professor
INSERT INTO users (id, username, password) VALUES (2, 'profe', '$2b$10$.n0s847tiSxBqDvIo6Vg5ujXC5zIUmm98bTjBWnRdqX9CxxbIo7wS');
INSERT INTO users_roles (user_id, role_id) VALUES (2, 2);

-- Usuario 'pepe' -> Rol Student
INSERT INTO users (id, username, password) VALUES (3, 'pepe', '$2b$10$.n0s847tiSxBqDvIo6Vg5ujXC5zIUmm98bTjBWnRdqX9CxxbIo7wS');
INSERT INTO users_roles (user_id, role_id) VALUES (3, 3);

-- ==========================================================
-- 9. PROCEDIMIENTOS ALMACENADOS (Stored Procedures)
-- ==========================================================

DELIMITER //

-- --- PROCEDIMIENTOS PARA USERS ---

-- Buscar usuario por username (con su rol)
CREATE PROCEDURE sp_find_user_by_username(IN p_username VARCHAR(50))
BEGIN
    SELECT u.*, r.name as role 
    FROM users u
    JOIN users_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE u.username = p_username;
END //

-- Crear nuevo usuario y asignar rol por nombre
CREATE PROCEDURE sp_create_user(
    IN p_username VARCHAR(50), 
    IN p_password VARCHAR(255), 
    IN p_role_name VARCHAR(20)
)
BEGIN
    DECLARE v_user_id INT;
    DECLARE v_role_id INT;

    INSERT INTO users (username, password) VALUES (p_username, p_password);
    SET v_user_id = LAST_INSERT_ID();

    SELECT id INTO v_role_id FROM roles WHERE name = p_role_name;
    INSERT INTO users_roles (user_id, role_id) VALUES (v_user_id, v_role_id);
    
    SELECT v_user_id as insertId;
END //

-- Listar todos los usuarios
CREATE PROCEDURE sp_find_all_users()
BEGIN
    SELECT u.id, u.username, r.name as role, u.created_at 
    FROM users u
    JOIN users_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id;
END //

-- Borrar usuario
CREATE PROCEDURE sp_delete_user(IN p_id INT)
BEGIN
    DELETE FROM users WHERE id = p_id;
END //

-- Cambiar el rol de un usuario (el Admin asigna Professor, por ejemplo).
-- Reemplaza TODOS los roles del usuario por el nuevo.
CREATE PROCEDURE sp_update_user_role(IN p_user_id INT, IN p_role_name VARCHAR(20))
BEGIN
    DECLARE v_role_id INT;

    SELECT id INTO v_role_id FROM roles WHERE name = p_role_name;

    -- Si el rol no existe, no hacemos nada (evita dejar al usuario sin rol)
    IF v_role_id IS NOT NULL THEN
        DELETE FROM users_roles WHERE user_id = p_user_id;
        INSERT INTO users_roles (user_id, role_id) VALUES (p_user_id, v_role_id);
    END IF;
END //

-- --- PROCEDIMIENTOS PARA DOCUMENTOS (catálogo compartido de la biblioteca) ---

-- Listar todo el catálogo PÚBLICO (solo documentos aprobados)
CREATE PROCEDURE sp_find_all_documents()
BEGIN
    SELECT d.id, d.title, d.author, d.isbn, d.category, d.year, d.description,
           d.filename, d.file_path, d.status, d.created_at, u.username AS uploaded_by
    FROM documents d
    LEFT JOIN users u ON d.user_id = u.id
    WHERE d.status = 'approved'
    ORDER BY d.created_at DESC;
END //

-- Buscar documentos aprobados por título, autor, ISBN o categoría
CREATE PROCEDURE sp_search_documents(IN p_term VARCHAR(200))
BEGIN
    SELECT d.id, d.title, d.author, d.isbn, d.category, d.year, d.description,
           d.filename, d.file_path, d.status, d.created_at, u.username AS uploaded_by
    FROM documents d
    LEFT JOIN users u ON d.user_id = u.id
    WHERE d.status = 'approved'
      AND (d.title LIKE CONCAT('%', p_term, '%')
        OR d.author LIKE CONCAT('%', p_term, '%')
        OR d.isbn LIKE CONCAT('%', p_term, '%')
        OR d.category LIKE CONCAT('%', p_term, '%'))
    ORDER BY d.created_at DESC;
END //

-- Listar los documentos subidos por un usuario (usado al dar de baja un administrador)
CREATE PROCEDURE sp_find_documents_by_user(IN p_user_id INT)
BEGIN
    SELECT * FROM documents WHERE user_id = p_user_id;
END //

-- Listar documentos por estado (usado por Professor/Admin para la cola de aprobación)
CREATE PROCEDURE sp_find_documents_by_status(IN p_status VARCHAR(20))
BEGIN
    SELECT d.id, d.title, d.author, d.isbn, d.category, d.year, d.description,
           d.filename, d.file_path, d.status, d.created_at, u.username AS uploaded_by
    FROM documents d
    LEFT JOIN users u ON d.user_id = u.id
    WHERE d.status = p_status
    ORDER BY d.created_at DESC;
END //

-- Obtener un documento por su id
CREATE PROCEDURE sp_find_document_by_id(IN p_id INT)
BEGIN
    SELECT d.id, d.title, d.author, d.isbn, d.category, d.year, d.description,
           d.filename, d.file_path, d.status, d.created_at, u.username AS uploaded_by
    FROM documents d
    LEFT JOIN users u ON d.user_id = u.id
    WHERE d.id = p_id;
END //

-- Agregar un documento a la biblioteca.
-- El estado inicial lo decide el controlador según el rol (State):
--   professor/admin -> 'approved' (publica directo)
--   student         -> 'pending'  (requiere aprobación)
CREATE PROCEDURE sp_create_document(
    IN p_user_id INT,
    IN p_filename VARCHAR(255),
    IN p_title VARCHAR(200), IN p_author VARCHAR(150), IN p_isbn VARCHAR(20),
    IN p_category VARCHAR(100), IN p_year INT, IN p_description TEXT,
    IN p_file_path VARCHAR(255), IN p_status VARCHAR(20)
)
BEGIN
    INSERT INTO documents (user_id, filename, title, author, isbn, category, year, description, file_path, status)
    VALUES (p_user_id, p_filename, p_title, p_author, p_isbn, p_category, p_year, p_description, p_file_path, p_status);
    SELECT LAST_INSERT_ID() as insertId;
END //

-- Cambiar el estado de un documento (aprobar / rechazar). Solo Professor/Admin.
CREATE PROCEDURE sp_set_document_status(IN p_id INT, IN p_status VARCHAR(20))
BEGIN
    UPDATE documents SET status = p_status WHERE id = p_id;
END //

-- Actualizar los metadatos de un documento (solo administrador)
CREATE PROCEDURE sp_update_document(
    IN p_id INT,
    IN p_title VARCHAR(200), IN p_author VARCHAR(150), IN p_isbn VARCHAR(20),
    IN p_category VARCHAR(100), IN p_year INT, IN p_description TEXT
)
BEGIN
    UPDATE documents
    SET title = p_title, author = p_author, isbn = p_isbn,
        category = p_category, year = p_year, description = p_description
    WHERE id = p_id;
END //

-- Borrar un documento de la biblioteca (solo administrador)
CREATE PROCEDURE sp_delete_document(IN p_id INT)
BEGIN
    DELETE FROM documents WHERE id = p_id;
END //

DELIMITER ;
SET foreign_key_checks = 1;