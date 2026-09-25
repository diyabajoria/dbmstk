import api from "./api";

export const getSetupStatus = () => api.get("/setup/status");
export const loadSampleData = () => api.post("/setup/sample-data");
