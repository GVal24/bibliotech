/**
 * Bibliotech - Visor de PDF dentro de la página para celulares y tablets.
 *
 * Los navegadores móviles no muestran PDFs dentro de <embed> ni de <iframe>
 * (Android deja el espacio vacío e iOS suele mostrar sólo la primera página).
 * Para que la lectura funcione igual que en la computadora, cada página se
 * dibuja en un <canvas> con PDF.js.
 *
 * Requiere cargar antes el build UMD de PDF.js:
 *   frontend/js/vendor/pdfjs/pdf.min.js
 */
const mobilePdfReader = (function () {
    'use strict';

    const WORKER_SRC = '/js/vendor/pdfjs/pdf.worker.min.js';
    const ZOOM_STEPS = [1, 1.25, 1.5, 2, 2.5, 3];
    const MAX_DPR = 2;

    let ui = null;
    let pdfDoc = null;
    let pageNumber = 1;
    let zoomIndex = 0;
    let session = 0;
    let renderTask = null;
    let fetchController = null;
    let lastUrl = '';
    let resizeTimer = 0;

    /* ------------------------------ Utilidades ----------------------------- */

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }

    function setStatus(text) {
        if (!ui) return;
        ui.statusText.textContent = text;
        ui.status.hidden = false;
        ui.statusText.hidden = false;
    }

    function isPdf(doc) {
        return !!doc && /\.pdf$/i.test(doc.filename || '');
    }

    function friendlyError(error) {
        if (!error) return 'No se pudo abrir el documento.';
        if (error.name === 'InvalidPDFException') return 'El archivo no es un PDF válido.';
        if (error.name === 'PasswordException') return 'El documento está protegido con contraseña.';
        return error.message || 'No se pudo abrir el documento.';
    }

    function hasPdfJs() {
        if (typeof pdfjsLib === 'undefined' || !pdfjsLib.getDocument) return false;
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_SRC;
        }
        return true;
    }

    /* --------------------------------- UI ---------------------------------- */

    function buildUi() {
        if (ui) return ui;

        const embed = document.getElementById('pdfViewer');
        if (!embed || !embed.parentNode) return null;

        const wrap = el('div', 'bt-pdf-reader');
        wrap.id = 'btPdfReader';
        wrap.hidden = true;
        wrap.setAttribute('role', 'region');
        wrap.setAttribute('aria-label', 'Visor del documento');

        const toolbar = el('div', 'bt-pdf-toolbar');

        const prev = el('button', 'bt-pdf-btn', '‹');
        prev.type = 'button';
        prev.setAttribute('aria-label', 'Página anterior');

        const pageLabel = el('span', 'bt-pdf-page', 'Página 1');
        pageLabel.setAttribute('aria-live', 'polite');

        const next = el('button', 'bt-pdf-btn', '›');
        next.type = 'button';
        next.setAttribute('aria-label', 'Página siguiente');

        const spacer = el('span', 'bt-pdf-spacer');

        const zoomOut = el('button', 'bt-pdf-btn bt-pdf-btn-small', '−');
        zoomOut.type = 'button';
        zoomOut.setAttribute('aria-label', 'Alejar');

        const zoomLabel = el('span', 'bt-pdf-zoom', '100%');
        zoomLabel.setAttribute('aria-live', 'polite');

        const zoomIn = el('button', 'bt-pdf-btn bt-pdf-btn-small', '+');
        zoomIn.type = 'button';
        zoomIn.setAttribute('aria-label', 'Acercar');

        toolbar.append(prev, pageLabel, next, spacer, zoomOut, zoomLabel, zoomIn);

        const stage = el('div', 'bt-pdf-stage');

        const status = el('div', 'bt-pdf-status');
        status.hidden = true;

        const statusText = el('span', 'bt-pdf-status-text', '');
        statusText.setAttribute('aria-live', 'polite');

        const retry = el('button', 'bt-pdf-retry', 'Reintentar');
        retry.type = 'button';
        retry.hidden = true;

        const fallback = el('a', 'bt-pdf-fallback', 'Abrir en otra pestaña');
        fallback.target = '_blank';
        fallback.rel = 'noopener';
        fallback.hidden = true;

        status.append(statusText, retry, fallback);

        const canvas = document.createElement('canvas');
        canvas.className = 'bt-pdf-canvas';
        canvas.hidden = true;

        stage.append(status, canvas);
        wrap.append(toolbar, stage);

        embed.parentNode.insertBefore(wrap, embed.nextSibling);
        // En móviles el <embed> no sirve; el visor propio ocupa su lugar.
        embed.style.display = 'none';

        ui = {
            wrap, toolbar, prev, pageLabel, next,
            zoomOut, zoomLabel, zoomIn,
            stage, canvas, status, statusText, retry, fallback
        };

        bindUi();
        return ui;
    }

    function bindUi() {
        ui.prev.addEventListener('click', () => goToPage(pageNumber - 1));
        ui.next.addEventListener('click', () => goToPage(pageNumber + 1));
        ui.zoomOut.addEventListener('click', () => changeZoom(-1));
        ui.zoomIn.addEventListener('click', () => changeZoom(1));

        ui.retry.addEventListener('click', () => {
            if (lastUrl) open({ url: lastUrl });
        });

        // Deslizar horizontalmente para cambiar de página (sólo sin zoom,
        // para no chocar con el desplazamiento horizontal de la página).
        let startX = 0;
        let startY = 0;
        let startTime = 0;

        ui.stage.addEventListener('touchstart', (event) => {
            if (event.touches.length !== 1) return;
            startX = event.touches[0].clientX;
            startY = event.touches[0].clientY;
            startTime = Date.now();
        }, { passive: true });

        ui.stage.addEventListener('touchend', (event) => {
            if (!pdfDoc || zoomIndex !== 0 || event.touches.length) return;
            const touch = event.changedTouches && event.changedTouches[0];
            if (!touch) return;

            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            const elapsed = Date.now() - startTime;

            if (elapsed < 700 && Math.abs(dx) > 60 && Math.abs(dy) < 50) {
                goToPage(dx < 0 ? pageNumber + 1 : pageNumber - 1);
            }
        }, { passive: true });

        // Al girar el teléfono o cambiar el ancho, recalcular el ajuste.
        window.addEventListener('resize', () => {
            if (!ui || ui.wrap.hidden || !pdfDoc) return;
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => renderCurrentPage(session), 250);
        });
    }

    function updateControls() {
        if (!ui) return;
        const total = pdfDoc ? pdfDoc.numPages : 0;
        ui.pageLabel.textContent = total
            ? 'Página ' + pageNumber + ' de ' + total
            : 'Página 1';
        ui.zoomLabel.textContent = Math.round(ZOOM_STEPS[zoomIndex] * 100) + '%';
        ui.prev.disabled = !pdfDoc || pageNumber <= 1;
        ui.next.disabled = !pdfDoc || pageNumber >= total;
        ui.zoomOut.disabled = !pdfDoc || zoomIndex === 0;
        ui.zoomIn.disabled = !pdfDoc || zoomIndex === ZOOM_STEPS.length - 1;
    }

    function resetStatus() {
        if (!ui) return;
        ui.status.hidden = true;
        ui.statusText.hidden = false;
        ui.retry.hidden = true;
        ui.fallback.hidden = true;
    }

    function fail(message) {
        if (!ui) return;
        ui.canvas.hidden = true;
        setStatus(message);
        ui.retry.hidden = false;
        if (!hasPdfJs()) ui.fallback.hidden = false;
        updateControls();
    }

    /* ----------------------------- Carga / cierre -------------------------- */

    function teardown() {
        session++; // invalida cualquier carga o dibujo en curso
        if (fetchController) {
            try { fetchController.abort(); } catch (error) { /* ignorado */ }
            fetchController = null;
        }
        if (renderTask) {
            try { renderTask.cancel(); } catch (error) { /* ignorado */ }
            renderTask = null;
        }
        if (pdfDoc) {
            try { pdfDoc.destroy(); } catch (error) { /* ignorado */ }
            pdfDoc = null;
        }
    }

    function close() {
        teardown();
        pageNumber = 1;
        zoomIndex = 0;
        if (!ui) return;
        ui.wrap.hidden = true;
        ui.canvas.hidden = true;
        ui.status.hidden = true;
        ui.statusText.hidden = false;
        ui.retry.hidden = true;
        ui.fallback.hidden = true;
        ui.prev.disabled = true;
        ui.next.disabled = true;
        ui.zoomOut.disabled = true;
        ui.zoomIn.disabled = true;
        ui.pageLabel.textContent = 'Página 1';
        ui.zoomLabel.textContent = '100%';
        const ctx = ui.canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, ui.canvas.width, ui.canvas.height);
    }

    function blobToArrayBuffer(blob) {
        if (blob.arrayBuffer) return blob.arrayBuffer();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
            reader.readAsArrayBuffer(blob);
        });
    }

    async function readWithProgress(response, mySession) {
        const total = Number(response.headers.get('content-length')) || 0;
        if (!response.body || !response.body.getReader) {
            return response.arrayBuffer();
        }

        const reader = response.body.getReader();
        const chunks = [];
        let received = 0;

        for (;;) {
            const result = await reader.read();
            if (result.done) break;
            if (mySession !== session) {
                try { reader.cancel(); } catch (error) { /* ignorado */ }
                throw new Error('Carga cancelada.');
            }
            chunks.push(result.value);
            received += result.value.length;
            if (total) {
                const percent = Math.min(100, Math.round((received / total) * 100));
                setStatus('Cargando documento… ' + percent + '%');
            }
        }

        return blobToArrayBuffer(new Blob(chunks, { type: 'application/pdf' }));
    }

    async function open(options) {
        if (!ui) buildUi();
        if (!ui) return;

        const url = options && options.url;
        if (!url) return;

        teardown();
        lastUrl = url;

        const mySession = session;

        ui.wrap.hidden = false;
        ui.canvas.hidden = true;
        resetStatus();
        setStatus('Cargando documento…');
        pageNumber = 1;
        zoomIndex = 0;
        updateControls();

        if (!hasPdfJs()) {
            ui.fallback.href = url;
            fail('No se pudo cargar el visor de documentos.');
            return;
        }

        fetchController = new AbortController();

        try {
            const response = await fetch(url, { signal: fetchController.signal });
            if (mySession !== session) return;

            if (!response.ok) {
                let message = 'No se pudo cargar el documento (' + response.status + ').';
                try {
                    const body = await response.json();
                    if (body && body.message) message = body.message;
                } catch (error) { /* respuesta sin JSON */ }
                throw new Error(message);
            }

            const data = await readWithProgress(response, mySession);
            if (mySession !== session) return;

            setStatus('Preparando páginas…');
            const loadedDoc = await pdfjsLib.getDocument({ data }).promise;
            if (mySession !== session) {
                try { loadedDoc.destroy(); } catch (error) { /* ignorado */ }
                return;
            }

            pdfDoc = loadedDoc;
            await renderCurrentPage(mySession);
        } catch (error) {
            if (mySession !== session) return;
            if (error && error.name === 'AbortError') return;
            fail(friendlyError(error));
        } finally {
            if (mySession === session) fetchController = null;
        }
    }

    /* ------------------------------- Dibujo -------------------------------- */

    async function renderCurrentPage(mySession) {
        if (!ui || !pdfDoc || mySession !== session) return;

        let page;
        try {
            page = await pdfDoc.getPage(pageNumber);
        } catch (error) {
            if (mySession === session) fail(friendlyError(error));
            return;
        }
        if (mySession !== session) return;

        if (renderTask) {
            try { renderTask.cancel(); } catch (error) { /* ignorado */ }
            renderTask = null;
        }

        const base = page.getViewport({ scale: 1 });
        const available = Math.max(160, ui.stage.clientWidth - 10);
        const scale = (available / base.width) * ZOOM_STEPS[zoomIndex];
        const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
        const viewport = page.getViewport({ scale });

        const canvas = ui.canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            fail('Tu navegador no puede mostrar el documento.');
            return;
        }

        canvas.width = Math.max(1, Math.floor(viewport.width * dpr));
        canvas.height = Math.max(1, Math.floor(viewport.height * dpr));
        canvas.style.width = Math.floor(viewport.width) + 'px';
        canvas.style.height = Math.floor(viewport.height) + 'px';

        const task = page.render({
            canvasContext: ctx,
            viewport,
            transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null
        });
        renderTask = task;

        try {
            await task.promise;
        } catch (error) {
            if (error && error.name === 'RenderingCancelledException') return;
            if (mySession === session) fail('No se pudo dibujar la página.');
            return;
        } finally {
            if (renderTask === task) renderTask = null;
        }

        if (mySession !== session) return;

        ui.canvas.hidden = false;
        resetStatus();
        updateControls();
    }

    /* --------------------------- Navegación / zoom -------------------------- */

    async function goToPage(target) {
        if (!pdfDoc) return;
        const total = pdfDoc.numPages;
        const nextPage = Math.min(Math.max(1, target), total);
        if (nextPage === pageNumber) return;

        pageNumber = nextPage;
        updateControls();
        ui.stage.scrollTop = 0;
        ui.stage.scrollLeft = 0;
        await renderCurrentPage(session);
    }

    async function changeZoom(delta) {
        if (!pdfDoc) return;
        const nextIndex = Math.min(Math.max(0, zoomIndex + delta), ZOOM_STEPS.length - 1);
        if (nextIndex === zoomIndex) return;

        zoomIndex = nextIndex;
        updateControls();
        await renderCurrentPage(session);
        if (zoomIndex === 0) ui.stage.scrollLeft = 0;
    }

    return {
        open: open,
        close: close,
        isPdf: isPdf
    };
})();
