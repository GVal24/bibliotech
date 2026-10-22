# <img src="frontend/img/logo.png" alt="Logo Bibliotech" width="500" align="center">

**Bibliotech** es una **aplicación web** de arquitectura **cliente-servidor de N capas** con **API REST**: el frontend (HTML + JavaScript vanilla) consume endpoints REST servidos por Node.js/Express, que persisten datos en MySQL/MariaDB mediante procedimientos almacenados. Permite gestionar documentos digitales (PDF, EPUB, ofimática, imágenes, audio y video): subir, catalogar, visualizar, descargar y administrar el material bibliográfico. Cuenta con tres roles (Administrador, Profesor y Estudiante), validación modular (filtros), manejador de lenguaje y cumple con los principios SOLID.

> **Tipo de sistema:** Aplicación Web (multipágina) — Arquitectura de N capas con API REST.
> No es una SPA con framework: las vistas son HTML servidas por Express y la lógica de UI es JavaScript nativo.

---

## 🎯 Características Principales

* **Gestión documental:** Subida de archivos (PDF, EPUB, ofimática, imágenes y media) con metadatos (título, autor, ISBN, categoría/materia, año, descripción).
* **Lectura online pública:** Visualización del material en el sitio para cualquier usuario, sin iniciar sesión.
* **Descarga sólo para registrados:** Los visitantes anónimos pueden leer online, descargar exige tener una cuenta.
* **Tres roles:** Student (consulta, propone y descarga), Professor (publica y aprueba) y Administrador (gestión total + roles).
* **Flujo de aprobación:** El material de los Students se revisa antes de publicarse.
* **Baja de usuario sin perder material:** Al eliminar un usuario sus documentos **se conservan**.
* **Accesibilidad:** El navbar incluye un **ícono de accesibilidad** con un panel y deslizador para agrandar el texto de todo el sitio **hasta el 200%**, pensado para personas con baja visión.
* **Arquitectura limpia:** Separación de responsabilidades entre controladores, repositorios, servicios y utilidades (N capas).
* **Validación modular (filtros) + Manejador de lenguaje:** Validación desacoplada del dominio y mensajes centralizados ES/EN.
* **Control de tipos de archivo:** Lista blanca de extensiones (ver *Formatos admitidos*) y límite de tamaño.
* **Frontend "Zero innerHTML":** Manipulación del DOM 100% nativa.
* **Sostenibilidad de Software:** Enfoque modular y reutilizable.

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
| **Admin** | Control total: gestión de documentos, usuarios y asignación de roles. |

El catálogo es de **acceso público**: un visitante sin cuenta puede **leer online** el material sin iniciar sesión. La **descarga** y la **subida** son exclusivas de usuarios registrados.

---

## 📂 Estructura del Proyecto

