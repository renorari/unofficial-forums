/* ID generator */

const crypto = require("node:crypto");

function generateToken(id) {
    const prefix = Buffer.from(id).toString("base64").replace(/=/g, "");
    const uuid = crypto.randomUUID().replace(/-/, ".").replace(/-/g, "");
    return `${prefix}.${uuid}`;
}

function generateID(ip) {
    const date = new Date();
    const hashed = crypto.createHash("md5").update(`${ip}.${date.getUTCFullYear()}${date.getUTCMonth()}${date.getUTCDate()}`).digest("hex");
    return hashed;
}

module.exports = { generateToken, generateID };