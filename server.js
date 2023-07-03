/* unofficial forums */

const fs = require("node:fs");
const express = require("express");
const morgan = require("morgan");
const db = require("./api/database");
const app = express();

process.on("uncaughtException", (error) => {
    console.error(error);
});

const api = require("./api");

app.use(morgan("combined"));
app.use(express.urlencoded({extended: true}));
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use("/api", api);

app.get("/boards/:boardID", (req, res) => {
    const boardID = req.params.boardID;
    db.query("SELECT * FROM boards WHERE id = ?", [boardID], (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).send("Internal server error.");
        } else if (results.length === 0) {
            res.status(404).send("Board not found.");
        } else {
            const board = results[0];
            const html = fs.readFileSync(__dirname + "/public/boards.html", "utf8").replace(/{{boardName}}/g, board.name).replace(/{{boardDescription}}/g, board.description);
            if (board.visible) {
                res.setHeader("X-Robots-Tag", "noindex").send(html);
            } else {
                res.send(html);
            }
        }
    });
});

app.get("*", (req, res) => {
    res.status(404).sendFile(__dirname + "/public/404.html");
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});