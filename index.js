const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const db = new Database('tilbud.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS tilbud (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prosjektnavn TEXT NOT NULL,
    kunde TEXT,
    generert_tekst TEXT,
    utstyr TEXT,
    timer TEXT,
    total_pris REAL,
    status TEXT DEFAULT 'utkast',
    opprettet TEXT DEFAULT (datetime('now'))
  )
`);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/tilbud', (req, res) => {
  const tilbud = db.prepare('SELECT * FROM tilbud ORDER BY opprettet DESC').all();
  res.json(tilbud);
});

app.get('/api/tilbud/:id', (req, res) => {
  const tilbud = db.prepare('SELECT * FROM tilbud WHERE id = ?').get(req.params.id);
  if (!tilbud) return res.status(404).json({ feil: 'Tilbud ikke funnet' });
  res.json(tilbud);
});

app.post('/api/tilbud', (req, res) => {
  const { prosjektnavn, kunde, generert_tekst, utstyr, timer, total_pris, status } = req.body;
  if (!prosjektnavn) return res.status(400).json({ feil: 'Prosjektnavn er påkrevd' });
  const result = db.prepare(
    'INSERT INTO tilbud (prosjektnavn, kunde, generert_tekst, utstyr, timer, total_pris, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(prosjektnavn, kunde || null, generert_tekst || null, utstyr || null, timer || null, total_pris || null, status || 'utkast');
  res.status(201).json(db.prepare('SELECT * FROM tilbud WHERE id = ?').get(result.lastInsertRowid));
});

app.put('/api/tilbud/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM tilbud WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ feil: 'Tilbud ikke funnet' });
  const { prosjektnavn, kunde, generert_tekst, utstyr, timer, total_pris, status } = req.body;
  db.prepare(
    'UPDATE tilbud SET prosjektnavn=?, kunde=?, generert_tekst=?, utstyr=?, timer=?, total_pris=?, status=? WHERE id=?'
  ).run(prosjektnavn, kunde || null, generert_tekst || null, utstyr || null, timer || null, total_pris || null, status, req.params.id);
  res.json(db.prepare('SELECT * FROM tilbud WHERE id = ?').get(req.params.id));
});

app.delete('/api/tilbud/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM tilbud WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ feil: 'Tilbud ikke funnet' });
  db.prepare('DELETE FROM tilbud WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Tilbudsbygger kjører på http://localhost:${PORT}`));
