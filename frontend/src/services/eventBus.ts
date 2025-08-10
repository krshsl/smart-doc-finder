type EventHandler = (data?: any) => void;

const listeners: { [key: string]: EventHandler[] } = {};

const eventBus = {
  on(event: string, callback: EventHandler) {
    if (!listeners[event]) {
      listeners[event] = [];
    }
    listeners[event].push(callback);
  },
  dispatch(event: string, data?: any) {
    if (listeners[event]) {
      listeners[event].forEach((callback) => callback(data));
    }
  },
  remove(event: string, callback: EventHandler) {
    if (listeners[event]) {
      listeners[event] = listeners[event].filter((cb) => cb !== callback);
    }
  }
};

export default eventBus;
