function getIP(request) {
    return request.headers["cf-connecting-ip"]
        ? request.headers["cf-connecting-ip"]
        : request.headers["x-forwarded-for"]
            ? request.headers["x-forwarded-for"]
            : (request.connection && request.connection.remoteAddress)
                ? request.connection.remoteAddress
                : (request.connection.socket && request.connection.socket.remoteAddress)
                    ? request.connection.socket.remoteAddress
                    : (request.socket && request.socket.remoteAddress)
                        ? request.socket.remoteAddress
                        : "0.0.0.0";
}

module.exports = getIP;