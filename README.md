# <img src="frontend/img/logo.jfif" width="200" align="center">  Bibliotech

**Bibliotech** es una biblioteca digital que permite gestionar documentos digitales en formato PDF: subir, catalogar, visualizar, descargar y administrar el material bibliográfico. Cuenta con dos roles (Administrador y Cliente), arquitectura en N capas, validación modular, manejador de lenguaje y cumple con principios SOLID.
**Bibliotech** es una biblioteca digital que permite gestionar documentos digitales en formato PDF: subir, catalogar, visualizar, descargar y administrar el material bibliográfico. Cuenta con dos roles (Administrador y Cliente), arquitectura en N capas, validación modular, manejador de lenguaje y cumple con principios SOLID.

---

## Características Principales
## Características Principales

* **Gestión documental:** Subida de archivos PDF con metadatos (título, autor, ISBN, categoría/materia, año, descripción).
* **Lectura y descarga:** Visualización cómoda del PDF directamente en el sitio + opción para descargarlo.
* **Dos roles:** Cliente (consulta/visualización/descarga) y Administrador (alta, baja, modificación de documentos y gestión básica).
* **Arquitectura limpia:** Separación de responsabilidades entre controladores, repositorios, servicios y utilidades, cumpliendo con la estructura de N capas.
* **Validación modular + Manejador de lenguaje:** Validación desacoplada del dominio y mensajes centralizados (reutilizable).
* **Frontend "Zero innerHTML":** Manipulación del DOM 100% nativa.
* **Gestión documental:** Subida de archivos PDF con metadatos (título, autor, ISBN, categoría/materia, año, descripción).
* **Lectura y descarga:** Visualización cómoda del PDF directamente en el sitio + opción para descargarlo.
* **Dos roles:** Cliente (consulta/visualización/descarga) y Administrador (alta, baja, modificación de documentos y gestión básica).
* **Arquitectura limpia:** Separación de responsabilidades entre controladores, repositorios, servicios y utilidades, cumpliendo con la estructura de N capas.
* **Validación modular + Manejador de lenguaje:** Validación desacoplada del dominio y mensajes centralizados (reutilizable).
* **Frontend "Zero innerHTML":** Manipulación del DOM 100% nativa.
* **Sostenibilidad de Software:** Enfoque modular y reutilizable inspirado en GREENSOFT.

## Tecnolog�as Utilizadas

### Backend
* **Node.js & Express:** Servidor robusto y escalable.
* **Multer:** Gestión de subida de archivos PDF.
* **Multer:** Gestión de subida de archivos PDF.
* **MySQL/MariaDB:** Persistencia relacional con procedimientos almacenados (SPs).
* **jsonwebtoken & bcrypt:** Autenticación y autorización por roles (JWT).
* **dotenv/cors:** Configuración y CORS.
* **jsonwebtoken & bcrypt:** Autenticación y autorización por roles (JWT).
* **dotenv/cors:** Configuración y CORS.

### Frontend
* **Vanilla JavaScript:** Lógica pura, sin frameworks pesados.
* **Vanilla JavaScript:** Lógica pura, sin frameworks pesados.
* **W3.CSS:** CSS ligero y responsivo.
* **Web Components (Custom):** UI din�mica mediante nodos nativos.

---

## Configuraci�n e Instalaci�n

### Inicializaci�n del Backend
`ash
cd backend
npm install
`

### Variables de entorno (.env) en backend/
`	ext
PORT=3000
DB_HOST=localhost
DB_USER=bibliotech
DB_PASS=bibliotech
DB_NAME=bibliotech
JWT_SECRET=tu_clave_secreta_super_segura
NODE_ENV=production
`

### Base de datos
Ejecutar ackend/config/init.sql en MySQL/MariaDB para crear esquema, usuario con privilegios m�nimos (SELECT, EXECUTE), tablas, roles y SPs.

## Estructura del Proyecto

`	ext
backend/
  config/          # db, multer, init.sql, delete.sql
  controllers/     # L�gica de negocio
  middleware/      # Autenticaci�n/autorizaci�n
  repositories/    # Acceso a datos (SPs)
  routes/          # Rutas API
  uploads/documents/ # Almacenamiento de PDFs
  utils/           # Helpers, validaci�n modular, manejador de lenguaje
frontend/
  css/             # Estilos
  html/            # Vistas (cliente/admin/login/registro)
  img/             # Activos visuales
  js/
    components/    # UI handlers
    frontControllers/ # Controladores frontend
    services/      # apiService
    utils/         # authHelper
    tests/         # Tests
`

## Uso

1. Configurar .env y base de datos.
2. Iniciar backend: 
ode server.js (desde ackend/).
3. Acceder desde frontend (vistas servidas por Express).
4. Roles: dmin (gestiona documentos) / client (consulta y descarga).
