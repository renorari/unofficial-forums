/* eslint-disable no-unused-vars */
/* Create board, post */

async function createBoard() {
    const name = document.querySelector("form#board_create input#board_name").value;
    const description = document.querySelector("form#board_create input#board_description").value;
    const hidden = document.querySelector("form#board_create input#board_hidden").checked;
    if (!name || !description) {
        return alert("Missing required fields.");
    }
    if (name.length > 64) {
        return alert("Board name must be less than 64 characters.");
    }
    if (description.length > 256) {
        return alert("Board description must be less than 256 characters.");
    }
    try {
        const response = await fetch("/api/boards", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                description: description,
                visibility: !hidden
            }),
        });
        const data = await response.json();
        if (Object.prototype.hasOwnProperty.call(data, "error")) {
            return alert(data.error);
        }
        localStorage.setItem(data.id, data.token);
        window.location.href = `/boards/${data.id}`;
    } catch (error) {
        console.error(error);
        alert("Internal server error.");
    }
}

async function createPost() {
    const name = document.querySelector("form#post_send input#post_name").value;
    const content = document.querySelector("form#post_send textarea#post_content").value;
    if (!name || !content) {
        return alert("Missing required fields.");
    }
    if (name.length > 64) {
        return alert("Post name must be less than 64 characters.");
    }
    if (content.length > 256) {
        return alert("Post content must be less than 256 characters.");
    }
    try {
        const response = await fetch("/api/posts", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                content: content
            }),
        });
        const data = await response.json();
        if (Object.prototype.hasOwnProperty.call(data, "error")) {
            return alert(data.error);
        }
        localStorage.setItem(data.id, data.token);
        window.location.reload();
    } catch (error) {
        console.error(error);
        alert("Internal server error.");
    }
}