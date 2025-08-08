type EventHandler = (data?: any) => void;

const eventBus = {
  on(event: string, callback: EventHandler) {
    document.addEventListener(event, ((e: CustomEvent) =>
      callback(e.detail)) as EventListener);
  },
  dispatch(event: string, data?: any) {
    document.dispatchEvent(new CustomEvent(event, { detail: data }));
  },
  remove(event: string, callback: EventHandler) {
    document.removeEventListener(event, callback as EventListener);
  },
};

export default eventBus;
