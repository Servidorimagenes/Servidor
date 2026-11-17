import {
  compressImageClient,
  generateCatalogFilename,
  type CompressionResult,
} from '@catalog/core-image';
import { uploadToGitHub } from '@catalog/storage-github';
import { uploadToGDrive } from '@catalog/storage-gdrive';
import {
  loadConfig,
  saveConfig,
  loadHistory,
  addHistoryItem,
  clearHistory,
  type AppConfig,
  type UploadHistoryItem,
} from './state.js';

// Estado en memoria
let currentConfig: AppConfig = loadConfig();
let activeCompressed: CompressionResult | null = null;
let activeOriginalFile: File | null = null;

// Elementos del DOM
const cdnStatusBadge = document.getElementById('cdn-status-badge') as HTMLElement;
const unconfiguredAlert = document.getElementById('unconfigured-alert') as HTMLElement;
const btnSetupNow = document.getElementById('btn-setup-now') as HTMLButtonElement;
const btnOpenSettings = document.getElementById('btn-open-settings') as HTMLButtonElement;
const btnCloseSettings = document.getElementById('btn-close-settings') as HTMLButtonElement;
const settingsModal = document.getElementById('settings-modal') as HTMLElement;

// Inputs y botones de archivos
const btnTriggerCamera = document.getElementById('btn-trigger-camera') as HTMLButtonElement;
const btnTriggerGallery = document.getElementById('btn-trigger-gallery') as HTMLButtonElement;
const cameraInput = document.getElementById('camera-input') as HTMLInputElement;
const galleryInput = document.getElementById('gallery-input') as HTMLInputElement;
const previewContainer = document.getElementById('preview-container') as HTMLElement;
const imagePreview = document.getElementById('image-preview') as HTMLImageElement;
const btnRemoveImage = document.getElementById('btn-remove-image') as HTMLButtonElement;

// Estadísticas de compresión
const statOriginalSize = document.getElementById('stat-original-size') as HTMLElement;
const statCompressedSize = document.getElementById('stat-compressed-size') as HTMLElement;
const statSavingsPill = document.getElementById('stat-savings-pill') as HTMLElement;
const statDimensions = document.getElementById('stat-dimensions') as HTMLElement;

// Formulario de producto
const productTitle = document.getElementById('product-title') as HTMLInputElement;
const productCategory = document.getElementById('product-category') as HTMLInputElement;
const productSku = document.getElementById('product-sku') as HTMLInputElement;
const productDetail = document.getElementById('product-detail') as HTMLTextAreaElement;
const maxDimensionSelect = document.getElementById('max-dimension-select') as HTMLSelectElement;
const qualitySelect = document.getElementById('quality-select') as HTMLSelectElement;
const btnUpload = document.getElementById('btn-upload') as HTMLButtonElement;
const uploadBtnText = document.getElementById('upload-btn-text') as HTMLElement;

// Resultado de subida
const resultCard = document.getElementById('result-card') as HTMLElement;
const resultThumb = document.getElementById('result-thumb') as HTMLImageElement;
const resultFilename = document.getElementById('result-filename') as HTMLElement;
const resultCdnUrl = document.getElementById('result-cdn-url') as HTMLInputElement;
const resultMarkdown = document.getElementById('result-markdown') as HTMLInputElement;
const btnCopyCdn = document.getElementById('btn-copy-cdn') as HTMLButtonElement;
const btnCopyMarkdown = document.getElementById('btn-copy-markdown') as HTMLButtonElement;
const btnCloseResult = document.getElementById('btn-close-result') as HTMLButtonElement;
const btnCopyResultSmall = document.getElementById('btn-copy-result-small') as HTMLButtonElement;
const btnViewInHistory = document.getElementById('btn-view-in-history') as HTMLButtonElement;
const btnUploadAnother = document.getElementById('btn-upload-another') as HTMLButtonElement;

// Historial
const historyCount = document.getElementById('history-count') as HTMLElement;
const historyList = document.getElementById('history-list') as HTMLElement;
const historyEmpty = document.getElementById('history-empty') as HTMLElement;
const historyNoMatch = document.getElementById('history-no-match') as HTMLElement;
const historySearch = document.getElementById('history-search') as HTMLInputElement;
const btnClearSearch = document.getElementById('btn-clear-search') as HTMLButtonElement;
const btnResetSearchState = document.getElementById('btn-reset-search-state') as HTMLButtonElement;
const historyCounterText = document.getElementById('history-counter-text') as HTMLElement;
const btnClearHistory = document.getElementById('btn-clear-history') as HTMLButtonElement;

