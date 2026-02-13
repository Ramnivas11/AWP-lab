# File Operations Demo (Node.js)

This project demonstrates reading a file synchronously and asynchronously on the server, and compressing/decompressing via zlib streams.

Run:

```bash
npm install
npm start
```

Open `http://localhost:3000` and use the file input and buttons.

Notes:
- The server saves uploaded files into the `uploads/` folder.
- `Read` endpoints return text content when possible, otherwise base64 for binary files.
- `Compress` returns a `.gz` download; `Decompress` expects a gzipped file and returns the decompressed file.
