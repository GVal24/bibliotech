/**
*    Project     : Bibliotech
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

/**
 * Función para asegurar independencia de los tests de documentos
 * y no depender de otro test para tener un token de sesión válido.
 * @param {string} username - usuario con el que se inicia sesión.
 */
async function okLogin(username)
{
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: '12345' })
    });
    const data = await response.json();
    localStorage.setItem('test_token', data.token);
}

/**
 * Test: GET /api/documents  (catálogo PÚBLICO, sin token)
 */
testUtils.createTestButton("Test Listar Catálogo (público)", async (btn) => {
    const response = await fetch('/api/documents');
    const data = await response.json();
    testUtils.log(data);
    if (response.ok) testUtils.setSuccess(btn);
});

/**
 * Test: GET /api/documents?q=término  (búsqueda pública)
 */
testUtils.createTestButton("Test Buscar en el Catálogo (público)", async (btn) => {
    const response = await fetch('/api/documents?q=apunte');
    const data = await response.json();
    testUtils.log(data);
    if (response.ok) testUtils.setSuccess(btn);
});

/**
 * Test: POST /api/documents/upload  (Admin -> se publica directo)
 * Envía un archivo .pdf (cuya extensión está en la lista blanca).
 */
testUtils.createTestButton("Test Subir Documento (Admin -> approved)", async (btn) => {
    await okLogin('admin');
    const token = localStorage.getItem('test_token');

    const formData = new FormData();
    formData.append('title', 'Documento de Prueba');
    formData.append('author', 'Autor de Prueba');
    formData.append('category', 'Ensayo');
    formData.append('year', '2026');
    formData.append('description', 'Documento generado por la suite de pruebas.');

    // Blob con firma PDF válida (contenido simulado)
    const blob = new Blob(["%PDF-1.4\n% Simulated PDF content"], { type: 'application/pdf' });
    formData.append('documentFile', blob, 'PRUEBA_01.pdf');

    const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    const data = await response.json();
    testUtils.log(data);
    if (response.ok && data.status === 'approved') testUtils.setSuccess(btn);
});

/**
 * Test: un STUDENT puede subir pero queda PENDING (requiere aprobación)
 */
testUtils.createTestButton("Test Student sube -> pending", async (btn) => {
    await okLogin('pepe');
    const token = localStorage.getItem('test_token');

    const formData = new FormData();
    formData.append('title', 'Apunte del alumno');
    formData.append('author', 'Pepe');
    const blob = new Blob(["%PDF-1.4"], { type: 'application/pdf' });
    formData.append('documentFile', blob, 'ALUMNO.pdf');

    const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    const data = await response.json();
    testUtils.log(data);
    if (response.ok && data.status === 'pending') testUtils.setSuccess(btn);
});

/**
 * Test: solo Professor/Admin ven la cola de pendientes (Student -> 403)
 */
testUtils.createTestButton("Test Student NO ve pendientes (403)", async (btn) => {
    await okLogin('pepe');
    const token = localStorage.getItem('test_token');

    const response = await fetch('/api/documents/pending/list', {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();
    testUtils.log(data);
    if (response.status === 403) testUtils.setSuccess(btn);
});

/**
 * Test: un PROFESSOR ve la cola de pendientes y puede aprobar
 */
testUtils.createTestButton("Test Professor aprueba pendiente", async (btn) => {
    await okLogin('profe');
    const token = localStorage.getItem('test_token');

    const listRes = await fetch('/api/documents/pending/list', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const pending = await listRes.json();
    testUtils.log(pending);

    if (!pending.length) {
        testUtils.log('No hay pendientes para aprobar. Sube uno como student primero.');
        return;
    }

    const response = await fetch(`/api/documents/${pending[0].id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    testUtils.log(data);
    if (response.ok && data.status === 'approved') testUtils.setSuccess(btn);
});

/**
 * Test: subir sin archivo -> 400
 */
testUtils.createTestButton("Test Subir sin archivo (400)", async (btn) => {
    await okLogin('admin');
    const token = localStorage.getItem('test_token');

    const formData = new FormData();
    formData.append('title', 'Sin archivo');
    formData.append('author', 'Nadie');

    const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    const data = await response.json();
    testUtils.log(data);
    if (response.status === 400) testUtils.setSuccess(btn);
});

/**
 * Test: subir un tipo NO permitido (.exe) -> 400
 */
testUtils.createTestButton("Test Subir tipo no permitido (400)", async (btn) => {
    await okLogin('admin');
    const token = localStorage.getItem('test_token');

    const formData = new FormData();
    formData.append('title', 'Malware');
    formData.append('author', 'Nadie');
    const blob = new Blob(["MZ"], { type: 'application/octet-stream' });
    formData.append('documentFile', blob, 'virus.exe');

    const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    const data = await response.json();
    testUtils.log(data);
    if (response.status === 400) testUtils.setSuccess(btn);
});

/**
 * Test: subir un tipo alternativo permitido (.md) como student -> pending
 */
testUtils.createTestButton("Test Subir .md permitido (pending)", async (btn) => {
    await okLogin('pepe');
    const token = localStorage.getItem('test_token');

    const formData = new FormData();
    formData.append('title', 'Apunte Markdown');
    formData.append('author', 'Pepe');
    const blob = new Blob(["# Apunte"], { type: 'text/markdown' });
    formData.append('documentFile', blob, 'apunte.md');

    const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    const data = await response.json();
    testUtils.log(data);
    if (response.ok && data.status === 'pending') testUtils.setSuccess(btn);
});

/**
 * Test: ver un documento online es PÚBLICO (sin token) -> 200
 */
testUtils.createTestButton("Test Ver online público (200)", async (btn) => {
    const list = await (await fetch('/api/documents')).json();
    if (!list.length) {
        testUtils.log('No hay documentos en el catálogo.');
        return;
    }

    const response = await fetch(`/api/documents/${list[0].id}/file`);
    testUtils.log({ status: response.status, type: response.headers.get('Content-Type') });
    if (response.ok) testUtils.setSuccess(btn);
});

/**
 * Test: descargar SIN token -> 403
 */
testUtils.createTestButton("Test Descargar sin token (403)", async (btn) => {
    const list = await (await fetch('/api/documents')).json();
    if (!list.length) {
        testUtils.log('No hay documentos en el catálogo.');
        return;
    }

    const response = await fetch(`/api/documents/${list[0].id}/download`);
    const data = await response.json().catch(() => ({}));
    testUtils.log(data);
    if (response.status === 403) testUtils.setSuccess(btn);
});

/**
 * Test: descargar CON token -> 200 attachment
 */
testUtils.createTestButton("Test Descargar con token (200)", async (btn) => {
    await okLogin('pepe');
    const token = localStorage.getItem('test_token');

    const list = await (await fetch('/api/documents')).json();
    if (!list.length) {
        testUtils.log('No hay documentos en el catálogo.');
        return;
    }

    const response = await fetch(`/api/documents/${list[0].id}/download?token=${encodeURIComponent(token)}`);
    testUtils.log({ status: response.status, disposition: response.headers.get('Content-Disposition') });
    if (response.ok) testUtils.setSuccess(btn);
});
