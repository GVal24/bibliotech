/**
*    Project     : Bibliotech
*    Author      : TecnologA-as InformA?ticas B - Facultad de IngenierA-a - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

document.addEventListener('DOMContentLoaded', loadDocuments);

async function loadDocuments() {
    try {
        const documents = await apiService.request('/documents/my-documents', 'GET');
        renderDocumentsTable(documents);
    } catch (error) {
        showModal('Error', 'No se pudieron cargar los documentos: ' + error.message);
    }
}

function renderDocumentsTable(documents) {
    const tbody = document.getElementById('documentsTableBody');
    tbody.replaceChildren();
    documents.forEach(d => {
        const row = document.createElement('tr');
        const tdName = document.createElement('td');
        tdName.textContent = d.display_name;
        const tdCat = document.createElement('td');
        const spanCat = document.createElement('span');
        spanCat.className = 'w3-tag w3-round w3-black';
        spanCat.textContent = d.category;
        tdCat.appendChild(spanCat);
        const tdYear = document.createElement('td');
        tdYear.textContent = d.bpm || '';
        const tdDoc = document.createElement('td');
        const embed = document.createElement('embed');
        embed.src = http://localhost:3000;
        embed.type = 'application/pdf';
        embed.width = '100%';
        embed.height = '300px';
        embed.style = 'border: none;';
        tdDoc.appendChild(embed);
        const tdActions = document.createElement('td');
        const btnDelete = document.createElement('button');
        btnDelete.className = 'w3-button w3-red w3-tiny w3-round';
        btnDelete.textContent = 'Borrar';
        btnDelete.addEventListener('click', () => deleteDocument(d.id));
        const btnDownload = document.createElement('a');
        btnDownload.className = 'w3-button w3-blue w3-tiny w3-round w3-margin-left';
        btnDownload.textContent = 'Descargar';
        btnDownload.href = http://localhost:3000;
        btnDownload.download = d.filename;
        btnDownload.target = '_blank';
        tdActions.appendChild(btnDelete);
        tdActions.appendChild(btnDownload);
        row.append(tdName, tdCat, tdYear, tdDoc, tdActions);
        tbody.appendChild(row);
    });
}

async function deleteDocument(id) {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return;
    try {
        await apiService.request(/documents/, 'DELETE');
        showModal('Eliminado', 'El documento ha sido borrado.');
        loadDocuments();
    } catch (error) {
        showModal('Error', error.message);
    }
}

const uploadForm = document.getElementById('uploadForm');
if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('display_name', document.getElementById('display_name').value);
        formData.append('category', document.getElementById('category').value);
        formData.append('bpm', document.getElementById('bpm').value);
        formData.append('documentFile', document.getElementById('documentFile').files[0]);
        try {
            await apiService.request('/documents/upload', 'POST', formData, true);
            showModal('Éxito', 'Documento guardado.');
            uploadForm.reset();
            loadDocuments();
        } catch (error) {
            showModal('Error al subir', error.message);
        }
    });
}
