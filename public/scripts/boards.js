/* List boards */

var amount = 5;
function loadBoards() {
    fetch("/api/boards?sort=last_active&amount="+ amount).then(response => response.json()).then(data => {
        if (Object.prototype.hasOwnProperty.call(data, "error")) {
            return alert(data.error);
        }
        const boards = document.querySelector("#boards");
        document.querySelectorAll(".board").forEach(board => board.remove());
        for (const board of data) {
            const boardElement = document.createElement("div");
            boardElement.classList.add("board");
            boardElement.innerHTML = `
                <a href="/boards/${board.id}">
                    <h3>${escapeHTML(board.name)}</h3>
                    <p>${escapeHTML(board.description)}</p>
                </a>
            `;
            boards.insertBefore(boardElement, document.querySelector("#load_more"));
        }
    }).catch(error => {
        console.error(error);
        alert("Internal server error.");
    });
}

document.addEventListener("DOMContentLoaded", loadBoards);

// eslint-disable-next-line no-unused-vars
async function createBoard() {
    const name = document.querySelector("form#board_create #board_name").value;
    const description = document.querySelector("form#board_create #board_description").value;
    const hidden = document.querySelector("form#board_create #board_hidden").checked;
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
        if (!localStorage.getItem("deviceId")) {
            const deviceId = generateUUID();
            localStorage.setItem("deviceId", deviceId);
        }
        const response = await fetch("/api/boards", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                description: description,
                visibility: !hidden,
                deviceId: localStorage.getItem("deviceId")
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
