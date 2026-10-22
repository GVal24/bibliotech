/**
*    Project     : Bibliotech
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

/**
 * professorFrontController.js
 * Panel del Profesor con dos secciones:
 *  - Aprobaciones: revisar el material propuesto por los Students.
 *  - Catálogo: publicar material propio (se publica directo).
 */

document.addEventListener('DOMContentLoaded', initProfessorPanel);

function initProfessorPanel() {
    initTabs();
    initDocForm();
    loadPending();
    loadDocuments();
}

/* ------------------------------- Pestañas ------------------------------- */
function initTabs() {
    const approvalsBtn = document.getElementById('tabApprovalsBtn');
    const catalogBtn = document.getElementById('tabCatalogBtn');

    approvalsBtn.addEventListener('click', () => switchTab('approvals'));
    catalogBtn.addEventListener('click', () => switchTab('catalog'));
}

function switchTab(tab) {
    const isApprovals = tab === 'approvals';
    document.getElementById('sectionApprovals').style.display = isApprovals ? 'block' : 'none';
    document.getElementById('sectionCatalog').style.display = isApprovals ? 'none' : 'block';

    document.getElementById('tabApprovalsBtn').classList.toggle('w3-yellow', isApprovals);
    document.getElementById('tabCatalogBtn').classList.toggle('w3-yellow', !isApprovals);
}

/* ------------------------------ Aprobaciones ---------------------------- */
async function loadPending() {
    try {
        const documents = await apiService.request('/documents/pending/list', 'GET');
        renderPendingTable(documents);
    } catch (error) {
        showModal('Error', 'No se pudo cargar los pendientes: ' + error.message);
    }
}

function renderPendingTable(documents) {
    const tbody = document.getElementById('pendingTableBody');
    tbody.replaceChildren();

    if (!documents.length) {
        const row = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 5;
        td.textContent = 'No hay material pendiente de revisión.';
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

        const tdUser = document.createElement('td');
        tdUser.textContent = doc.uploaded_by || 'Usuario eliminado';

        const tdCategory = document.createElement('td');
        tdCategory.textContent = doc.category || 'Sin categoría';

        const tdActions = document.createElement('td');

        const btnView = document.createElement('a');
        btnView.className = 'w3-button w3-blue w3-tiny w3-round';
        btnView.textContent = 'Ver';
        // El material pendiente solo lo ve el staff: el token debe ir por query
        // porque <a> no envía el header Authorization.
        btnView.href = `/api/documents/${doc.id}/file?token=${encodeURIComponent(authHelper.getToken() || '')}#toolbar=0`;
        btnView.target = '_blank';

        const btnApprove = document.createElement('button');
        btnApprove.className = 'w3-button w3-green w3-tiny w3-round w3-margin-left';
        btnApprove.textContent = 'Aprobar';
        btnApprove.addEventListener('click', () => resolveDocument(doc.id, 'approve'));

        const btnReject = document.createElement('button');
        btnReject.className = 'w3-button w3-red w3-tiny w3-round w3-margin-left';
        btnReject.textContent = 'Rechazar';
        btnReject.addEventListener('click', () => resolveDocument(doc.id, 'reject'));

        tdActions.append(btnView, btnApprove, btnReject);

        row.append(tdTitle, tdAuthor, tdUser, tdCategory, tdActions);
        tbody.appendChild(row);
    });
}

async function resolveDocument(id, action) {
    const verb = action === 'approve' ? 'aprobar' : 'rechazar';
    if (!confirm(`¿Estás seguro de ${verb} este documento?`)) return;

    try {
        await apiService.request(`/documents/${id}/${action}`, 'POST');
        showModal('Listo', `Documento ${action === 'approve' ? 'aprobado' : 'rechazado'}.`);
        loadPending();
        loadDocuments();
    } catch (error) {
        showModal('Error', error.message);
    }
}

