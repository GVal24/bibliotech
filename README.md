# <img src="frontend/img/logo.png" alt="Logo Bibliotech" width="500" align="center">  

**Bibliotech** es una biblioteca digital que permite gestionar documentos digitales en formato PDF: subir, catalogar, visualizar, descargar y administrar el material bibliográfico. Cuenta con dos roles (Administrador y Cliente), arquitectura en N capas, validación modular, manejador de lenguaje y cumple con los principios SOLID.

---
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
* **Validación modular + Manejador de lenguaje:** Validación desacoplada del dominio y mensajes centralizados.
* **Frontend "Zero innerHTML":** Manipulación del DOM 100% nativa.
* **Sostenibilidad de Software:** Enfoque modular y reutilizable.

## Tecnologías Utilizadas

### Backend
* **Node.js & Express:** Servidor robusto y escalable.
* **Multer:** Gestión de subida de archivos PDF.
* **MySQL/MariaDB:** Persistencia relacional con procedimientos almacenados.
* **jsonwebtoken & bcrypt:** Autenticación y autorización por roles (JWT).
* **dotenv/cors:** Configuración y CORS.

### Frontend
* **Vanilla JavaScript:** Lógica pura, sin frameworks pesados.
* **W3.CSS:** CSS ligero y responsivo.
* **Web Components:** UI dinámica mediante nodos nativos.

---

## Configuración e Instalación

### Inicialización del Backend
```bash
cd backend
npm install
```

### Variables de entorno (.env) en backend/
```bash
PORT=3000
DB_HOST=localhost
DB_USER=bibliotech
DB_PASS=bibliotech
DB_NAME=bibliotech
JWT_SECRET=tu_clave_secreta_super_segura
NODE_ENV=production
```

### Base de datos
Ejecutar backend/config/init.sql en MySQL/MariaDB para crear esquema, usuario con privilegios mínimos (SELECT, EXECUTE), tablas, roles y SPs.

## Estructura del Proyecto

```bash
backend/
  config/          # db, multer, init.sql, delete.sql
  controllers/     # Lógica de negocio
  middleware/      # Autenticación/autorización
  repositories/    # Acceso a datos (SPs)
  routes/          # Rutas API
  uploads/documents/ # Almacenamiento de PDFs
  utils/           # Helpers, validación modular, manejador de lenguaje
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
```

## Uso

1. Configurar .env y base de datos.
2. Iniciar backend:
```bash
node server.js (desde backend/)
```
4. Acceder desde frontend (vistas servidas por Express).
5. Roles: Admin (gestiona documentos) / Client (consulta y descarga).
