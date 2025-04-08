import axios, { AxiosInstance } from 'axios';

export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

const apiClient: AxiosInstance = axios.create({
  baseURL: 'http://192.168.170.24/AktTVAPI/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// 通用 GET 请求
export const get = async <T>(url: string, params = {}): Promise<ApiResponse<T>> => {
  try {
    const response = await apiClient.get<ApiResponse<T>>(url, { params });
    if(response.data.code !== 200) {
      throw new Error(`Error: ${response.data.message}`);
    }
    return response.data;
  } catch (error: any) {
    console.error('GET Request Error:', error);
    // 统一错误处理
    return {
      code: error.response?.status || 500,
      data: null as T,
      message: error.message || 'Network error'
    };
  }
};

// 通用 POST 请求
export const post = async <T>(url: string, data = {}): Promise<ApiResponse<T>> => {
  try {
    const response = await apiClient.post<ApiResponse<T>>(url, data);
    if(response.data.code !== 200) {
      throw new Error(`Error: ${response.data.message}`);
    }
    return response.data;
  } catch (error: any) {
    console.error('POST Request Error:', error);
    // 统一错误处理
    return {
      code: error.response?.status || 500,
      data: null as T,
      message: error.message || 'Network error'
    };
  }
};