// Lightbox Modal
const lightboxModal = document.getElementById('lightbox-modal') as HTMLElement;
const lightboxTitle = document.getElementById('lightbox-title') as HTMLElement;
const lightboxImg = document.getElementById('lightbox-img') as HTMLImageElement;
const btnCloseLightbox = document.getElementById('btn-close-lightbox') as HTMLButtonElement;
const lightboxUrlInput = document.getElementById('lightbox-url-input') as HTMLInputElement;
const btnCopyLightboxUrl = document.getElementById('btn-copy-lightbox-url') as HTMLButtonElement;
const btnOpenLightboxUrl = document.getElementById('btn-open-lightbox-url') as HTMLAnchorElement;

// Navegación Tabs
const navTabs = document.querySelectorAll('.nav-tab');
const tabPanes = document.querySelectorAll('.tab-pane');

// Configuración Inputs
const settingProvider = document.getElementById('setting-provider') as HTMLSelectElement;
const githubSettingsSection = document.getElementById('github-settings-section') as HTMLElement;
const gdriveSettingsSection = document.getElementById('gdrive-settings-section') as HTMLElement;
const settingGhOwner = document.getElementById('setting-gh-owner') as HTMLInputElement;
const settingGhRepo = document.getElementById('setting-gh-repo') as HTMLInputElement;
const settingGhBranch = document.getElementById('setting-gh-branch') as HTMLInputElement;
const settingGhFolder = document.getElementById('setting-gh-folder') as HTMLInputElement;
const settingGhToken = document.getElementById('setting-gh-token') as HTMLInputElement;
const settingGdToken = document.getElementById('setting-gd-token') as HTMLInputElement;
const settingGdFolder = document.getElementById('setting-gd-folder') as HTMLInputElement;
const btnSaveSettings = document.getElementById('btn-save-settings') as HTMLButtonElement;
const btnTestConnection = document.getElementById('btn-test-connection') as HTMLButtonElement;
const testConnectionResult = document.getElementById('test-connection-result') as HTMLElement;

// Toasts
const toastContainer = document.getElementById('toast-container') as HTMLElement;

// ---------------------------------------------------------------------------
// Inicialización Segura
// ---------------------------------------------------------------------------
function init(): void {
  try {
    // 1. Configurar eventos primero para garantizar reactividad inmediata
    setupEventListeners();

    // 2. Sincronizar estado de configuración
    syncConfigUI();
    checkConfigurationStatus();

    // 3. Renderizar historial existente de forma segura
    try {
      renderHistory();
    } catch (hErr) {
      console.warn('Advertencia al renderizar historial inicial:', hErr);
    }

    // 4. Registrar Service Worker solo en entornos de producción
    registerServiceWorker();
  } catch (err) {
    console.error('Error durante la inicialización de la app:', err);
  }
}

function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    // En desarrollo local (Vite), limpiar Service Worker para evitar interferencia con HMR
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister();
        }
      }).catch(() => {});
      return;
    }

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.warn('Registro de Service Worker omitido:', err);
      });
    });
  }
}

