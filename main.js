const root = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');
const tabButtons = [...document.querySelectorAll('.tab-button')];
const panels = [...document.querySelectorAll('.tool-panel')];
const qrForm = document.getElementById('qr-form');
const urlInput = document.getElementById('url-input');
const urlInputShell = document.getElementById('url-input-shell');
const urlHelp = document.getElementById('url-help');
const clearUrlButton = document.getElementById('clear-url');
const qrPlaceholder = document.getElementById('qr-placeholder');
const qrOutput = document.getElementById('qr-output');
const qrCodeContainer = document.getElementById('qr-code');
const generatedUrl = document.getElementById('generated-url');
const downloadButton = document.getElementById('download-qr');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const browseButton = document.getElementById('browse-button');
const scanPlaceholder = document.getElementById('scan-placeholder');
const scanProgress = document.getElementById('scan-progress');
const scanOutput = document.getElementById('scan-output');
const scanError = document.getElementById('scan-error');
const scanPreview = document.getElementById('scan-preview');
const decodedLink = document.getElementById('decoded-link');
const openUrl = document.getElementById('open-url');
const copyButton = document.getElementById('copy-url');
const retryButton = document.getElementById('retry-scan');
const canvas = document.getElementById('scan-canvas');
const toast = document.getElementById('toast');

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;

let decodedValue = '';
let previewObjectUrl = '';
let toastTimer;

function readSavedTheme() {
  try {
    const savedTheme = localStorage.getItem('qr-link-theme');
    return ['light', 'dark'].includes(savedTheme) ? savedTheme : null;
  } catch {
    return null;
  }
}

function initializeTheme() {
  const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  setTheme(readSavedTheme() || preferredTheme);
}

function setTheme(theme) {
  const safeTheme = theme === 'dark' ? 'dark' : 'light';
  root.dataset.theme = safeTheme;
  try {
    localStorage.setItem('qr-link-theme', safeTheme);
  } catch {
    // 저장소 사용이 차단된 환경에서도 테마 전환 자체는 유지합니다.
  }
  themeToggle.setAttribute('aria-label', safeTheme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환');
}

themeToggle.addEventListener('click', () => {
  setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
});

function activateTab(name) {
  tabButtons.forEach((button) => {
    const active = button.dataset.tab === name;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });
  panels.forEach((panel) => {
    const active = panel.id === `${name}-panel`;
    panel.classList.toggle('active', active);
    panel.hidden = !active;
  });
}

tabButtons.forEach((button, index) => {
  button.addEventListener('click', () => activateTab(button.dataset.tab));
  button.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const target = tabButtons[(index + direction + tabButtons.length) % tabButtons.length];
    activateTab(target.dataset.tab);
    target.focus();
  });
});

function normalizeUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withProtocol);
    const isAllowedProtocol = ['http:', 'https:'].includes(parsed.protocol);
    const hasPublicStyleHost = parsed.hostname.includes('.');
    const hasCredentials = Boolean(parsed.username || parsed.password);
    if (!isAllowedProtocol || !hasPublicStyleHost || hasCredentials || parsed.href.length > 2048) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

function setUrlError(message) {
  urlInputShell.classList.add('error');
  urlHelp.classList.add('error');
  urlHelp.textContent = message;
}

function clearUrlError() {
  urlInputShell.classList.remove('error');
  urlHelp.classList.remove('error');
  urlHelp.textContent = 'http:// 또는 https:// 주소를 입력해 주세요.';
}

urlInput.addEventListener('input', () => {
  clearUrlButton.hidden = !urlInput.value;
  clearUrlError();
});

clearUrlButton.addEventListener('click', () => {
  urlInput.value = '';
  clearUrlButton.hidden = true;
  clearUrlError();
  urlInput.focus();
});

qrForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const validUrl = normalizeUrl(urlInput.value);
  if (!validUrl) {
    setUrlError('올바른 웹 주소를 입력해 주세요. 예: example.com');
    urlInput.focus();
    return;
  }

  urlInput.value = validUrl;
  clearUrlError();
  qrCodeContainer.replaceChildren();
  new QRCode(qrCodeContainer, {
    text: validUrl,
    width: 220,
    height: 220,
    colorDark: '#101914',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });
  generatedUrl.textContent = validUrl;
  generatedUrl.title = validUrl;
  qrPlaceholder.hidden = true;
  qrOutput.hidden = false;
});

downloadButton.addEventListener('click', () => {
  const sourceCanvas = qrCodeContainer.querySelector('canvas');
  const image = qrCodeContainer.querySelector('img');
  const link = document.createElement('a');
  link.download = 'qr-link.png';
  link.href = sourceCanvas ? sourceCanvas.toDataURL('image/png') : image.src;
  link.click();
  showToast('QR 이미지를 저장했어요.');
});

function resetScanState() {
  scanPlaceholder.hidden = true;
  scanOutput.hidden = true;
  scanError.hidden = true;
  scanProgress.hidden = false;
}

function showScanError() {
  scanProgress.hidden = true;
  scanOutput.hidden = true;
  scanError.hidden = false;
}

function isWebUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol)
      && Boolean(url.hostname)
      && !url.username
      && !url.password
      && url.href.length <= 2048;
  } catch {
    return false;
  }
}

async function processImage(file) {
  if (!file || !ALLOWED_IMAGE_TYPES.has(file.type)) {
    showToast('PNG, JPG 또는 WEBP 이미지를 선택해 주세요.');
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    showToast('이미지는 10MB 이하만 사용할 수 있어요.');
    return;
  }

  resetScanState();
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();

  image.onload = () => {
    if (image.naturalWidth * image.naturalHeight > MAX_IMAGE_PIXELS) {
      URL.revokeObjectURL(objectUrl);
      showToast('이미지 해상도가 너무 높아요.');
      showScanError();
      return;
    }

    const maxDimension = 1800;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const result = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });

    if (result && isWebUrl(result.data)) {
      decodedValue = new URL(result.data).href;
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
      previewObjectUrl = objectUrl;
      scanPreview.src = previewObjectUrl;
      decodedLink.textContent = decodedValue;
      decodedLink.href = decodedValue;
      openUrl.href = decodedValue;
      scanProgress.hidden = true;
      scanOutput.hidden = false;
    } else {
      URL.revokeObjectURL(objectUrl);
      showScanError();
    }
  };

  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    showScanError();
  };
  image.src = objectUrl;
}

['dragenter', 'dragover'].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add('dragging');
  });
});

['dragleave', 'drop'].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragging');
  });
});

dropZone.addEventListener('drop', (event) => processImage(event.dataTransfer.files[0]));
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    fileInput.click();
  }
});

browseButton.addEventListener('click', (event) => {
  event.stopPropagation();
  fileInput.click();
});

fileInput.addEventListener('change', () => {
  processImage(fileInput.files[0]);
  fileInput.value = '';
});

retryButton.addEventListener('click', () => fileInput.click());
copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(decodedValue);
    showToast('URL을 복사했어요.');
  } catch {
    showToast('복사하지 못했어요.');
  }
});

function showToast(message) {
  toast.querySelector('span').textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

initializeTheme();
lucide.createIcons();
