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