export class SseClient {
  constructor(url, handlers) {
    this.url = url;
    this.handlers = handlers;
    this.source = null;
  }

  connect() {
    this.source = new EventSource(this.url);

    this.source.onopen = () => {
      if (this.handlers.onOpen) this.handlers.onOpen();
    };

    this.source.onerror = () => {
      if (this.handlers.onError) this.handlers.onError();
    };

    this.source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (this.handlers.onData) this.handlers.onData(payload);
      } catch (_) {}
    };
  }
}