import api from "./api";

export const getAlerts = () => api.get("/alerts");
export const markAlertRead = (id) => api.patch(`/alerts/${id}/read`);
export const scanAlerts = () => api.post("/alerts/scan");
