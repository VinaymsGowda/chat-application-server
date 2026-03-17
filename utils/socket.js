/**
 * Shared Socket.io singleton.
 * `index.js` initialises it via `init(server)`.
 * Any module (e.g. controllers) can import `getIo()` to emit events
 * without creating a circular dependency with `index.js`.
 */

let _io = null;

const init = (server, options = {}) => {
  const { Server } = require("socket.io");
  _io = new Server(server, options);
  return _io;
};

const getIo = () => {
  if (!_io) {
    throw new Error("Socket.io has not been initialised. Call init() first.");
  }
  return _io;
};

module.exports = { init, getIo };
