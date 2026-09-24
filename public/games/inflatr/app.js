const MAGIC = new TextEncoder().encode('INFLATR!');
const FOOTER_BYTES = MAGIC.length + 8;

const $ = (selector) => document.querySelector(selector);
const state = { file: null, restoreFile: null, originalSize: null };

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const unit = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** unit).toFixed(unit ? 2 : 0)} ${units[unit]}`;
};

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.remove('hidden');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.add('hidden'), 3200);
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), {
    href: url,
    download: filename,
  });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function bindDropzone(zone, input, callback) {
  ['dragenter', 'dragover'].forEach((event) =>
    zone.addEventListener(event, (e) => {
      e.preventDefault();
      zone.classList.add('dragging');
    }),
  );
  ['dragleave', 'drop'].forEach((event) =>
    zone.addEventListener(event, (e) => {
      e.preventDefault();
      zone.classList.remove('dragging');
    }),
  );
  zone.addEventListener(
    'drop',
    (e) => e.dataTransfer.files[0] && callback(e.dataTransfer.files[0]),
  );
  input.addEventListener(
    'change',
    () => input.files[0] && callback(input.files[0]),
  );
}

function updateSizes() {
  if (!state.file) return;
  const multiplier = Number($('#multiplier').value);
  $('#multiplier-output').textContent = `${multiplier}×`;
  $('#before-size').textContent = formatBytes(state.file.size);
  $('#after-size').textContent = formatBytes(
    state.file.size * multiplier + FOOTER_BYTES,
  );
}

function selectFile(file) {
  state.file = file;
  $('#dropzone').classList.add('hidden');
  $('#file-card').classList.remove('hidden');
  $('#controls').classList.remove('hidden');
  $('#file-name').textContent = file.name;
  $('#file-size').textContent =
    `${formatBytes(file.size)} · ${file.type || 'UNKNOWN TYPE'}`;
  updateSizes();
}

$('#remove-file').addEventListener('click', () => {
  state.file = null;
  $('#file-input').value = '';
  $('#dropzone').classList.remove('hidden');
  $('#file-card').classList.add('hidden');
  $('#controls').classList.add('hidden');
});

$('#multiplier').addEventListener('input', updateSizes);

$('#inflate-button').addEventListener('click', async () => {
  if (!state.file) return;
  const multiplier = Number($('#multiplier').value);
  const targetSize = state.file.size * multiplier;
  if (
    !Number.isInteger(multiplier) ||
    multiplier < 2 ||
    multiplier > 100 ||
    !Number.isSafeInteger(targetSize) ||
    targetSize + FOOTER_BYTES > 32 * 1024 * 1024
  ) {
    toast(
      'This portfolio demo allows output files up to 32 MiB. Try a smaller file or multiplier.',
    );
    return;
  }
  const originalSize = new ArrayBuffer(8);
  new DataView(originalSize).setBigUint64(0, BigInt(state.file.size), true);
  const padding = new Blob([
    new Uint8Array(Math.max(0, targetSize - state.file.size)),
  ]);
  const inflated = new Blob([state.file, padding, MAGIC, originalSize], {
    type: 'application/octet-stream',
  });
  download(inflated, `${state.file.name}.inflated`);
  toast(
    `SUCCESS: ${formatBytes(state.file.size)} became ${formatBytes(inflated.size)}. Progress?`,
  );
});

async function inspectRestoreFile(file) {
  state.restoreFile = file;
  if (file.size < FOOTER_BYTES) {
    state.originalSize = null;
  } else {
    const footer = new Uint8Array(
      await file.slice(-FOOTER_BYTES).arrayBuffer(),
    );
    const valid = MAGIC.every((byte, index) => footer[index] === byte);
    state.originalSize = valid
      ? Number(new DataView(footer.buffer).getBigUint64(MAGIC.length, true))
      : null;
  }
  $('#restore-dropzone').classList.add('hidden');
  $('#restore-result').classList.remove('hidden');
  if (
    state.originalSize === null ||
    !Number.isSafeInteger(state.originalSize) ||
    state.originalSize > file.size - FOOTER_BYTES
  ) {
    $('#restore-message').textContent =
      'This does not look like an INFLATR file. We admire the size, but cannot verify the original boundary.';
    $('#restore-button').classList.add('hidden');
  } else {
    $('#restore-message').textContent =
      `${file.name} contains a ${formatBytes(state.originalSize)} original buried beneath ${formatBytes(file.size - state.originalSize)} of premium excess.`;
    $('#restore-button').classList.remove('hidden');
  }
}

$('#restore-button').addEventListener('click', () => {
  const name =
    state.restoreFile.name.replace(/\.inflated$/, '') || 'restored-file';
  download(state.restoreFile.slice(0, state.originalSize), name);
  toast('ORIGINAL RESTORED: efficiency reluctantly reinstated.');
});

function setMode(mode) {
  const inflating = mode === 'inflate';
  $('#inflate-tab').classList.toggle('active', inflating);
  $('#restore-tab').classList.toggle('active', !inflating);
  $('#inflate-tab').setAttribute('aria-selected', inflating);
  $('#restore-tab').setAttribute('aria-selected', !inflating);
  $('#inflate-panel').classList.toggle('hidden', !inflating);
  $('#restore-panel').classList.toggle('hidden', inflating);
}

$('#inflate-tab').addEventListener('click', () => setMode('inflate'));
$('#restore-tab').addEventListener('click', () => setMode('restore'));
bindDropzone($('#dropzone'), $('#file-input'), selectFile);
bindDropzone($('#restore-dropzone'), $('#restore-input'), inspectRestoreFile);
