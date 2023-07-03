function escapeHTML(string) {
    if (typeof string !== "string") {
        return string;
    }
    return string.replace(/[&'`"<>]/g, function (match) {
        return {
            "<": "&lt;",
            ">": "&gt;",
            "&": "&amp;",
            "\"": "&quot;",
        }[match];
    });
}