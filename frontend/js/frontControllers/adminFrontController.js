/**
*    Project     : Bibliotech
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

/**
 * adminFrontController.js
 * Panel de administración con dos secciones:
 *  - Documentos: alta, edición y baja del catálogo.
 *  - Usuarios: listado y baja de usuarios.
 */

document.addEventListener('DOMContentLoaded', initAdminPanel);

// Id del documento que se está editando (null = modo alta)
let editingDocumentId = null;

function initAdminPanel() {
    initTabs();
    initDocForm();
    loadDocuments();
    loadPending();
    loadUsers();
}

/* ------------------------------- Pestañas ------------------------------- */
function initTabs() {
    const docsBtn = document.getElementById('tabDocsBtn');
    const approvalsBtn = document.getElementById('tabApprovalsBtn');
    const usersBtn = document.getElementById('tabUsersBtn');

    docsBtn.addEventListener('click', () => switchTab('docs'));
    approvalsBtn.addEventListener('click', () => switchTab('approvals'));
    usersBtn.addEventListener('click', () => switchTab('users'));
}

function switchTab(tab) {
    const isDocs = tab === 'docs';
    const isApprovals = tab === 'approvals';
    const isUsers = tab === 'users';

    document.getElementById('sectionDocs').style.display = isDocs ? 'block' : 'none';
    document.getElementById('sectionApprovals').style.display = isApprovals ? 'block' : 'none';
    document.getElementById('sectionUsers').style.display = isUsers ? 'block' : 'none';

    document.getElementById('tabDocsBtn').classList.toggle('w3-yellow', isDocs);
    document.getElementById('tabApprovalsBtn').classList.toggle('w3-yellow', isApprovals);
    document.getElementById('tabUsersBtn').classList.toggle('w3-yellow', isUsers);
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
        btnView.href = authHelper.viewUrl(doc.id);
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

/* ------------------------------ Documentos ------------------------------ */
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
        td.textContent = 'Todavía no hay documentos en la biblioteca.';
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
        spanCategory.className = 'w3-tag w3-round w3-blue';
        spanCategory.textContent = doc.category || 'Sin categoría';
        tdCategory.appendChild(spanCategory);

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

        const btnEdit = document.createElement('button');
        btnEdit.className = 'w3-button w3-grey w3-tiny w3-round w3-margin-left';
        btnEdit.textContent = 'Editar';
        btnEdit.addEventListener('click', () => startEditing(doc));

        const btnDelete = document.createElement('button');
        btnDelete.className = 'w3-button w3-red w3-tiny w3-round w3-margin-left';
        btnDelete.textContent = 'Borrar';
        btnDelete.addEventListener('click', () => deleteDocument(doc.id));

        tdActions.append(btnRead, aDownload, btnEdit, btnDelete);

        row.append(tdTitle, tdAuthor, tdCategory, tdYear, tdActions);
        tbody.appendChild(row);
    });
}

function initDocForm() {
    document.getElementById('docForm').addEventListener('submit', handleDocSubmit);
    document.getElementById('docCancelBtn').addEventListener('click', () => { resetDocForm(); hideDocForm(); });

    // Formulario discreto: oculto por defecto, se abre con el botón.
    const toggleBtn = document.getElementById('toggleDocFormBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const wrap = document.getElementById('docFormWrap');
            const visible = wrap.style.display !== 'none';
            if (visible) {
                resetDocForm();
                hideDocForm();
            } else {
                showDocForm();
            }
        });
    }

    // Búsqueda en el catálogo (filtra en el cliente sobre lo ya cargado).
    const search = document.getElementById('catalogSearch');
    if (search) {
        search.addEventListener('input', () => filterCatalogTable(search.value));
    }
}

function showDocForm() {
    document.getElementById('docFormWrap').style.display = 'block';
    const btn = document.getElementById('toggleDocFormBtn');
    if (btn) btn.textContent = 'Cerrar';
}

function hideDocForm() {
    document.getElementById('docFormWrap').style.display = 'none';
    const btn = document.getElementById('toggleDocFormBtn');
    if (btn) btn.textContent = '+ Agregar documento';
}

// Filtra las filas del catálogo por texto (título, autor, categoría, año).
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

    const formData = new FormData();
    formData.append('title', document.getElementById('docTitle').value.trim());
    formData.append('author', document.getElementById('docAuthor').value.trim());
    formData.append('isbn', document.getElementById('docIsbn').value.trim());
    formData.append('category', document.getElementById('docCategory').value);
    formData.append('year', document.getElementById('docYear').value);
    formData.append('description', document.getElementById('docDescription').value.trim());

    try {
        if (editingDocumentId) {
            // Actualización de metadatos (no cambia el archivo)
            await apiService.request(`/documents/${editingDocumentId}`, 'PUT', {
                title: formData.get('title'),
                author: formData.get('author'),
                isbn: formData.get('isbn'),
                category: formData.get('category'),
                year: formData.get('year'),
                description: formData.get('description')
            });
            showModal('Éxito', 'Documento actualizado.');
        } else {
            // Alta: requiere archivo
            const fileInput = document.getElementById('documentFile');
            if (!fileInput.files.length) {
                return showModal('Falta el archivo', 'Debes seleccionar un archivo.');
            }
            formData.append('documentFile', fileInput.files[0]);
            await apiService.request('/documents/upload', 'POST', formData, true);
            showModal('Éxito', 'Documento agregado a la biblioteca.');
        }

        resetDocForm();
        hideDocForm();
        loadDocuments();
    } catch (error) {
        showModal('Error', error.message);
    }
}

