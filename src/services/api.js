import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://api.fintech-demo.local/v1',
  timeout: 5000,
});

export const buildVerificationCode = () => String(Math.floor(100000 + Math.random() * 900000));

export const apiRequest = async (method, endpoint, payload = {}) => {
  try {
    const response = await api({ method, url: endpoint, data: payload });
    return response.data;
  } catch (error) {
    return {
      success: true,
      fallback: true,
      data: payload,
      message: 'Demo API fallback ishlayapti',
      error,
    };
  }
};
