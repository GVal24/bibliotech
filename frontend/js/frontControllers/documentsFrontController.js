/**
*    Project     : Bibliotech
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

/**
 * Catálogo público de la biblioteca.
 *  - Sin sesión: solo lectura online del material aprobado (sin descargar).
 *  - Sesión: además puede descargar y proponer material (queda pendiente).
 */

document.addEventListener('DOMContentLoaded', initCatalog);

function initCatalog() {
    initSessionUI();
    initContributorForm();

    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');

    if (searchBtn) {
        searchBtn.addEventListener('click', () => loadDocuments(searchInput.value));
    }
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') loadDocuments(searchInput.value);
        });
    }

    loadDocuments('');
}

// Adapta la barra superior y el formulario de aportes según haya sesión o no
function initSessionUI() {
    const token = authHelper.getToken();
    const loginLink = document.getElementById('loginLink');
    const logoutBtn = document.getElementById('logoutBtn');

    if (token) {
        if (loginLink) loginLink.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';

        // Un Student logueado puede subir material: mostramos solo el botón
        // discreto "+ Compartir material" (el formulario se abre al pulsarlo).
        const contributorToggle = document.getElementById('contributorToggleWrap');
        if (contributorToggle) contributorToggle.style.display = 'block';
    }
}

// Pide el catálogo completo o filtrado por término
async function loadDocuments(term = '') {
    try {
        const clean = (term || '').trim();
        const query = clean ? `?q=${encodeURIComponent(clean)}` : '';
        const documents = await apiService.request(`/documents${query}`, 'GET');
        renderDocumentsTable(documents);
    } catch (error) {
        showModal('Error', 'No se pudo cargar el catálogo: ' + error.message);
    }
}

function renderDocumentsTable(documents) {
    const tbody = document.getElementById('documentsTableBody');
    tbody.replaceChildren();

    if (!documents.length) {
        const row = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 5;
        td.textContent = 'No se encontraron documentos.';
        row.appendChild(td);
        tbody.appendChild(row);
        return;
    }

    documents.forEach((doc) => {
        const row = document.createElement('tr');

        const tdTitle = document.createElement('td');
        tdTitle.textContent = doc.title;

        const tdAuthor = document.createElement('td');
        tdAuthor.textContent = doc.author;

        const tdCategory = document.createElement('td');
        const spanCategory = document.createElement('span');
        spanCategory.className = 'w3-tag w3-round w3-black';
        spanCategory.textContent = doc.category || 'Sin categoría';
        tdCategory.appendChild(spanCategory);

        const tdYear = document.createElement('td');
        tdYear.textContent = doc.year != null ? doc.year : '';

        const tdActions = document.createElement('td');

        const btnRead = document.createElement('button');
        btnRead.className = 'w3-button w3-yellow w3-tiny w3-round';
        btnRead.textContent = 'Leer';
        btnRead.addEventListener('click', () => openViewer(doc));

        tdActions.append(btnRead);

        // Descargar: solo usuarios registrados. El invitado ve el botón pero
        // al pulsarlo se le invita a ingresar.
        const btnDownload = document.createElement('button');
        btnDownload.className = 'w3-button w3-blue w3-tiny w3-round w3-margin-left';
        btnDownload.textContent = 'Descargar';
        btnDownload.addEventListener('click', () => requestDownload(doc));

        tdActions.append(btnDownload);

        row.append(tdTitle, tdAuthor, tdCategory, tdYear, tdActions);
        tbody.appendChild(row);
    });
}

/* --------------------- Aporte de material (Student) --------------------- */
function initContributorForm() {
    const form = document.getElementById('contributorForm');
    if (!form) return;

    // Toggle discreto del formulario de aporte.
    const toggleBtn = document.getElementById('toggleContribFormBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const card = document.getElementById('contributorCard');
            const visible = card.style.display !== 'none';
            if (visible) {
                form.reset();
                card.style.display = 'none';
                toggleBtn.textContent = '+ Compartir material';
            } else {
                card.style.display = 'block';
                toggleBtn.textContent = 'Cerrar';
                card.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fileInput = document.getElementById('contribFile');
        if (!fileInput.files.length) {
            return showModal('Falta el archivo', 'Debes seleccionar un archivo.');
        }

        const formData = new FormData();
        formData.append('title', document.getElementById('contribTitle').value.trim());
        formData.append('author', document.getElementById('contribAuthor').value.trim());
        formData.append('isbn', document.getElementById('contribIsbn').value.trim());
        formData.append('category', document.getElementById('contribCategory').value);
        formData.append('year', document.getElementById('contribYear').value);
        formData.append('description', document.getElementById('contribDescription').value.trim());
        formData.append('documentFile', fileInput.files[0]);

        try {
            const result = await apiService.request('/documents/upload', 'POST', formData, true);
            showModal('Enviado', result.message || 'Material enviado para revisión.');
            form.reset();
            const card = document.getElementById('contributorCard');
            if (card) card.style.display = 'none';
            if (toggleBtn) toggleBtn.textContent = '+ Compartir material';
        } catch (error) {
            showModal('Error', error.message);
        }
    });
}

// Muestra el documento incrustado en la misma página para lectura online
function openViewer(doc) {
    const card = document.getElementById('viewerCard');
    if (!card) return;

    document.getElementById('viewerTitle').textContent = doc.title;

    const embed = document.getElementById('pdfViewer');
    // Endpoint público de lectura (inline). No requiere token.
    // #toolbar=0 oculta la barra del visor PDF del navegador para desalentar
    // el guardado directo desde el visor (la descarga "real" exige token).
    embed.src = `/api/documents/${doc.id}/file#toolbar=0`;

    const downloadBtn = document.getElementById('viewerDownload');
    if (downloadBtn) {
        downloadBtn.onclick = () => requestDownload(doc);
    }

    card.style.display = 'block';
    card.scrollIntoView({ behavior: 'smooth' });
}

// Descarga el documento. Solo usuarios registrados: si no hay sesión,
// se invita a ingresar. El token viaja por query porque <embed>/<a> no
// pueden enviar el header Authorization.
function requestDownload(doc) {
    const token = authHelper.getToken();

    if (!token) {
        showModal('Ingresá para descargar', 'Necesitás una cuenta para descargar el material. Podés seguir leyéndolo online.');
        return;
    }

    const a = document.createElement('a');
    a.href = `/api/documents/${doc.id}/download?token=${encodeURIComponent(token)}`;
    a.download = doc.filename || '';
    document.body.appendChild(a);
    a.click();
    a.remove();
}
