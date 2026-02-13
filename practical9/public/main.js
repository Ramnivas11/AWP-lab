const fileInput = document.getElementById('fileInput');
const btnSync = document.getElementById('btnSync');
const btnAsync = document.getElementById('btnAsync');
const btnCompress = document.getElementById('btnCompress');
const btnDecompress = document.getElementById('btnDecompress');
const output = document.getElementById('output');

function showMessage(msg) {
  output.innerText = msg;
}

function postFile(endpoint, file, expectBlob = false) {
  const fd = new FormData();
  fd.append('file', file);
  return fetch(endpoint, { method: 'POST', body: fd });
}

btnSync.addEventListener('click', () => {
  const file = fileInput.files[0];
  if (!file) return showMessage('Select a file first');
  showMessage('Reading file synchronously on server...');
  postFile('/read-sync', file).then(r => r.json()).then(j => {
    if (j.type === 'text') showMessage(j.content);
    else if (j.type === 'binary') showMessage('Binary file (base64):\n' + j.content);
    else showMessage(JSON.stringify(j));
  }).catch(err => showMessage('Error: ' + err.message));
});

btnAsync.addEventListener('click', () => {
  const file = fileInput.files[0];
  if (!file) return showMessage('Select a file first');
  showMessage('Reading file asynchronously on server...');
  postFile('/read-async', file).then(r => r.json()).then(j => {
    if (j.type === 'text') showMessage(j.content);
    else if (j.type === 'binary') showMessage('Binary file (base64):\n' + j.content);
    else showMessage(JSON.stringify(j));
  }).catch(err => showMessage('Error: ' + err.message));
});

btnCompress.addEventListener('click', () => {
  const file = fileInput.files[0];
  if (!file) return showMessage('Select a file first');
  showMessage('Compressing file on server...');
  const fd = new FormData();
  fd.append('file', file);
  fetch('/compress', { method: 'POST', body: fd }).then(r => {
    if (!r.ok) return r.json().then(j => Promise.reject(j.error || 'Error'));
    return r.blob();
  }).then(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name + '.gz';
    a.textContent = 'Download compressed file';
    output.innerHTML = '';
    output.appendChild(a);
  }).catch(err => showMessage('Error: ' + (err.message || err)));
});

btnDecompress.addEventListener('click', () => {
  const file = fileInput.files[0];
  if (!file) return showMessage('Select a file first');
  showMessage('Decompressing file on server...');
  const fd = new FormData();
  fd.append('file', file);
  fetch('/decompress', { method: 'POST', body: fd }).then(r => {
    if (!r.ok) return r.json().then(j => Promise.reject(j.error || 'Error'));
    return r.blob();
  }).then(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // server sets filename; we attempt to keep original
    a.download = file.name.replace(/\.gz$/, '') || (file.name + '.decompressed');
    a.textContent = 'Download decompressed file';
    output.innerHTML = '';
    output.appendChild(a);
  }).catch(err => showMessage('Error: ' + (err.message || err)));
});
