/* unofficial forums */

const express = require("express");
const app = express();

process.on("uncaughtException", (error) => {
    console.error(error);
});

const api = require("./api");

app.use(express.urlencoded({extended: true}));
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use("/api", api);

app.get("/boards/*", (req, res) => {
    res.sendFile(__dirname + "/public/boards.html");
});

app.get("*", (req, res) => {
    res.status(404).sendFile(__dirname + "/public/404.html");
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});