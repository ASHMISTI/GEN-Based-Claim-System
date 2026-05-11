import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const loginAPI    = (data)     => axios.post(`${API}/login`, data);
export const uploadAPI   = (data)     => axios.post(`${API}/upload`, data);
export const getClaimsAPI = ()        => axios.get(`${API}/claims`);
export const updateStatusAPI = (id, status) =>
  axios.patch(`${API}/claims/${id}/status`, { status });