import api from "./api";

export const getPurchases = () => api.get("/purchases");
export const addPurchase = (data) => api.post("/purchases", data);
