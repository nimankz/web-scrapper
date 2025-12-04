import axios from 'axios'
const API_URL = "http://localhost:8000/api";
const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    }
});
export const fetchInfo= async (playload = {}) => {
    const res = await api.post(`/${playload["type"]}/${playload["link"]}`,playload);
    return res.data;
}