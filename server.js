const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

const db = new sqlite3.Database('database.db');

db.run(`
  CREATE TABLE IF NOT EXISTS pembayaran (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT,
    email TEXT,
    nomorhp TEXT,
    metode TEXT,
    total INTEGER,
    catatan TEXT,
    waktu TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/submit', (req, res) => {
  const { nama, email, nomorhp, metode, total, catatan } = req.body;

  if (!nama || !email || !nomorhp || !metode || !total || isNaN(total) || total <= 0) {
    return res.status(400).send("Data tidak valid. Mohon isi dengan benar.");
  }

  db.run(
    `INSERT INTO pembayaran (nama, email, nomorhp, metode, total, catatan) VALUES (?, ?, ?, ?, ?, ?)`,
    [nama, email, nomorhp, metode, Number(total), catatan],
    function(err) {
      if (err) {
        console.error("Error simpan data:", err.message);  // <-- Tampilkan error di console
        return res.status(500).send("Gagal menyimpan data: " + err.message); // <-- Kirim error ke browser supaya kelihatan
      }
      res.send("Pembayaran berhasil dikirim dan disimpan.");
    }
  );
});


app.get('/admin', (req, res) => {
  db.all(`SELECT * FROM pembayaran ORDER BY waktu DESC`, [], (err, rows) => {
    if (err) {
      console.error("Error ambil data:", err.message);
      return res.status(500).send("Gagal mengambil data.");
    }

    let html = `
      <html>
      <head>
        <title>Admin - Data Pembayaran</title>
        <style>
          body { font-family: Arial; margin: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ccc; padding: 8px; }
          th { background: #007aff; color: white; }
          tr:hover { background: #f0f8ff; }
        </style>
      </head>
      <body>
        <h1>Data Pembayaran</h1>
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Nama</th><th>Email</th><th>Nomor HP</th><th>Metode</th><th>Total</th><th>Catatan</th><th>Waktu</th>
            </tr>
          </thead>
          <tbody>
    `;

    rows.forEach(row => {
      html += `
        <tr>
          <td>${row.id}</td>
          <td>${row.nama}</td>
          <td>${row.email}</td>
          <td>${row.nomorhp}</td>
          <td>${row.metode}</td>
          <td>Rp ${row.total}</td>
          <td>${row.catatan || '-'}</td>
          <td>${row.waktu}</td>
        </tr>
      `;
    });

    html += `</tbody></table></body></html>`;

    res.send(html);
  });
});

app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});
