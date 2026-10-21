# <img src="frontend/img/logo.png" alt="Logo Bibliotech" width="500" align="center">  

**Bibliotech** es una **aplicación web** de arquitectura **cliente-servidor de N capas** con **API REST**: el frontend (HTML + JavaScript vanilla) consume endpoints REST servidos por Node.js/Express, que persisten datos en MySQL/MariaDB mediante procedimientos almacenados. Permite gestionar documentos digitales en formato PDF: subir, catalogar, visualizar, descargar y administrar el material bibliográfico. Cuenta con tres roles (Administrador, Profesor y Estudiante), validación modular (filtros), manejador de lenguaje y cumple con los principios SOLID.

> **Tipo de sistema:** Aplicación Web (multipágina) — Arquitectura de N capas con API REST.
> No es una SPA con framework: las vistas son HTML servidas por Express y la lógica de UI es JavaScript nativo.

---

## Identidad visual y temas

El proyecto usa el logo institucional (`frontend/img/logo.png`) en el navbar de todas las vistas,
en las pantallas de acceso (login/registro) y en grande en la **página de inicio** (`/`).

La identidad visual se basa en los colores del logo: **azul marino** y **celeste**.
Incluye un **selector de tema** (arriba a la derecha) que alterna en caliente entre dos paletas
y recuerda la elección en `localStorage`:

| Tema | Descripción |
| --- | --- |
| **Océano** (por defecto) | Azul marino profundo (`#04203c`) + texto blanco azulado + acentos celeste (`#4db8ff`). |
| **Celeste** (claro) | Fondo celeste claro (`#eaf4fb`) + texto azul marino + acento azul vivo (`#0078d8`). |

Los colores se definen como variables CSS en `frontend/css/style.css` bajo
`:root`/`[data-theme="oceano"]` y `[data-theme="celeste"]`, y el cambio lo gestiona
`frontend/js/utils/themeSwitcher.js`. Para agregar un tema nuevo basta con añadir un bloque
`[data-theme="..."]` y sumar la entrada en la constante `THEMES` del script.

### Páginas
* `/` (o `/home`, `/landing`) — página de inicio con hero, logo y botones al catálogo/login.
* `/catalog` — catálogo público de la biblioteca.
* `/login`, `/register` — acceso y registro.
* `/professor-dashboard`, `/admin-dashboard` — paneles por rol.

---

## Flujo de roles y aprobación
| Rol | Puede hacer |
| --- | --- |
| **Student** | Consulta el catálogo público y puede **proponer material** (queda en estado `pending` hasta ser aprobado). |
| **Professor** | Publica material **directamente**, **aprueba/rechaza** lo propuesto por los Students y puede **borrar documentos** del catálogo. |
| **Admin** | Todo: gestión de documentos, usuarios y asignación de roles. |

Estados de un documento (patrón *State*):

```
Student sube         Professor/Admin aprueba
  -> [pending] --------------------------> [approved]  (visible en el catálogo público)
       |  Professor/Admin rechaza
       +---------------------------------> [rejected]
Professor/Admin sube -> [approved] (publica directo)
```

El catálogo (`GET /api/documents`) es de **acceso público**: un visitante sin cuenta
puede **leer online** el material sin iniciar sesión. La **descarga** y la **subida**
son exclusivas de usuarios registrados.

## Características Principales

* **Gestión documental:** Subida de archivos (PDF, EPUB, documentos de oficina, imágenes y media) con metadatos (título, autor, ISBN, categoría/materia, año, descripción).
* **Lectura online pública:** Visualización del material en el sitio para cualquiera.
* **Descarga sólo para registrados:** Los visitantes anónimos pueden leer online; descargar exige cuenta.
* **Tres roles:** Student (consulta, propone y descarga), Professor (publica y aprueba) y Administrador (gestión total + roles).
* **Flujo de aprobación:** El material de los Students se revisa antes de publicarse.
* **Baja de usuario sin perder material:** Al eliminar un usuario, sus documentos y archivos **se conservan** (quedan "sin dueño", `user_id = NULL`), preservando el catálogo de la biblioteca.
* **Arquitectura limpia:** Separación de responsabilidades entre controladores, repositorios, servicios y utilidades, cumpliendo con la estructura de N capas.
* **Validación modular (filtros) + Manejador de lenguaje:** Validación desacoplada del dominio (reglas `required`, `minLength`, `maxLength`, `pattern`, `usernameFormat`, `emailFormat`, `strongPassword`) y mensajes centralizados ES/EN.
* **Control de tipos de archivo:** Lista blanca de extensiones (ver *Formatos admitidos*) y límite de tamaño.
* **Frontend "Zero innerHTML":** Manipulación del DOM 100% nativa.
* **Sostenibilidad de Software:** Enfoque modular y reutilizable (ver `../Patrones en Bibliotech.md`).

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
Copiar `backend/.env.example` a `backend/.env` y ajustar:
```bash
PORT=3000
DB_HOST=localhost
DB_USER=bibliotech
DB_PASS=bibliotech
DB_NAME=bibliotech
JWT_SECRET=tu_clave_secreta_super_segura
NODE_ENV=production
```
> El servidor carga el `.env` con `override: true` para que estas variables tengan
> prioridad sobre variables del sistema que puedan colisionar (por ejemplo `DB_NAME`).

