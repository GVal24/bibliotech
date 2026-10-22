# <img src="frontend/img/logo.png" alt="Logo Bibliotech" width="500" align="center">

**Bibliotech** es una **aplicación web** de arquitectura **cliente-servidor de N capas** con **API REST**: el frontend (HTML + JavaScript vanilla) consume endpoints REST servidos por Node.js/Express, que persisten datos en MySQL/MariaDB mediante procedimientos almacenados. Permite gestionar documentos digitales (PDF, EPUB, ofimática, imágenes, audio y video): subir, catalogar, visualizar, descargar y administrar el material bibliográfico. Cuenta con tres roles (Administrador, Profesor y Estudiante), validación modular (filtros), manejador de lenguaje y cumple con los principios SOLID.

> **Tipo de sistema:** Aplicación Web (multipágina) — Arquitectura de N capas con API REST.
> No es una SPA con framework: las vistas son HTML servidas por Express y la lógica de UI es JavaScript nativo.

---

## 🎯 Características Principales

* 📚 **Gestión documental:** Subida de archivos (PDF, EPUB, ofimática, imágenes y media) con metadatos (título, autor, ISBN, categoría/materia, año, descripción).
* 👀 **Lectura online pública:** Visualización del material en el sitio para cualquier usuario, sin iniciar sesión.
* 🔒 **Descarga sólo para registrados:** Los visitantes anónimos pueden leer online; descargar exige tener una cuenta.
* 🧑‍🤝‍🧑 **Tres roles:** Student (consulta, propone y descarga), Professor (publica y aprueba) y Administrador (gestión total + roles).
* ✅ **Flujo de aprobación:** El material de los Students se revisa antes de publicarse.
* ♻️ **Baja de usuario sin perder material:** Al eliminar un usuario sus documentos **se conservan** (quedan "sin dueño", `user_id = NULL`).
* ♿ **Accesibilidad:** El navbar incluye un **ícono de accesibilidad** con un panel y deslizador para agrandar el texto de todo el sitio **hasta el 200%**, pensado para personas con baja visión (se guarda en `localStorage`).
* 🏗️ **Arquitectura limpia:** Separación de responsabilidades entre controladores, repositorios, servicios y utilidades (N capas).
* 🧩 **Validación modular (filtros) + Manejador de lenguaje:** Validación desacoplada del dominio y mensajes centralizados ES/EN.
* 📂 **Control de tipos de archivo:** Lista blanca de extensiones (ver *Formatos admitidos*) y límite de tamaño.
* 🛡️ **Frontend "Zero innerHTML":** Manipulación del DOM 100% nativa.
* 🌱 **Sostenibilidad de Software:** Enfoque modular y reutilizable.

## 🛠️ Tecnologías Utilizadas

### Backend
* 🟢 **Node.js & Express:** Servidor robusto y escalable.
* 📤 **Multer:** Gestión de subida de archivos (disco local o Cloudinary).
* ☁️ **Cloudinary:** Almacenamiento de archivos en la nube (modo deploy).
* 🗄️ **MySQL/MariaDB:** Persistencia relacional con procedimientos almacenados.
* 🔑 **jsonwebtoken & bcrypt:** Autenticación y autorización por roles (JWT).
* ⚙️ **dotenv/cors:** Configuración y CORS.

### Frontend
* 🟨 **Vanilla JavaScript:** Lógica pura, sin frameworks pesados.
* 🎨 **W3.CSS:** CSS ligero y responsivo.
* 🧱 **Web Components:** UI dinámica mediante nodos nativos.

---

## 🚦 Flujo de roles y aprobación

| Rol | Puede hacer |
| --- | --- |
| **Student** | Consulta el catálogo público y puede **proponer material** (queda en estado `pending` hasta ser aprobado). |
| **Professor** | Publica material **directamente**, **aprueba/rechaza** lo propuesto por los Students y puede **borrar documentos** del catálogo. |
| **Admin** | Todo: gestión de documentos, usuarios y asignación de roles. |

El catálogo es de **acceso público**: un visitante sin cuenta puede **leer online** el material sin iniciar sesión. La **descarga** y la **subida** son exclusivas de usuarios registrados.

---

## 📂 Estructura del Proyecto

```bash
backend/
  config/          # db, multer, cloudinaryConfig, init.sql (local), init.cloud.sql (nube), delete.sql
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

---

## ⚙️ Configuración e Instalación

### Inicialización del Backend
```bash
cd backend
npm install
```

### Variables de entorno (`.env`)
Copiar `backend/.env.example` a `backend/.env` y ajustar:

```bash
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=bibliotech
DB_PASS=bibliotech
DB_NAME=bibliotech
DB_SSL=false
JWT_SECRET=tu_clave_secreta_super_segura
NODE_ENV=production
# Opcional: si se definen las tres, los archivos se guardan en Cloudinary (modo deploy);
# si se dejan vacías, se guardan en el disco local (uploads/).
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Base de datos
Con MySQL/MariaDB corriendo en `localhost:3306`, ejecutar como administrador:

