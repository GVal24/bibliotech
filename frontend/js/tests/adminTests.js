/**
 * Test: GET /api/admin/users (Requiere Login Admin)
 */
 testUtils.createTestButton("Test Admin: Listar Usuarios con Login Admin Correcto", async (btn) => {
    // Primero hacemos un login rápido como admin para obtener el token adecuado
    const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: '12345' })
    });
    
    const { token } = await loginRes.json();

    const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    testUtils.log(data);
    if (response.ok) testUtils.setSuccess(btn);
});

/**
 * Test: PUT /api/admin/users/:id/role (Admin asigna Professor a 'pepe')
 */
testUtils.createTestButton("Test Admin: Promover usuario a Professor", async (btn) => {
    const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: '12345' })
    });
    const { token } = await loginRes.json();

    // Buscamos el id de 'pepe'
    const usersRes = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const users = await usersRes.json();
    const pepe = users.find((u) => u.username === 'pepe');
    if (!pepe) { testUtils.log('No se encontró a pepe'); return; }

    const response = await fetch(`/api/admin/users/${pepe.id}/role`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'professor' })
    });
    const data = await response.json();
    testUtils.log(data);
    if (response.ok) testUtils.setSuccess(btn);
});

/**
 * Test: rol inválido -> 400
 */
testUtils.createTestButton("Test Admin: Rol inválido (400)", async (btn) => {
    const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: '12345' })
    });
    const { token } = await loginRes.json();

    const response = await fetch('/api/admin/users/2/role', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'superhero' })
    });
    const data = await response.json();
    testUtils.log(data);
    if (response.status === 400) testUtils.setSuccess(btn);
});

/**
 * Test: al eliminar un usuario, su material SE CONSERVA en la biblioteca.
 * 1. Registra un usuario temporal y sube un documento (aprobado por admin).
 * 2. Elimina el usuario.
 * 3. Verifica que el documento sigue en el catálogo (sin dueño).
 */
testUtils.createTestButton("Test Admin: borrar usuario conserva su material", async (btn) => {
    const loginAdmin = async () => {
        const r = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: '12345' })
        });
        return (await r.json()).token;
    };

    const adminToken = await loginAdmin();
    const uname = 'tmp_' + Date.now();

    // 1. Registro + login del usuario temporal
    await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: uname, password: 'temp1234' })
    });
    const tempLogin = await (await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: uname, password: 'temp1234' })
    })).json();

    // 2. Sube un documento
    const formData = new FormData();
    formData.append('title', 'Material de ' + uname);
    formData.append('author', 'Temp');
    formData.append('documentFile', new Blob(['# tmp'], { type: 'text/markdown' }), 'tmp.md');
    const uploadRes = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${tempLogin.token}` },
        body: formData
    });
    const uploaded = await uploadRes.json();
    if (!uploaded.id) { testUtils.log('No se pudo subir el documento'); return; }

    // 3. Admin aprueba el documento
    await fetch(`/api/documents/${uploaded.id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    // 4. Se busca el id del usuario temporal y se elimina
    const users = await (await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    })).json();
    const tempUser = users.find((u) => u.username === uname);
    if (!tempUser) { testUtils.log('No se encontró el usuario temporal'); return; }

    const delRes = await fetch(`/api/admin/users/${tempUser.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const delData = await delRes.json();
    testUtils.log(delData);

    // 5. El material debe seguir en el catálogo público
    const catalog = await (await fetch('/api/documents')).json();
    const survived = catalog.some((d) => d.id === uploaded.id);
    testUtils.log({ documentSurvived: survived, uploadedId: uploaded.id });

    if (delRes.ok && survived) testUtils.setSuccess(btn);
});