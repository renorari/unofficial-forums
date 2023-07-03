/* Database */

const { setTimeout } = require("node:timers");
const mysql = require("mysql2");
require("dotenv").config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: "forums"
};

let connection = mysql.createConnection(dbConfig);

async function handleDisconnect() {
    try {
        connection = mysql.createConnection(dbConfig);
        console.log("Connected to MySQL database.");
    } catch (error) {
        console.error(error);
        setTimeout(handleDisconnect, 1000);
    }

    connection.on("error", async (error) => {
        console.error(error);
        console.log("Reconnecting to MySQL database...");
        await handleDisconnect();
    });
}

handleDisconnect();

module.exports = connection;