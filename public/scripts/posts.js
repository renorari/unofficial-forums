/* Posts */

function loadPosts() {
    const boardID = window.location.pathname.split("/")[2];
    fetch(`/api/boards/${boardID}/posts?sort=time`)
        .then(response => response.json())
        .then(data => {
            if (Object.prototype.hasOwnProperty.call(data, "error")) {
                return alert(data.error);
            }
            const posts = document.querySelector("#posts");
            document.querySelectorAll(".post").forEach(post => post.remove());
            for (const post of data) {
                const postElement = document.createElement("div");
                postElement.classList.add("post");
                postElement.innerHTML = `
                    <!--<a href="/posts/${post.id}">-->
                        <h3 class="tooltip">
                            <span class="tooltip-text">${post.user_id}</span>
                            ${escapeHTML(post.name)}
                        </h3>
                        <p>${escapeHTML(post.content).replace(/((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gi, '<a href="$1">$1</a>').replace(/\n/g, "<br>")}</p>
                    <!--</a>-->
                `;
                posts.insertBefore(postElement, document.querySelector("#load_more"));
            }
        });
}

document.addEventListener("DOMContentLoaded", async () => {
    if (localStorage.getItem("user_name")) {
        document.querySelector("form#post_create #user_name").value = localStorage.getItem("user_name");
    }
    loadPosts();
    setInterval(loadPosts, 5000);
});

// eslint-disable-next-line no-unused-vars
async function createPost() {
    const boardID = window.location.pathname.split("/")[2];
    const name = document.querySelector("form#post_create #user_name").value;
    const content = document.querySelector("form#post_create #post_content").value;
    if (!name || !content) {
        return alert("Missing required fields.");
    }
    if (name.length > 64) {
        return alert("Post name must be less than 64 characters.");
    }
    if (content.length > 256) {
        return alert("Post content must be less than 256 characters.");
    }
    if (!localStorage.getItem("deviceId")) {
        const deviceId = generateUUID();
        localStorage.setItem("deviceId", deviceId);
    }
    try {
        const response = await fetch(`/api/boards/${boardID}/posts`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                content: content,
                deviceId: localStorage.getItem("deviceId")
            }),
        });
        const data = await response.json();
        if (Object.prototype.hasOwnProperty.call(data, "error")) {
            return alert(data.error);
        }
        document.querySelector("form#post_create #user_name").value = name;
        document.querySelector("form#post_create #post_content").value = "";
        localStorage.setItem(data.id, data.token);
        localStorage.setItem("user_name", name);
        loadPosts();
    } catch (error) {
        console.error(error);
        alert("Internal server error.");
    }
}