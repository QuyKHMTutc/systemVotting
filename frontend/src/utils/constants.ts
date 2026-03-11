const isProduction = import.meta.env.PROD;
export const API_BASE_URL = isProduction ? 'https://systemvotting.onrender.com/api/v1' : 'http://localhost:8080/api/v1';

// Future implementations will go here
// This is to maintain consistent API prefixes
