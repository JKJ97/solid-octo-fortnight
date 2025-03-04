const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware JSON-datan käsittelyyn
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Palvele staattisia tiedostoja (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

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

// Lähetä index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Hae kaikki käyttäjät
app.get("/users", (req, res) => {
    db.all("SELECT * FROM users", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Lisää uusi käyttäjä
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
            res.json({ id: this.lastID });
        }
    );
});

// Poista käyttäjä
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
    console.log(`Palvelin käynnissä osoitteessa http://localhost:${PORT}/index.html`);
});