/* ------------------------------- Catálogo ------------------------------- */
async function loadDocuments() {
    try {
        const documents = await apiService.request('/documents', 'GET');
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
        td.textContent = 'Todavía no hay documentos publicados.';
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
        tdCategory.textContent = doc.category || 'Sin categoría';

        const tdYear = document.createElement('td');
        tdYear.textContent = doc.year != null ? doc.year : '';

        const tdActions = document.createElement('td');

        const btnRead = document.createElement('button');
        btnRead.className = 'w3-button w3-yellow w3-tiny w3-round';
        btnRead.textContent = 'Leer';
        btnRead.addEventListener('click', () => openViewer(doc));

        const aDownload = document.createElement('a');
        aDownload.className = 'w3-button w3-blue w3-tiny w3-round w3-margin-left';
        aDownload.textContent = 'Descargar';
        aDownload.href = authHelper.downloadUrl(doc.id);
        aDownload.download = doc.filename;
        tdActions.appendChild(btnRead);
        tdActions.appendChild(aDownload);

        // El profesor puede borrar material del catálogo.
        const btnDelete = document.createElement('button');
        btnDelete.className = 'w3-button w3-red w3-tiny w3-round w3-margin-left';
        btnDelete.textContent = 'Borrar';
        btnDelete.addEventListener('click', () => deleteDocument(doc.id));
        tdActions.appendChild(btnDelete);

        row.append(tdTitle, tdAuthor, tdCategory, tdYear, tdActions);
        tbody.appendChild(row);
    });
}

// Borra un documento del catálogo (Professor/Admin)
async function deleteDocument(id) {
    if (!confirm('¿Estás seguro de borrar este documento? Esta acción no se puede deshacer.')) return;

    try {
        await apiService.request(`/documents/${id}`, 'DELETE');
        showModal('Listo', 'Documento eliminado.');
        loadPending();
        loadDocuments();
    } catch (error) {
        showModal('Error', error.message);
    }
}

function initDocForm() {
    document.getElementById('professorDocForm').addEventListener('submit', handleDocSubmit);

    const toggleBtn = document.getElementById('toggleDocFormBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const wrap = document.getElementById('docFormWrap');
            const visible = wrap.style.display !== 'none';
            if (visible) {
                document.getElementById('professorDocForm').reset();
                wrap.style.display = 'none';
                toggleBtn.textContent = '+ Publicar material';
            } else {
                wrap.style.display = 'block';
                toggleBtn.textContent = 'Cerrar';
            }
        });
    }

    const search = document.getElementById('catalogSearch');
    if (search) {
        search.addEventListener('input', () => filterCatalogTable(search.value));
    }
}

function filterCatalogTable(term) {
    const tbody = document.getElementById('documentsTableBody');
    if (!tbody) return;
    const q = (term || '').toLowerCase().trim();
    Array.from(tbody.rows).forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = !q || text.includes(q) ? '' : 'none';
    });
}

// Muestra el documento incrustado en la misma página para lectura online.
// El staff adjunta el token para poder previsualizar también pendientes.
function openViewer(doc) {
    const card = document.getElementById('viewerCard');
    if (!card) return;

    document.getElementById('viewerTitle').textContent = doc.title;

    const token = authHelper.getToken();
    const embed = document.getElementById('pdfViewer');
    embed.src = `/api/documents/${doc.id}/file?token=${encodeURIComponent(token || '')}#toolbar=0`;

    const downloadBtn = document.getElementById('viewerDownload');
    if (downloadBtn) {
        downloadBtn.onclick = () => {
            const a = document.createElement('a');
            a.href = authHelper.downloadUrl(doc.id);
            a.download = doc.filename || '';
            document.body.appendChild(a);
            a.click();
            a.remove();
        };
    }

    document.getElementById('viewerClose').onclick = () => {
        card.style.display = 'none';
        embed.src = '';
    };

    card.style.display = 'block';
    card.scrollIntoView({ behavior: 'smooth' });
}

async function handleDocSubmit(e) {
    e.preventDefault();

    const fileInput = document.getElementById('documentFile');
    if (!fileInput.files.length) {
        return showModal('Falta el archivo', 'Debes seleccionar un archivo.');
    }

    const formData = new FormData();
    formData.append('title', document.getElementById('docTitle').value.trim());
    formData.append('author', document.getElementById('docAuthor').value.trim());
    formData.append('isbn', document.getElementById('docIsbn').value.trim());
    formData.append('category', document.getElementById('docCategory').value);
    formData.append('year', document.getElementById('docYear').value);
    formData.append('description', document.getElementById('docDescription').value.trim());
    formData.append('documentFile', fileInput.files[0]);

    const restore = setButtonLoading(document.getElementById('docSubmitBtn'), 'Publicando...');
    try {
        const result = await apiService.request('/documents/upload', 'POST', formData, true);
        showModal('Éxito', result.message || 'Documento publicado.');
        e.target.reset();
        const wrap = document.getElementById('docFormWrap');
        if (wrap) wrap.style.display = 'none';
        const toggleBtn = document.getElementById('toggleDocFormBtn');
        if (toggleBtn) toggleBtn.textContent = '+ Publicar material';
        loadDocuments();
    } catch (error) {
        showModal('Error', error.message);
    } finally {
        restore();
    }
}
