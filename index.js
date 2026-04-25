const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const db = new Database('verktoy.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS verktoy (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    navn TEXT NOT NULL,
    merke TEXT NOT NULL,
    serienummer TEXT,
    innkjopsdato TEXT,
    pris REAL,
    status TEXT NOT NULL DEFAULT 'tilgjengelig',
    opprettet TEXT DEFAULT (datetime('now'))
  )
`);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/verktoy', (req, res) => {
  const verktoy = db.prepare('SELECT * FROM verktoy ORDER BY opprettet DESC').all();
  res.json(verktoy);
});

app.post('/api/verktoy', (req, res) => {
  const { navn, merke, serienummer, innkjopsdato, pris, status } = req.body;
  if (!navn || !merke) {
    return res.status(400).json({ feil: 'Navn og merke er påkrevd' });
  }
  const stmt = db.prepare(
    'INSERT INTO verktoy (navn, merke, serienummer, innkjopsdato, pris, status) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const result = stmt.run(navn, merke, serienummer || null, innkjopsdato || null, pris || null, status || 'tilgjengelig');
  const nyttVerktoy = db.prepare('SELECT * FROM verktoy WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(nyttVerktoy);
});

app.put('/api/verktoy/:id', (req, res) => {
  const { navn, merke, serienummer, innkjopsdato, pris, status } = req.body;
  const existing = db.prepare('SELECT id FROM verktoy WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ feil: 'Verktøy ikke funnet' });
  db.prepare(
    'UPDATE verktoy SET navn=?, merke=?, serienummer=?, innkjopsdato=?, pris=?, status=? WHERE id=?'
  ).run(navn, merke, serienummer || null, innkjopsdato || null, pris || null, status, req.params.id);
  res.json(db.prepare('SELECT * FROM verktoy WHERE id = ?').get(req.params.id));
});

app.delete('/api/verktoy/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM verktoy WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ feil: 'Verktøy ikke funnet' });
  db.prepare('DELETE FROM verktoy WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Verktøyregister kjører på http://localhost:${PORT}`));
