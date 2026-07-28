import io from "socket.io-client";

const readAccessToken = () => {
  try {
    const stored = localStorage.getItem("token");
    return stored ? JSON.parse(stored) : "";
  } catch (_) {
    return "";
  }
};

class SocketWorker {
  static instance = null;

  constructor(companyId, userId) {
    const identity = `${companyId}:${userId}`;

    if (SocketWorker.instance) {
      if (SocketWorker.instance.identity === identity) {
        return SocketWorker.instance;
      }
      SocketWorker.instance.destroy();
    }

    this.companyId = Number(companyId);
    this.userId = Number(userId);
    this.identity = identity;
    this.socket = null;
    this.eventListeners = {};
    this.configureSocket();
    SocketWorker.instance = this;
  }

  configureSocket() {
    if (!Number.isInteger(this.companyId) || this.companyId <= 0) return;

    this.socket = io(
      `${process.env.REACT_APP_BACKEND_URL}/workspace-${this.companyId}`,
      {
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 15000,
        randomizationFactor: 0.5,
        reconnectionAttempts: Infinity,
        auth: callback => callback({ token: readAccessToken() })
      }
    );

    this.socket.on("connect_error", error => {
      const code = error?.data?.code || "SOCKET_CONNECTION_FAILED";
      // No token, URL or personal data is included in this diagnostic.
      console.warn("Socket connection unavailable", { code });
    });
  }

  on(event, callback) {
    if (typeof callback !== "function") return;
    this.connect();
    this.socket.on(event, callback);
    if (!this.eventListeners[event]) this.eventListeners[event] = [];
    if (!this.eventListeners[event].includes(callback)) {
      this.eventListeners[event].push(callback);
    }
  }

  emit(event, payload, ack) {
    this.connect();
    if (!this.socket) return;
    if (typeof ack === "function") {
      this.socket.emit(event, payload, ack);
    } else if (arguments.length >= 2) {
      this.socket.emit(event, payload);
    } else {
      this.socket.emit(event);
    }
  }

  off(event, callback) {
    if (!this.socket) return;
    if (callback) {
      this.socket.off(event, callback);
      if (this.eventListeners[event]) {
        this.eventListeners[event] = this.eventListeners[event].filter(
          listener => listener !== callback
        );
      }
      return;
    }

    (this.eventListeners[event] || []).forEach(listener =>
      this.socket.off(event, listener)
    );
    delete this.eventListeners[event];
  }

  connect() {
    if (!this.socket) this.configureSocket();
    if (this.socket && !this.socket.connected && !this.socket.active) {
      this.socket.connect();
    }
  }

  refreshAuth() {
    if (!this.socket) return;
    this.socket.auth = callback => callback({ token: readAccessToken() });
    if (!this.socket.connected) this.socket.connect();
  }

  destroy() {
    if (this.socket) {
      Object.entries(this.eventListeners).forEach(([event, listeners]) => {
        listeners.forEach(listener => this.socket.off(event, listener));
      });
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }
    this.eventListeners = {};
    this.socket = null;
    if (SocketWorker.instance === this) SocketWorker.instance = null;
  }

  disconnect() {
    this.destroy();
  }
}

const instance = (companyId, userId) => new SocketWorker(companyId, userId);

export default instance;
