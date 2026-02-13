const express = require("express");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const multer = require("multer");


const app = express();
const PORT = 3000;

const uploadDir = path.join(__dirname, "uploads");
const outputDir = path.join(__dirname, "output");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

function ensureFile(req, res) {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded." });
    return null;
  }
  return req.file;
}

app.post("/read-sync", upload.single("file"), (req, res) => {
  const file = ensureFile(req, res);
  if (!file) return;

  try {
    const data = fs.readFileSync(file.path);
    res.json({
      message: "File read synchronously.",
      filename: file.originalname,
      size: data.length,
      content: data.toString("utf8"),
    });
  } catch (error) {
    res.status(500).json({ error: `Sync read failed: ${error.message}` });
  }
});

app.post("/read-async", upload.single("file"), (req, res) => {
  const file = ensureFile(req, res);
  if (!file) return;

  fs.readFile(file.path, (error, data) => {
    if (error) {
      res.status(500).json({ error: `Async read failed: ${error.message}` });
      return;
    }

    res.json({
      message: "File read asynchronously.",
      filename: file.originalname,
      size: data.length,
      content: data.toString("utf8"),
    });
  });
});

app.post("/compress", upload.single("file"), (req, res) => {
  const file = ensureFile(req, res);
  if (!file) return;

  const outputFile = path.join(outputDir, `${path.basename(file.originalname)}.gz`);
  const readStream = fs.createReadStream(file.path);
  const writeStream = fs.createWriteStream(outputFile);
  const gzip = zlib.createGzip();

  readStream.on("error", (error) => {
    res.status(500).json({ error: `Read stream failed: ${error.message}` });
  });

  writeStream.on("error", (error) => {
    res.status(500).json({ error: `Write stream failed: ${error.message}` });
  });

  writeStream.on("finish", () => {
    res.json({
      message: "File compressed successfully.",
      input: file.originalname,
      output: path.basename(outputFile),
    });
  });

  readStream.pipe(gzip).pipe(writeStream);
});

app.post("/decompress", upload.single("file"), (req, res) => {
  const file = ensureFile(req, res);
  if (!file) return;

  const inputName = path.basename(file.originalname);
  const outputName = inputName.endsWith(".gz")
    ? inputName.replace(/\.gz$/, "")
    : `${inputName}.out`;
  const outputFile = path.join(outputDir, outputName);

  const readStream = fs.createReadStream(file.path);
  const writeStream = fs.createWriteStream(outputFile);
  const gunzip = zlib.createGunzip();

  readStream.on("error", (error) => {
    res.status(500).json({ error: `Read stream failed: ${error.message}` });
  });

  gunzip.on("error", (error) => {
    res.status(500).json({ error: `Decompression failed: ${error.message}` });
  });

  writeStream.on("error", (error) => {
    res.status(500).json({ error: `Write stream failed: ${error.message}` });
  });

  writeStream.on("finish", () => {
    res.json({
      message: "File decompressed successfully.",
      input: file.originalname,
      output: path.basename(outputFile),
    });
  });


  readStream.pipe(gunzip).pipe(writeStream);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