function showToast(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

// ---------------------------------------------------------------------------
// Gestión de Configuración
// ---------------------------------------------------------------------------
function syncConfigUI(): void {
  settingProvider.value = currentConfig.provider;
  toggleProviderFields();

  settingGhOwner.value = currentConfig.github.owner;
  settingGhRepo.value = currentConfig.github.repo;
  settingGhBranch.value = currentConfig.github.branch || 'main';
  settingGhFolder.value = currentConfig.github.baseFolder || 'productos';
  settingGhToken.value = currentConfig.github.token;

  settingGdToken.value = currentConfig.gdrive.accessToken;
  settingGdFolder.value = currentConfig.gdrive.folderId;

  maxDimensionSelect.value = String(currentConfig.maxDimension || 1000);
  qualitySelect.value = String(currentConfig.quality || 0.78);
}

function toggleProviderFields(): void {
  if (settingProvider.value === 'github') {
    githubSettingsSection.classList.remove('hidden');
    gdriveSettingsSection.classList.add('hidden');
    cdnStatusBadge.textContent = 'jsDelivr CDN Activo';
  } else {
    githubSettingsSection.classList.add('hidden');
    gdriveSettingsSection.classList.remove('hidden');
    cdnStatusBadge.textContent = 'Google Drive';
  }
}

function checkConfigurationStatus(): void {
  const isGhConfigured = Boolean(currentConfig.github.owner && currentConfig.github.repo && currentConfig.github.token);
  const isGdConfigured = Boolean(currentConfig.gdrive.accessToken);

  const configured = currentConfig.provider === 'github' ? isGhConfigured : isGdConfigured;

  if (!configured) {
    unconfiguredAlert.classList.remove('hidden');
  } else {
    unconfiguredAlert.classList.add('hidden');
  }
}

// ---------------------------------------------------------------------------
// Procesamiento y Compresión de Imagen en Cliente
// ---------------------------------------------------------------------------
async function handleFileSelect(file: File): Promise<void> {
  activeOriginalFile = file;

  // Si el campo de título está vacío, sugerir nombre a partir del archivo
  if (!productTitle.value.trim()) {
    const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    if (rawName && !rawName.startsWith('image') && !rawName.startsWith('IMG')) {
      productTitle.value = rawName;
    }
  }

  uploadBtnText.textContent = 'Procesando y optimizando imagen...';
  btnUpload.disabled = true;

  try {
    const maxDim = parseInt(maxDimensionSelect.value, 10) || 1000;
    const quality = parseFloat(qualitySelect.value) || 0.78;

    const result = await compressImageClient(file, {
      maxDimension: maxDim,
      quality,
      format: 'image/webp',
    });

    activeCompressed = result;

    // Actualizar previsualización
    imagePreview.src = result.dataUrl;
    previewContainer.classList.remove('hidden');

    // Actualizar estadísticas
    statOriginalSize.textContent = formatBytes(result.originalSize);
    statCompressedSize.textContent = formatBytes(result.compressedSize);
    statSavingsPill.textContent = `Ahorro del ${result.savingsPercent}%`;
    statDimensions.textContent = `Resolución: ${result.dimensions.width} x ${result.dimensions.height} px`;

    // Habilitar botón de subida
    uploadBtnText.textContent = `⚡ Subir al Servidor CDN (${formatBytes(result.compressedSize)})`;
    btnUpload.disabled = false;

    showToast(`Imagen optimizada a ${formatBytes(result.compressedSize)} (-${result.savingsPercent}%)`, 'success');
  } catch (err: any) {
    console.error('Error al comprimir:', err);
    showToast(`Error de optimización: ${err.message}`, 'error');
    uploadBtnText.textContent = 'Selecciona una foto para subir';
    btnUpload.disabled = true;
  }
}

function clearActiveImage(): void {
  activeCompressed = null;
  activeOriginalFile = null;
  imagePreview.src = '';
  previewContainer.classList.add('hidden');
  cameraInput.value = '';
  galleryInput.value = '';
  uploadBtnText.textContent = 'Selecciona una foto para subir';
  btnUpload.disabled = true;
}

// ---------------------------------------------------------------------------
// Subida al Servidor (GitHub / Google Drive)
// ---------------------------------------------------------------------------
async function handleUpload(): Promise<void> {
  if (!activeCompressed) {
    showToast('Selecciona o toma una foto primero.', 'error');
    return;
  }

  const title = productTitle.value.trim();
  if (!title) {
    showToast('Por favor escribe el nombre del producto.', 'error');
    productTitle.focus();
    return;
  }

  const category = productCategory.value.trim() || 'productos';
  const sku = productSku.value.trim();
  const detail = productDetail.value.trim();

  // Validar credenciales
  if (currentConfig.provider === 'github') {
    if (!currentConfig.github.owner || !currentConfig.github.repo || !currentConfig.github.token) {
      showToast('Configura tu usuario, repositorio y token de GitHub en Ajustes.', 'error');
      settingsModal.classList.remove('hidden');
      return;
    }
  } else {
    if (!currentConfig.gdrive.accessToken) {
      showToast('Configura tu token de Google Drive en Ajustes.', 'error');
      settingsModal.classList.remove('hidden');
      return;
    }
  }

  // Generar nombre estructurado
  const filenameMeta = generateCatalogFilename({
    title,
    category,
    sku,
    extension: 'webp',
    baseFolder: currentConfig.provider === 'github' ? currentConfig.github.baseFolder : '',
  });

  btnUpload.disabled = true;
  uploadBtnText.textContent = 'Subiendo al servidor CDN...';

  try {
    let cdnUrl = '';
    let directLinks: any = null;

    if (currentConfig.provider === 'github') {
      const uploadRes = await uploadToGitHub(
        {
          owner: currentConfig.github.owner,
          repo: currentConfig.github.repo,
          branch: currentConfig.github.branch || 'main',
          token: currentConfig.github.token,
          baseFolder: '',
        },
        {
          path: filenameMeta.fullPath,
          base64Content: activeCompressed.base64,
          commitMessage: `Agregar foto catálogo: ${title} (${sku || filenameMeta.filename})`,
        }
      );

      cdnUrl = uploadRes.cdnUrl;
      directLinks = uploadRes.directLinks;
    } else {
      const gdriveRes = await uploadToGDrive(
        {
          accessToken: currentConfig.gdrive.accessToken,
          folderId: currentConfig.gdrive.folderId,
        },
        {
          filename: filenameMeta.filename,
          mimeType: 'image/webp',
          base64Content: activeCompressed.base64,
          description: `${title} - ${detail}`,
        }
      );
      cdnUrl = gdriveRes.directViewUrl;
    }

    // Mostrar resultados
    resultFilename.textContent = filenameMeta.filename;
    resultThumb.src = activeCompressed.dataUrl;
    resultCdnUrl.value = cdnUrl;
    resultMarkdown.value = `![${title}](${cdnUrl})`;
    resultCard.classList.remove('hidden');

    // Copiar automáticamente al portapapeles
    try {
      await navigator.clipboard.writeText(cdnUrl);
      showToast('¡Enlace CDN copiado al portapapeles!', 'success');
    } catch {
      showToast('¡Imagen subida con éxito!', 'success');
    }

    // Guardar en el historial
    const historyItem: UploadHistoryItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title,
      category,
      sku,
      detail,
      filename: filenameMeta.filename,
      originalSize: activeCompressed.originalSize,
      compressedSize: activeCompressed.compressedSize,
      savingsPercent: activeCompressed.savingsPercent,
      cdnUrl,
      directLinks,
      timestamp: Date.now(),
      thumbnailUrl: activeCompressed.dataUrl,
    };

    addHistoryItem(historyItem);
    renderHistory();

    // Scroll suave hacia la tarjeta de resultado
    resultCard.scrollIntoView({ behavior: 'smooth' });

    // Limpiar imagen activa para la siguiente toma
    clearActiveImage();
  } catch (err: any) {
    console.error('Error al subir:', err);
    showToast(`Error al subir: ${err.message}`, 'error');
  } finally {
    btnUpload.disabled = false;
    uploadBtnText.textContent = activeCompressed
      ? `⚡ Subir al Servidor CDN (${formatBytes(activeCompressed.compressedSize)})`
      : 'Selecciona una foto para subir';
  }
}

