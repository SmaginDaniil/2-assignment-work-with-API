export function connect(onMessage) {
  const ws = new WebSocket("ws://localhost:4000");
  ws.onopen = () => console.log("WS connected");
  ws.onmessage = (evt) => {
    try {
      const data = JSON.parse(evt.data);
      onMessage && onMessage(data);
    } catch (e) {
      console.error("Invalid ws message", e);
    }
  };
  ws.onclose = () => console.log("WS closed");
  ws.onerror = (e) => console.error("WS error", e);
  return ws;
}
