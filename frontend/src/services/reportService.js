import api from "./api";

export const getSpendingReport = (params) => api.get("/reports/spending", { params });
export const getConsumptionReport = (params) => api.get("/reports/consumption", { params });
export const getCategoryReport = (params) => api.get("/reports/categories", { params });
export const getWasteReport = (params) => api.get("/reports/waste", { params });
export const getExpiryReport = (params) => api.get("/reports/expiry", { params });