// ---------------------------------------------------------------------------
// Modal Lightbox
// ---------------------------------------------------------------------------
function openLightbox(item: UploadHistoryItem): void {
  lightboxTitle.textContent = item.title;
  lightboxImg.src = item.thumbnailUrl || item.cdnUrl;
  lightboxUrlInput.value = item.cdnUrl;
  btnOpenLightboxUrl.href = item.cdnUrl;
  lightboxModal.classList.remove('hidden');
}

function closeLightbox(): void {
  lightboxModal.classList.add('hidden');
}

// ---------------------------------------------------------------------------
// Navegación entre Pestañas
// ---------------------------------------------------------------------------
function switchTab(tabId: string): void {
  navTabs.forEach((t) => {
    if (t.getAttribute('data-tab') === tabId) {
      t.classList.add('active');
    } else {
      t.classList.remove('active');
    }
  });

  tabPanes.forEach((p) => {
    if (p.id === tabId) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });

  if (tabId === 'history-tab') {
    renderHistory();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// ---------------------------------------------------------------------------
// Renderizado de Historial
// ---------------------------------------------------------------------------
function renderHistory(): void {
  const history = loadHistory();
  historyCount.textContent = String(history.length);

  const query = historySearch.value.trim().toLowerCase();

  // Controlar visibilidad del botón de limpiar búsqueda
  if (query) {
    btnClearSearch.classList.remove('hidden');
  } else {
    btnClearSearch.classList.add('hidden');
  }

  // Filtrar por nombre, SKU, categoría o por la misma URL con validación segura
  const filtered = query
    ? history.filter((h) => {
        const title = (h.title || '').toLowerCase();
        const sku = (h.sku || '').toLowerCase();
        const category = (h.category || '').toLowerCase();
        const cdnUrl = (h.cdnUrl || '').toLowerCase();
        const filename = (h.filename || '').toLowerCase();
        return (
          title.includes(query) ||
          sku.includes(query) ||
          category.includes(query) ||
          cdnUrl.includes(query) ||
          filename.includes(query)
        );
      })
    : history;

  // Estado: No hay ninguna imagen guardada
  if (history.length === 0) {
    historyList.innerHTML = '';
    historyEmpty.classList.remove('hidden');
    historyNoMatch.classList.add('hidden');
    historyCounterText.textContent = '0 imágenes en catálogo';
    return;
  }

  // Estado: Hay imágenes pero ninguna coincide con la búsqueda
  if (filtered.length === 0) {
    historyList.innerHTML = '';
    historyEmpty.classList.add('hidden');
    historyNoMatch.classList.remove('hidden');
    historyCounterText.textContent = `0 de ${history.length} imágenes encontradas`;
    return;
  }

  // Estado con resultados
  historyEmpty.classList.add('hidden');
  historyNoMatch.classList.add('hidden');
  historyCounterText.textContent = query
    ? `Mostrando ${filtered.length} de ${history.length} imágenes filtradas`
    : `Total: ${history.length} imágenes almacenadas en CDN`;

  historyList.innerHTML = '';

  filtered.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'history-item-card';

    const dateStr = new Date(item.timestamp).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    const displaySize = formatBytes(item.compressedSize);
    const savingsStr = item.savingsPercent > 0 ? `(-${item.savingsPercent}%)` : '';

    card.innerHTML = `
      <div class="history-item-main">
        <!-- Columna de Miniatura con Botón Pequeño de Copiar pegado al lado de la imagen -->
        <div class="history-thumb-col">
          <div class="history-thumb-wrapper" title="Clic para ampliar miniatura">
            <img src="${item.thumbnailUrl || item.cdnUrl}" alt="${item.title}" class="history-thumb" loading="lazy" />
            <span class="history-thumb-badge">${displaySize}</span>
          </div>
          <!-- Botón de copiar pequeño pegado a la imagen -->
          <button class="btn-copy-small-thumb" data-url="${item.cdnUrl}" title="Copiar URL directa de esta imagen">
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span>Copiar</span>
          </button>
        </div>

        <!-- Detalles del Producto -->
        <div class="history-details">
          <div class="history-item-header">
            <h3 class="history-item-title">${item.title}</h3>
            <button class="btn-copy-icon-quick" data-url="${item.cdnUrl}" title="Copiar URL directa al portapapeles">
              <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
          </div>

          <div class="history-tags-row">
            ${item.sku ? `<span class="history-sku-badge">SKU: ${item.sku}</span>` : ''}
            <span class="history-cat-badge">📂 ${item.category || 'productos'}</span>
          </div>

          <div class="history-item-meta">
            ${displaySize} ${savingsStr} • Subida: ${dateStr}
          </div>
        </div>
      </div>

      <!-- Dirección URL Asignada Destacada -->
      <div class="history-url-box">
        <span class="history-url-label">Dirección URL Asignada (CDN):</span>
        <div class="history-url-row">
          <input type="text" class="history-url-input" value="${item.cdnUrl}" readonly title="Dirección permanente asignada" />
          <div class="history-url-actions">
            <button class="btn btn-sm btn-copy-history" data-url="${item.cdnUrl}" title="Copiar enlace directo">
              📋 Copiar
            </button>
            <a href="${item.cdnUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-secondary btn-open-history" title="Abrir en pestaña nueva para verificar carga directa">
              Abrir ↗
            </a>
          </div>
        </div>
      </div>
    `;

    // Clic en la miniatura para abrir en grande
    const thumbWrapper = card.querySelector('.history-thumb-wrapper') as HTMLElement;
    thumbWrapper.addEventListener('click', () => openLightbox(item));

    // Función auxiliar para copiar y dar retroalimentación visual
    const handleCopy = async (btn: HTMLElement, showLabel: boolean = false) => {
      try {
        await navigator.clipboard.writeText(item.cdnUrl);
        const originalHtml = btn.innerHTML;
        btn.classList.add('copied');
        if (showLabel) btn.innerHTML = '✓ Copiado';
        showToast(`¡URL copiada para ${item.title}!`, 'success');
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = originalHtml;
        }, 2000);
      } catch {
        showToast('No se pudo copiar automáticamente', 'error');
      }
    };

    // Botón pequeño pegado a la imagen
    const smallThumbBtn = card.querySelector('.btn-copy-small-thumb') as HTMLButtonElement;
    smallThumbBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleCopy(smallThumbBtn, true);
    });

    // Botón de icono rápido superior
    const quickIconBtn = card.querySelector('.btn-copy-icon-quick') as HTMLButtonElement;
    quickIconBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleCopy(quickIconBtn);
    });

    // Botón Copiar en la barra de URL
    const copyBtn = card.querySelector('.btn-copy-history') as HTMLButtonElement;
    copyBtn.addEventListener('click', () => handleCopy(copyBtn, true));

    // Clic en el input de URL para seleccionar automáticamente todo el texto
    const urlInput = card.querySelector('.history-url-input') as HTMLInputElement;
    urlInput.addEventListener('click', () => urlInput.select());

    historyList.appendChild(card);
  });
}

