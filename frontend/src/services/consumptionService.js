import api from "./api";

export const getConsumption = () => api.get("/consumption");
export const recordConsumption = (data) => api.post("/consumption", data);
