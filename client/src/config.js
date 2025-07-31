export const config = {
    serverUrl: import.meta.env.VITE_SERVER_URL || 'http://localhost:8081',
    reconnectAttempts: 5,
    reconnectDelay: 1000,
};

export default config; 