// ---------------------------------------------------------------------------
// Probar Conexión con GitHub
// ---------------------------------------------------------------------------
async function testGitHubConnection(): Promise<void> {
  const owner = settingGhOwner.value.trim();
  const repo = settingGhRepo.value.trim();
  const token = settingGhToken.value.trim();

  if (!owner || !repo || !token) {
    testConnectionResult.className = 'test-result-box error';
    testConnectionResult.textContent = 'Ingresa usuario, repositorio y token para probar la conexión.';
    testConnectionResult.classList.remove('hidden');
    return;
  }

  btnTestConnection.disabled = true;
  btnTestConnection.textContent = 'Verificando con GitHub...';
  testConnectionResult.classList.add('hidden');

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (res.ok) {
      testConnectionResult.className = 'test-result-box success';
      testConnectionResult.textContent = `✓ Conexión exitosa con "${data.full_name}". Los enlaces CDN jsDelivr funcionarán perfectamente.`;
    } else {
      testConnectionResult.className = 'test-result-box error';
      testConnectionResult.textContent = `Error (${res.status}): ${data.message || 'No se pudo acceder al repositorio'}`;
    }
    testConnectionResult.classList.remove('hidden');
  } catch (err: any) {
    testConnectionResult.className = 'test-result-box error';
    testConnectionResult.textContent = `Error de conexión: ${err.message}`;
    testConnectionResult.classList.remove('hidden');
  } finally {
    btnTestConnection.disabled = false;
    btnTestConnection.textContent = '🔍 Probar Conexión con Repositorio';
  }
}

