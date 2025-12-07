import axios from 'axios';

const API_URL = "http://localhost:8000/api";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

export const fetchInfo = async ({ type, link }) => {
    if (!link) {
        throw new Error('لینک نباید خالی باشد');
    }

    if (type === 'post') {
        const res = await api.post('/post-comments', { postUrl: link });
        return { kind: 'post', data: res.data };
    }

    if (type === 'profile') {
        const res = await api.post('/profile-connections', { profileUrl: link });
        return { kind: 'profile', data: res.data };
    }

    throw new Error('نوع درخواست نامعتبر است');
};
