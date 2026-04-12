import axios from "axios";

const API = "http://localhost:8000";

export const loginAPI = (data) => axios.post(`${API}/login`, data);
export const uploadAPI = (data) => axios.post(`${API}/upload`, data);
export const getClaimsAPI = () => axios.get(`${API}/claims`);