// ---------------------------------------------------------------------------
// Event Listeners
// ---------------------------------------------------------------------------
function setupEventListeners(): void {
  // Manejo de botones de Cámara y Galería
  btnTriggerCamera?.addEventListener('click', () => {
    cameraInput.click();
  });

  btnTriggerGallery?.addEventListener('click', () => {
    galleryInput.click();
  });

  cameraInput.addEventListener('change', (e: Event) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files[0]) handleFileSelect(files[0]);
  });

  galleryInput.addEventListener('change', (e: Event) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files[0]) handleFileSelect(files[0]);
  });

  btnRemoveImage.addEventListener('click', clearActiveImage);

  // Recalcular compresión si el usuario cambia resolución o calidad
  maxDimensionSelect.addEventListener('change', () => {
    if (activeOriginalFile) handleFileSelect(activeOriginalFile);
  });
  qualitySelect.addEventListener('change', () => {
    if (activeOriginalFile) handleFileSelect(activeOriginalFile);
  });

  // Botón subir
  btnUpload.addEventListener('click', handleUpload);

  // Botones de copiar resultado
  btnCopyCdn.addEventListener('click', async () => {
    if (resultCdnUrl.value) {
      await navigator.clipboard.writeText(resultCdnUrl.value);
      showToast('Enlace CDN copiado', 'success');
    }
  });

  btnCopyResultSmall?.addEventListener('click', async () => {
    if (resultCdnUrl.value) {
      await navigator.clipboard.writeText(resultCdnUrl.value);
      btnCopyResultSmall.classList.add('copied');
      btnCopyResultSmall.innerHTML = '✓ Copiado';
      showToast('Enlace CDN copiado desde miniatura', 'success');
      setTimeout(() => {
        btnCopyResultSmall.classList.remove('copied');
        btnCopyResultSmall.innerHTML = `
          <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span>Copiar</span>
        `;
      }, 2000);
    }
  });

  btnCopyMarkdown.addEventListener('click', async () => {
    if (resultMarkdown.value) {
      await navigator.clipboard.writeText(resultMarkdown.value);
      showToast('Snippet Markdown copiado', 'success');
    }
  });

  btnCloseResult.addEventListener('click', () => {
    resultCard.classList.add('hidden');
  });

  // Botones posteriores a la subida
  btnViewInHistory.addEventListener('click', () => {
    switchTab('history-tab');
  });

  btnUploadAnother.addEventListener('click', () => {
    resultCard.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    cameraInput.click();
  });

  // Pestañas
  navTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-tab');
      if (targetId) switchTab(targetId);
    });
  });

  // Búsqueda y Filtros en Historial
  historySearch.addEventListener('input', renderHistory);

  btnClearSearch.addEventListener('click', () => {
    historySearch.value = '';
    renderHistory();
    historySearch.focus();
  });

  btnResetSearchState.addEventListener('click', () => {
    historySearch.value = '';
    renderHistory();
  });

  // Lightbox Modal
  btnCloseLightbox.addEventListener('click', closeLightbox);
  lightboxModal.addEventListener('click', (e: MouseEvent) => {
    if (e.target === lightboxModal) closeLightbox();
  });

  btnCopyLightboxUrl.addEventListener('click', async () => {
    if (lightboxUrlInput.value) {
      await navigator.clipboard.writeText(lightboxUrlInput.value);
      showToast('Enlace copiado desde visor', 'success');
    }
  });

  btnClearHistory.addEventListener('click', () => {
    if (confirm('¿Deseas vaciar el historial de imágenes local?')) {
      clearHistory();
      renderHistory();
      showToast('Historial vaciado', 'info');
    }
  });

  // Modal Configuración
  const openSettings = () => {
    syncConfigUI();
    testConnectionResult.classList.add('hidden');
    settingsModal.classList.remove('hidden');
  };
  btnOpenSettings.addEventListener('click', openSettings);
  btnSetupNow.addEventListener('click', openSettings);
  btnCloseSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));

  settingProvider.addEventListener('change', toggleProviderFields);
  btnTestConnection.addEventListener('click', testGitHubConnection);

  btnSaveSettings.addEventListener('click', () => {
    currentConfig = {
      provider: settingProvider.value as any,
      github: {
        owner: settingGhOwner.value.trim(),
        repo: settingGhRepo.value.trim(),
        branch: settingGhBranch.value.trim() || 'main',
        baseFolder: settingGhFolder.value.trim() || 'productos',
        token: settingGhToken.value.trim(),
      },
      gdrive: {
        accessToken: settingGdToken.value.trim(),
        folderId: settingGdFolder.value.trim(),
      },
      maxDimension: parseInt(maxDimensionSelect.value, 10) || 1000,
      quality: parseFloat(qualitySelect.value) || 0.78,
    };

    saveConfig(currentConfig);
    checkConfigurationStatus();
    settingsModal.classList.add('hidden');
    showToast('Configuración guardada correctamente', 'success');
  });
}

// Iniciar aplicación de forma inmediata si el DOM ya está listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