```bash
mysql -u root -h 127.0.0.1 -P 3306 < backend/config/init.sql
```

Crea el esquema `bibliotech`, el usuario `bibliotech` con privilegios mínimos (SELECT, EXECUTE), las tablas, los roles (`admin`, `professor`, `student`) y los procedimientos almacenados. Incluye datos de prueba.
Si tu servidor usa otro puerto (p. ej. 3307), ajustá `DB_*` en el `.env`.

---

## ☁️ Deploy en la nube (Aiven + Render + Cloudinary)

La aplicación está publicada y no depende de la PC de desarrollo:

* 🖥️ **Backend + frontend:** [Render](https://render.com) (Web Service, plan Free).
* 🗄️ **Base de datos:** [Aiven for MySQL](https://aiven.io) (plan Free) — soporta **procedimientos almacenados**, requisito de este proyecto.
* ☁️ **Archivos:** [Cloudinary](https://cloudinary.com) — los documentos subidos se guardan en la nube (el disco de Render es efímero).

### Modo dual (detección automática)

* **Base de datos:** `config/db.js` usa `DB_HOST/DB_PORT/DB_USER/DB_PASS/DB_NAME` y activa SSL con `DB_SSL=true` (Aiven lo exige).
* **Almacenamiento:** `config/multerConfig.js` usa **Cloudinary** si existen las variables `CLOUDINARY_*`; si no, cae al disco local (`uploads/`).

### Variables de entorno en Render

```
NODE_ENV=production
JWT_SECRET=<clave aleatoria larga>
DB_HOST=<host de Aiven>
DB_PORT=<puerto de Aiven>
DB_USER=avnadmin
DB_PASS=<password de Aiven>
DB_NAME=defaultdb
DB_SSL=true
CLOUDINARY_CLOUD_NAME=<cloud name>
CLOUDINARY_API_KEY=<api key>
CLOUDINARY_API_SECRET=<api secret>
```

### Configuración del servicio en Render

* **Root Directory:** `backend`
* **Build Command:** `npm install`
* **Start Command:** `node server.js`
* **Instance Type:** `Free`

> En el plan Free el servicio **se duerme** tras ~15 min de inactividad: la primera visita puede tardar ~50 s en despertar (conviene abrir la URL un rato antes de una demo/examen).

---

## 👥 Usuarios de prueba

El script `init.cloud.sql` (y también `init.sql`) carga tres usuarios listos para usar, uno por rol (contraseña **`12345`** para todos):

| Usuario | Contraseña | Rol | Para qué sirve |
| --- | --- | --- | --- |
| `admin` | `12345` | **Administrador** | Gestión total: documentos, usuarios y **asignación de roles**. |
| `profe` | `12345` | **Profesor** | Publica material directo y aprueba/rechaza lo propuesto. |
| `pepe` | `12345` | **Estudiante** | Consulta el catálogo y propone material (queda `pending`). |

> ⚠️ No cambies el rol del propio `admin`: perderías el acceso de administrador.

---

## ▶️ Uso

1. Configurar el `.env` y la base de datos.
2. Iniciar el backend (desde `backend/`):
```bash
node server.js
```
3. Acceder desde el navegador a `http://localhost:3000` (página de inicio).
4. Roles: Admin (gestión total y roles) / Professor (publica y aprueba) / Student (consulta, propone y descarga).

---

## 📎 Formatos admitidos

Bibliotech acepta los siguientes formatos de archivo (por extensión, **hasta 10 MB**):

* 📄 **Documentos/libros:** `pdf`, `epub`, `doc`, `docx`, `odt`, `rtf`, `txt`, `md`, `djvu`, `mobi`, `azw3`
* 📊 **Planillas y presentaciones:** `ppt`, `pptx`, `xls`, `xlsx`, `csv`, `ods`, `odp`
* 🖼️ **Imágenes:** `jpg`, `jpeg`, `png`, `gif`, `webp`, `bmp`, `tiff`, `svg`
* 🎵 **Audio:** `mp3`, `wav`, `ogg`, `m4a`, `flac`
* 🎬 **Video:** `mp4`, `webm`, `ogv`, `mov`

La lista se encuentra en `backend/config/multerConfig.js` (`ALLOWED_EXTENSIONS`) y los `Content-Type` en `backend/controllers/documentController.js` (`CONTENT_TYPES`).
