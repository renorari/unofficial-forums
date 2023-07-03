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
                    <h3>${board.name}</h3>
                    <p>${board.description}</p>
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