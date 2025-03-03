const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// Middleware JSON-datan käsittelyyn
app.use(bodyParser.json());

// Luo ja avaa SQLite-tietokanta
const db = new sqlite3.Database("database.db", (err) => {
    if (err) {
        console.error("Tietokantavirhe:", err.message);
    } else {
        console.log("Yhteys SQLite-tietokantaan avattu.");
    }
});

// Luo taulu, jos sitä ei ole olemassa
db.run(
    `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        age INTEGER NOT NULL
    )`,
    (err) => {
        if (err) {
            console.error("Virhe taulun luonnissa:", err.message);
        } else {
            console.log("Taulu 'users' varmistettu.");
        }
    }
);

// === CRUD-REITIT ===

// 1. Hae kaikki käyttäjät (READ) curl http://localhost:3000/users
app.get("/users", (req, res) => {
    db.all("SELECT * FROM users", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 2. Lisää uusi käyttäjä (CREATE) curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name": "Matti", "email": "matti@example.com", "age": 30}'
app.post("/users", (req, res) => {
    const { name, email, age } = req.body;
    if (!name || !email || !age) {
        res.status(400).json({ error: "Kaikki kentät ovat pakollisia" });
        return;
    }

    db.run(
        "INSERT INTO users (name, email, age) VALUES (?, ?, ?)",
        [name, email, age],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID, name, email, age });
        }
    );
});

// 3. Päivitä käyttäjän tiedot (UPDATE) curl -X PUT http://localhost:3000/users/1 -H "Content-Type: application/json" -d '{"name": "Matti Muokattu", "email": "matti@example.com", "age": 31}'

app.put("/users/:id", (req, res) => {
    const { name, email, age } = req.body;
    const { id } = req.params;

    db.run(
        "UPDATE users SET name = ?, email = ?, age = ? WHERE id = ?",
        [name, email, age, id],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: "Käyttäjä päivitetty", changes: this.changes });
        }
    );
});

// 4. Poista käyttäjä (DELETE) curl -X DELETE http://localhost:3000/users/1
app.delete("/users/:id", (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM users WHERE id = ?", id, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: "Käyttäjä poistettu", changes: this.changes });
    });
});

// Käynnistä palvelin
app.listen(PORT, () => {
    console.log(`Palvelin käynnissä osoitteessa http://localhost:${PORT}`);
});