function startEditing(doc) {
    editingDocumentId = doc.id;

    document.getElementById('docTitle').value = doc.title;
    document.getElementById('docAuthor').value = doc.author || '';
    document.getElementById('docIsbn').value = doc.isbn || '';
    document.getElementById('docCategory').value = doc.category || 'Otro';
    document.getElementById('docYear').value = doc.year != null ? doc.year : '';
    document.getElementById('docDescription').value = doc.description || '';

    // En edición no se reemplaza el archivo
    document.getElementById('fileFieldWrap').style.display = 'none';
    document.getElementById('documentFile').required = false;

    document.getElementById('docFormTitle').textContent = 'Editar Documento';
    setButtonLabel(document.getElementById('docSubmitBtn'), 'GUARDAR CAMBIOS');
    document.getElementById('docCancelBtn').style.display = 'inline-block';
    showDocForm();
    document.getElementById('docFormWrap').scrollIntoView({ behavior: 'smooth' });
}

// Reemplaza el contenido del botón por un <b> (sin usar innerHTML)
function setButtonLabel(button, text) {
    button.replaceChildren();
    const b = document.createElement('b');
    b.textContent = text;
    button.appendChild(b);
}

function resetDocForm() {
    editingDocumentId = null;
    document.getElementById('docForm').reset();
    document.getElementById('fileFieldWrap').style.display = 'block';
    document.getElementById('documentFile').required = true;
    document.getElementById('docFormTitle').textContent = 'Agregar Nuevo Documento';
    setButtonLabel(document.getElementById('docSubmitBtn'), 'AGREGAR A LA BIBLIOTECA');
    document.getElementById('docCancelBtn').style.display = 'none';
}

async function deleteDocument(id) {
    if (!confirm('¿Estás seguro de eliminar este documento de la biblioteca?')) return;

    try {
        await apiService.request(`/documents/${id}`, 'DELETE');
        showModal('Eliminado', 'El documento ha sido borrado.');
        loadDocuments();
    } catch (error) {
        showModal('Error', error.message);
    }
}

/* -------------------------------- Usuarios ------------------------------- */
async function loadUsers() {
    try {
        const users = await apiService.request('/admin/users', 'GET');
        renderUsersTable(users);
    } catch (error) {
        showModal('Acceso denegado', error.message);
        window.location.href = '/login';
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.replaceChildren();

    users.forEach((u) => {
        const row = document.createElement('tr');

        const tdId = document.createElement('td');
        tdId.textContent = u.id;

        const tdUser = document.createElement('td');
        const b = document.createElement('b');
        b.textContent = u.username;
        tdUser.appendChild(b);

        const tdRole = document.createElement('td');
        const spanRole = document.createElement('span');
        spanRole.className = 'w3-tag w3-blue';
        spanRole.textContent = u.role;
        tdRole.appendChild(spanRole);

        const tdDate = document.createElement('td');
        tdDate.textContent = new Date(u.created_at).toLocaleDateString();

        const tdActions = document.createElement('td');

        // Selector de rol: el Admin asigna Professor a quien corresponda
        const roleSelect = document.createElement('select');
        roleSelect.className = 'w3-select w3-border w3-round w3-small';
        roleSelect.style.width = 'auto';
        ['admin', 'professor', 'student'].forEach((roleName) => {
            const option = document.createElement('option');
            option.value = roleName;
            option.textContent = roleName;
            if (roleName === u.role) option.selected = true;
            roleSelect.appendChild(option);
        });
        roleSelect.addEventListener('change', () => changeRole(u.id, roleSelect.value));

        const btnBan = document.createElement('button');
        btnBan.className = 'w3-button w3-red w3-tiny w3-round w3-margin-left';
        btnBan.textContent = 'Eliminar usuario';
        btnBan.addEventListener('click', () => banUser(u.id));

        tdActions.append(roleSelect, btnBan);

        row.append(tdId, tdUser, tdRole, tdDate, tdActions);
        tbody.appendChild(row);
    });
}

async function changeRole(id, role) {
    try {
        await apiService.request(`/admin/users/${id}/role`, 'PUT', { role });
        showModal('Éxito', 'Rol actualizado.');
        loadUsers();
    } catch (error) {
        showModal('Error', error.message);
    }
}

async function banUser(id) {
    if (!confirm('¿Estás seguro de borrar a este usuario? Se borrarán también los documentos que haya subido.')) {
        return;
    }

    try {
        await apiService.request(`/admin/users/${id}`, 'DELETE');
        showModal('Éxito', 'Usuario eliminado con éxito');
        loadUsers();
        loadDocuments();
    } catch (error) {
        showModal('Error al borrar usuario', error.message);
    }
}
