const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.post('/read-sync', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });
  const filePath = file.path;
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    res.json({ type: 'text', filename: file.originalname, content: text });
  } catch (e) {
    try {
      const buf = fs.readFileSync(filePath);
      res.json({ type: 'binary', filename: file.originalname, content: buf.toString('base64') });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
});

app.post('/read-async', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });
  const filePath = file.path;
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (!err) return res.json({ type: 'text', filename: file.originalname, content: data });
    fs.readFile(filePath, (err2, buf) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ type: 'binary', filename: file.originalname, content: buf.toString('base64') });
    });
  });
});

app.post('/compress', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });
  const source = file.path;
  const target = source + '.gz';
  const inp = fs.createReadStream(source);
  const out = fs.createWriteStream(target);
  const gzip = zlib.createGzip();
  inp.pipe(gzip).pipe(out).on('finish', () => {
    res.download(target, path.basename(target), err => {
      if (err) console.error(err);
    });
  }).on('error', err => res.status(500).json({ error: err.message }));
});

app.post('/decompress', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });
  const source = file.path;
  const target = source.replace(/\.gz$/, '') + '.decompressed';
  const inp = fs.createReadStream(source);
  const out = fs.createWriteStream(target);
  const gunzip = zlib.createGunzip();
  inp.pipe(gunzip).pipe(out).on('finish', () => {
    res.download(target, path.basename(target), err => {
      if (err) console.error(err);
    });
  }).on('error', err => res.status(500).json({ error: err.message }));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
