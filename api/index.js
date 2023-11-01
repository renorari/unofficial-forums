/* API */

const express = require("express");
const app = express.Router();
const crypto = require("node:crypto");
const cors = require("cors");
const db = require("./database");
const getIP = require("./getIP");
const { generateToken, generateID } = require("./generate_id");
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());

app.post("/boards", async (req, res) => {
    const { name, description, visibility, deviceId } = req.body;
    const id = crypto.randomBytes(16).toString("hex");
    const ip = getIP(req);
    const userID = generateID(ip, deviceId);
    const token = generateToken(userID);
    if (!name || !description) {
        return res.status(400).json({ error: "Missing required fields." });
    }
    if (name.length > 64) {
        return res.status(400).json({ error: "Name too long." });
    }
    if (description.length > 256) {
        return res.status(400).json({ error: "Description too long." });
    }
    try {
        await db.promise().query("INSERT INTO boards (id, name, description, visibility, last_active, token, ip) VALUES (?, ?, ?, ?, ?, ?, ?)", [id, name, description, visibility, new Date(), token, ip]);
        res.status(201).json({ id, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error." });
    }
});
app.get("/boards", async (req, res) => {
    try {
        const [boards] = await db.promise().query("SELECT * FROM boards");
        const visibleBoards = boards
            .filter((board) => board.visibility)
            .map((board) => ({
                id: board.id,
                name: board.name,
                description: board.description,
                last_active: board.last_active,
            }));
        const { sort, amount } = req.query;
        if (sort === "last_active") {
            visibleBoards.sort(
                (a, b) => new Date(b.last_active) - new Date(a.last_active)
            );
        } else if (sort === "name") {
            visibleBoards.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sort) {
            return res.status(400).json({ error: "Invalid sort method." });
        }
        if (amount) {
            if (isNaN(amount)) {
                return res.status(400).json({ error: "Invalid amount." });
            }
            if (amount < 1) {
                return res.status(400).json({ error: "Invalid amount." });
            }
            visibleBoards.splice(amount);
        }
        res.status(200).json(visibleBoards);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error." });
    }
});

app.get("/boards/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [boards] = await db.promise().query("SELECT * FROM boards WHERE id = ?", [id]);
        if (boards.length === 0) {
            return res.status(404).json({ error: "Board not found." });
        }
        const board = {
            id: boards[0].id,
            name: boards[0].name,
            description: boards[0].description,
            last_active: boards[0].last_active,
            visibility: boards[0].visibility
        };
        res.status(200).json(board);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error." });
    }
});
app.put("/boards/:id", async (req, res) => {
    const { id } = req.params;
    const { name, description, visibility } = req.body;
    const token = req.headers.authorization;
    if (!name || !description) {
        return res.status(400).json({ error: "Missing required fields." });
    }
    if (!token) {
        return res.status(401).json({ error: "Unauthorized." });
    }
    if (name.length > 64) {
        return res.status(400).json({ error: "Name too long." });
    }
    if (description.length > 256) {
        return res.status(400).json({ error: "Description too long." });
    }
    try {
        const [boards] = await db.promise().query("SELECT * FROM boards WHERE id = ?", [id]);
        if (boards.length === 0) {
            return res.status(404).json({ error: "Board not found." });
        }
        if (boards[0].token !== token) {
            return res.status(401).json({ error: "Unauthorized." });
        }
        await db.promise().query("UPDATE boards SET name = ?, description = ?, visibility = ?, last_active WHERE id = ?", [name, description, visibility, new Date(), id]);
        res.status(200).json({ id, name, visibility, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error." });
    }
});
app.delete("/boards/:id", async (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ error: "Unauthorized." });
    }
    try {
        const [boards] = await db.promise().query("SELECT * FROM boards WHERE id = ?", [id]);
        if (boards.length === 0) {
            return res.status(404).json({ error: "Board not found." });
        }
        if (boards[0].token !== token) {
            return res.status(401).json({ error: "Unauthorized." });
        }
        await db.promise().query("DELETE FROM boards WHERE id = ?", [id]);
        await db.promise().query("DELETE FROM posts WHERE board_id = ?", [id]);
        res.status(200).json({ id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error." });
    }
});
app.post("/boards/:id/posts", async (req, res) => {
    const { id } = req.params;
    const { name, content, deviceId } = req.body;
    const ip = getIP(req);
    const userID = generateID(ip, deviceId);
    const token = generateToken(userID);
    if (!name || !content) {
        return res.status(400).json({ error: "Missing required fields." });
    }
    if (name.length > 64) {
        return res.status(400).json({ error: "Name too long." });
    }
    if (content.length > 256) {
        return res.status(400).json({ error: "Content too long." });
    }
    try {
        const [boards] = await db.promise().query("SELECT * FROM boards WHERE id = ?", [id]);
        if (boards.length === 0) {
            return res.status(404).json({ error: "Board not found." });
        }
        await db.promise().query("INSERT INTO posts (id, name, user_id, content, board_id, time, token, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [id, name, userID, content, id, new Date(), token, ip]);
        await db.promise().query("UPDATE boards SET last_active = ? WHERE id = ?", [new Date(), id]);
        res.status(201).json({ id, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error." });
    }
});
app.get("/boards/:id/posts", async (req, res) => {
    const { id } = req.params;
    const { sort, amount } = req.query;
    try {
        const [boards] = await db.promise().query("SELECT * FROM boards WHERE id = ?", [id]);
        if (boards.length === 0) {
            return res.status(404).json({ error: "Board not found." });
        }
        const [rawPosts] = await db.promise().query("SELECT * FROM posts WHERE board_id = ?", [id]);
        const posts = rawPosts.map((post) => ({ id: post.id, name: post.name, user_id: post.user_id, content: post.content, time: post.time }));
        if (sort === "time") {
            posts.sort((a, b) => new Date(b.time) - new Date(a.time));
        } else if (sort === "name") {
            posts.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sort) {
            return res.status(400).json({ error: "Invalid sort method." });
        }
        if (amount) {
            if (isNaN(amount)) {
                return res.status(400).json({ error: "Invalid amount." });
            }
            if (amount < 1) {
                return res.status(400).json({ error: "Invalid amount." });
            }
            posts.splice(amount);
        }
        res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error." });
    }
});
app.get("/boards/:id/posts/:postID", async (req, res) => {
    const { id, postID } = req.params;
    try {
        const [boards] = await db.promise().query("SELECT * FROM boards WHERE id = ?", [id]);
        if (boards.length === 0) {
            return res.status(404).json({ error: "Board not found." });
        }
        const [rawPosts] = await db.promise().query("SELECT * FROM posts WHERE board_id = ?", [id]);
        const posts = rawPosts.map((post) => ({ id: post.id, name: post.name, user_id: post.user_id, content: post.content, time: post.time }));
        const post = posts.find((post) => post.id === postID);
        if (!post) {
            return res.status(404).json({ error: "Post not found." });
        }
        res.status(200).json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error." });
    }
});
app.put("/boards/:id/posts/:postID", async (req, res) => {
    const { id, postID } = req.params;
    const { name, content } = req.body;
    const token = req.headers.authorization;
    if (!name || !content) {
        return res.status(400).json({ error: "Missing required fields." });
    }
    if (!token) {
        return res.status(401).json({ error: "Unauthorized." });
    }
    if (name.length > 64) {
        return res.status(400).json({ error: "Name too long." });
    }
    if (content.length > 256) {
        return res.status(400).json({ error: "Content too long." });
    }
    try {
        const [boards] = await db.promise().query("SELECT * FROM boards WHERE id = ?", [id]);
        if (boards.length === 0) {
            return res.status(404).json({ error: "Board not found." });
        }
        const [rawPosts] = await db.promise().query("SELECT * FROM posts WHERE board_id = ?", [id]);
        const post = rawPosts.find((post) => post.id === postID);
        if (!post) {
            return res.status(404).json({ error: "Post not found." });
        }
        if (post.token !== token) {
            return res.status(401).json({ error: "Unauthorized." });
        }
        await db.promise().query("UPDATE posts SET name = ?, content = ? WHERE id = ?", [name, content, postID]);
        res.status(200).json({ id, name, content, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error." });
    }
});
app.delete("/boards/:id/posts/:postID", async (req, res) => {
    const { id, postID } = req.params;
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ error: "Unauthorized." });
    }
    try {
        const [boards] = await db.promise().query("SELECT * FROM boards WHERE id = ?", [id]);
        if (boards.length === 0) {
            return res.status(404).json({ error: "Board not found." });
        }
        const [rawPosts] = await db.promise().query("SELECT * FROM posts WHERE board_id = ?", [id]);
        const post = rawPosts.find((post) => post.id === postID);
        if (!post) {
            return res.status(404).json({ error: "Post not found." });
        }
        if (post.token !== token) {
            return res.status(401).json({ error: "Unauthorized." });
        }
        await db.promise().query("DELETE FROM posts WHERE id = ?", [postID]);
        res.status(200).json({ id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error." });
    }
});

app.get("*", (req, res) => {
    res.status(404).json({ error: "Not found." });
});

module.exports = app;