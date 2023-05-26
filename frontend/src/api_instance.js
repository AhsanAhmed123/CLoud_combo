import axios from 'axios';
import { Capacitor } from "@capacitor/core";

const api = axios.create({
    baseURL: 'http://localhost:3000/api/v1/',
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    }
});

// Add an interceptor to add the isWeb parameter to requests
api.interceptors.request.use((config) => {
    config.params = config.params || {};
    config.params.isWeb = Capacitor.getPlatform() !== 'ios';
    return config;
});

export default api;