### Base de datos
Con MySQL/MariaDB corriendo en `localhost:3306`, ejecutar como administrador:
```bash
mysql -u root -h 127.0.0.1 -P 3306 < backend/config/init.sql
```
Crea el esquema `bibliotech`, el usuario `bibliotech` con privilegios mínimos
(SELECT, EXECUTE), las tablas, los roles (`admin`, `professor`, `student`) y los
procedimientos almacenados. Incluye datos de prueba (`admin`, `profe`, `pepe`,
todos con contraseña `12345`).
Si tu servidor usa otro puerto (p. ej. 3307), ajustá `DB_*` en el `.env`.

## Estructura del Proyecto

```bash
backend/
  config/          # db, multer, init.sql, delete.sql
  controllers/     # Lógica de negocio
  middleware/      # Autenticación/autorización
  repositories/    # Acceso a datos (SPs)
  routes/          # Rutas API
  uploads/documents/ # Almacenamiento de archivos (servidos por endpoint, no estáticos)
  utils/           # Helpers, validación modular, manejador de lenguaje
frontend/
  css/             # Estilos (temas oceano/celeste)
  html/            # Vistas (landing/catálogo/professor/admin/login/registro)
  img/             # Activos visuales (logo, favicon)
  js/
    components/    # UI handlers
    frontControllers/ # Controladores frontend
    services/      # apiService
    utils/         # authHelper, themeSwitcher
    tests/         # Tests
```

## Uso

1. Configurar `.env` y la base de datos.
2. Iniciar el backend (desde `backend/`):
```bash
node server.js
```
3. Acceder desde el navegador a `http://localhost:3000` (página de inicio).
4. Roles: Admin (gestión total y roles) / Professor (publica y aprueba) / Student (consulta, propone y descarga).

## API (endpoints)

Autenticación:
* `POST /api/auth/register` — registro (crea un estudiante/Student por defecto).
* `POST /api/auth/login` — inicio de sesión (devuelve token y rol).

Documentos:
* `GET /api/documents` — catálogo público (solo aprobados, sin token).
* `GET /api/documents?q=término` — búsqueda por título/autor/ISBN/categoría (pública).
* `GET /api/documents/:id` — un documento (público).
* `GET /api/documents/:id/file` — **ver online** el archivo (público, `inline`).
* `GET /api/documents/:id/download?token=<jwt>` — **descargar** el archivo (solo registrados; `attachment`).
* `GET /api/documents/pending/list` — cola de pendientes (Profesor/Admin).
* `POST /api/documents/upload` — subir material (Student → `pending`; Profesor/Admin → `approved`).
* `POST /api/documents/:id/approve` — aprobar (Profesor/Admin).
* `POST /api/documents/:id/reject` — rechazar (Profesor/Admin).
* `PUT /api/documents/:id` — actualizar metadatos (solo admin).
* `DELETE /api/documents/:id` — eliminar documento (Profesor/Admin). El Student NO puede borrar.

> **Lectura pública vs. descarga:** cualquier visitante puede **leer online** el material
> aprobado (`/file`), pero **descargar** (`/download`) requiere sesión. Como `<a>`/`<embed>`
> no pueden enviar el header `Authorization`, el token viaja por query string (`?token=`).
> La carpeta `uploads/` **no** se sirve como estática: los archivos sólo se entregan por
> estos endpoints controlados.

Administración:
* `GET /api/admin/users` — listar usuarios (solo admin).
* `PUT /api/admin/users/:id/role` — asignar rol `admin`/`professor`/`student` (solo admin).
* `DELETE /api/admin/users/:id` — eliminar usuario (solo admin). **El material que subió NO se borra**: sus documentos quedan "sin dueño" (`user_id = NULL`) y se conservan en la biblioteca.

## Formatos de archivo admitidos

Una biblioteca digital útil no sólo guarda PDF. Se aceptan (por extensión, hasta 60 MB):

* **Documentos/libros:** `pdf`, `epub`, `doc`, `docx`, `odt`, `rtf`, `txt`, `md`, `djvu`, `mobi`, `azw3`
* **Planillas y presentaciones:** `ppt`, `pptx`, `xls`, `xlsx`, `csv`, `ods`, `odp`
* **Imágenes:** `jpg`, `jpeg`, `png`, `gif`, `webp`, `bmp`, `tiff`, `svg`
* **Audio:** `mp3`, `wav`, `ogg`, `m4a`, `flac`
* **Video:** `mp4`, `webm`, `ogv`, `mov`

La lista blanca vive en `backend/config/multerConfig.js` (`ALLOWED_EXTENSIONS`) y los
`Content-Type` en `backend/controllers/documentController.js` (`CONTENT_TYPES`).
