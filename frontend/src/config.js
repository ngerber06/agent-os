const wsProto = window.location.protocol === "https:" ? "wss" : "ws";
export const WS_BASE = `${wsProto}://${window.location.host}`;