```bash
bibliotech/
├── backend/
│   ├── config/
│   │   ├── db.js                  # Pool de conexiones MySQL/MariaDB (SSL opcional con DB_SSL)
│   │   ├── multerConfig.js        # Subida de archivos: lista blanca de extensiones y límite (10 MB)
│   │   ├── cloudinaryConfig.js    # Cliente de Cloudinary (almacenamiento en la nube, modo deploy)
│   │   ├── init.sql               # Esquema local: DB, usuario/GRANT, tablas, roles, SPs y datos de prueba
│   │   ├── init.cloud.sql         # Esquema para base gestionada (Aiven): sin CREATE DATABASE/USER/GRANT
│   │   └── delete.sql             # Limpieza del esquema (dropea objetos)
│   ├── controllers/
│   │   ├── authController.js      # Registro e inicio de sesión (JWT + bcrypt)
│   │   ├── documentController.js  # CRUD de documentos, ver/descargar, aprobar/rechazar
│   │   └── adminController.js     # Gestión de usuarios y asignación de roles
│   ├── middleware/
│   │   └── authMiddleware.js      # verifyToken, verifyTokenFromQuery, optionalToken y control de roles
│   ├── repositories/
│   │   ├── userRepo.js            # Acceso a datos de usuarios (vía stored procedures)
│   │   └── documentRepo.js        # Acceso a datos de documentos (vía stored procedures)
│   ├── routes/
│   │   ├── authRoutes.js          # Endpoints de identidad (/api/auth)
│   │   ├── documentRoutes.js      # Endpoints de documentos (/api/documents)
│   │   ├── adminRoutes.js         # Endpoints de administración (/api/admin)
│   │   ├── viewRoutes.js          # Enrutador de las vistas HTML (landing, catálogo, paneles)
│   │   └── testsRoutes.js         # Ruta condicional del laboratorio de pruebas
│   ├── uploads/
│   │   └── documents/             # Archivos en disco local (servidos por endpoint, NO estáticos)
│   ├── utils/
│   │   ├── fileHelper.js          # Borrado del archivo en el proveedor (Cloudinary o disco)
│   │   ├── pdfValidator.js        # Validaciones específicas de archivos PDF
│   │   ├── lang/
│   │   │   └── LanguageManager.js # Manejador de lenguaje (mensajes centralizados ES/EN)
│   │   └── validation/
│   │       ├── index.js               # Punto de entrada del motor de validación
│   │       ├── ValidationHandler.js   # Orquestador de reglas (validación modular / filtros)
│   │       ├── validators/
│   │       │   └── FieldValidator.js  # Validador de campos (Fluent Interface)
│   │       └── rules/                 # Reglas desacopladas (Principio Abierto/Cerrado)
│   │           ├── required.js
│   │           ├── minLength.js
│   │           ├── maxLength.js
│   │           ├── pattern.js
│   │           ├── emailFormat.js
│   │           ├── usernameFormat.js
│   │           └── strongPassword.js
│   ├── .env.example               # Plantilla de variables de entorno
│   ├── package.json               # Dependencias y scripts (start → node server.js)
│   └── server.js                  # Punto de entrada: configuración de Express y pipeline
├── frontend/
│   ├── css/
│   │   ├── style.css              # Estilos y temas (variables CSS: oceano / celeste)
│   │   └── w3.css                 # Framework estructural W3.CSS
│   ├── html/
│   │   ├── landing.html           # Página de inicio (hero, características y acceso)
│   │   ├── client-dashboard.html  # Vista del estudiante (catálogo, búsqueda y aportes)
│   │   ├── professor-dashboard.html # Panel del profesor (aprobaciones y catálogo)
│   │   ├── admin-dashboard.html   # Panel del administrador (documentos, aprobaciones, usuarios)
│   │   ├── login.html             # Inicio de sesión
│   │   ├── register.html          # Registro de usuario
│   │   └── tests.html             # Laboratorio de pruebas del frontend
│   ├── img/
│   │   ├── logo.png               # Logotipo de Bibliotech
│   │   └── favicon.png            # Ícono del sitio
│   └── js/
│       ├── components/
│       │   └── uiHandlers.js      # Constructores de UI dinámica (Zero innerHTML)
│       ├── frontControllers/
│       │   ├── landingFrontController.js    # Lógica de la landing (sesión y acceso)
│       │   ├── authFrontController.js       # Lógica de login/registro
│       │   ├── documentsFrontController.js  # Lógica del catálogo, visor y aportes
│       │   ├── professorFrontController.js  # Lógica del panel del profesor
│       │   └── adminFrontController.js      # Lógica del panel del administrador
│       ├── services/
│       │   └── apiService.js      # Cliente Fetch hacia la API (inyecta el JWT)
│       ├── utils/
│       │   ├── authHelper.js      # Ciclo de vida de la sesión (localStorage, token, roles)
│       │   ├── themeSwitcher.js   # Selector de tema (oceano/celeste) persistente
│       │   ├── fontSizeControl.js # Control de accesibilidad: tamaño de texto (hasta 200%)
│       │   └── landingAnimations.js # Animaciones y revelado al scroll de la landing
│       └── tests/
│           ├── testUtils.js       # Utilidades del framework de pruebas
│           ├── authTests.js       # Pruebas de autenticación/identidad
│           ├── documentTests.js   # Pruebas de documentos
│           └── adminTests.js      # Pruebas de administración
├── .gitignore
├── AUTHORS.md
├── LICENSE
└── README.md
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

* 🖥️ **Backend + frontend:** [Render](https://render.com) (Web Service).
* 🗄️ **Base de datos:** [Aiven for MySQL](https://aiven.io).
* ☁️ **Archivos:** [Cloudinary](https://cloudinary.com).

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

> El servicio **se duerme** tras ~15 min de inactividad: la primera visita puede tardar ~50 s en despertar.

---

## 👥 Usuarios de prueba

El script `init.cloud.sql` (y también `init.sql`) carga tres usuarios listos para usar, uno por rol (contraseña **`12345`** para todos):

| Usuario | Contraseña | Rol | Para qué sirve |
| --- | --- | --- | --- |
| `admin` | `12345` | **Administrador** | Gestión total: documentos, usuarios y **asignación de roles**. |
| `profe` | `12345` | **Profesor** | Publica material directo y aprueba/rechaza lo propuesto. |
| `pepe` | `12345` | **Estudiante** | Consulta el catálogo y propone material (queda `pending`). |

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
