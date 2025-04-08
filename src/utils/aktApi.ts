import axios, { 
    AxiosInstance, 
    InternalAxiosRequestConfig, 
    AxiosResponse, 
    AxiosError 
  } from 'axios';
  import axiosRetry from 'axios-retry';
  //import config from '../config/config.json';
  import QuickLRU from 'quick-lru';
  import { configService } from './configService';
  import type {Config} from '@/types/config';

  
  // Type definitions
  export interface CustomInternalAxiosRequestConfig extends InternalAxiosRequestConfig {
    _cacheKey?: string;
    forceRefresh?: boolean;
  }
  
  export interface ApiResponse<T = any> {
    code: number;
    data: T;
    message: string;
  }

  class ApiService{
    private static instance:ApiService|null = null;
    private apiclient:AxiosInstance|null = null;
    private cache:QuickLRU<string, any>;
    private initialized:boolean = false;

    private constructor(){
      this.cache = new QuickLRU({
        maxSize: 100,
        maxAge: 60000 // 降低缓存时间为1分钟//900000 // 15 minutes default
      });
    }

    static getInstance():ApiService{
      if(!ApiService.instance){
        ApiService.instance = new ApiService();
      }
      return ApiService.instance;
    }

    async init():Promise<AxiosInstance>{
      if(this.initialized&&this.apiclient)
      {
        return this.apiclient;
      }
      try{
        const config = await configService.loadConfig();

        this.cache=new QuickLRU({
          maxSize: 100,
          maxAge: config.cacheMaxAge || 60000 
        });

        this.apiclient=axios.create({
          baseURL: config.apiBaseUrl,
          timeout: config.timeout || 10000,
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          withCredentials: true,
        })
        this.setupRetry(config);
        this.setupInterceptors();

        this.initialized = true;
        return this.apiclient;
        
      }catch(e){
        console.error('Error initializing API service:', e);
        throw new Error('Failed to initialize API service');
      }
    
     
    }

    private handleRequestError(error: any, method: string, url: string): void {
      console.error(`${method} ${url} failed:`, {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
      });
    }

    private setupRetry(config: Config): void {
      if (!this.apiclient) {
          throw new Error('API client must be initialized before setting up retry');
      }

      axiosRetry(this.apiclient, {
          retries: config.retryCount || 3,
          retryDelay: (retryCount) => retryCount * 1000,
          retryCondition: (error: AxiosError) => {
              return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
                     error.response?.status === 500;
          },
          onRetry: (retryCount, error, requestConfig) => {
              console.log(`Retry attempt ${retryCount} for:`, {
                  url: requestConfig.url,
                  method: requestConfig.method,
                  error: error.message
              });
          }
      });
    }
    private setupInterceptors(): void {
      if(!this.apiclient){
        return;
      }
      // Request interceptor
      this.apiclient.interceptors.request.use(
        (config: CustomInternalAxiosRequestConfig) => {
          
          const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`;
          
          if (config.method?.toLowerCase() === 'get'&& !config.forceRefresh) {
            // Check if the response is cached
            const cachedResponse = this.cache.get(cacheKey);
            if (cachedResponse) {
              return Promise.resolve(cachedResponse as InternalAxiosRequestConfig);
            }
          }
          
          config._cacheKey = cacheKey;
          
          const token = localStorage.getItem('token');
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          
          return config;
        },
        (error) => Promise.reject(error)
      );

      this.apiclient.interceptors.response.use(
        (response: AxiosResponse) => {
          const config = response.config as CustomInternalAxiosRequestConfig;
          
          if (config.method?.toLowerCase() === 'get' && config._cacheKey) {
            this.cache.set(config._cacheKey, response);
          }
    
          // Handle API response structure
          const apiResponse = response.data as ApiResponse;
          if (apiResponse.code !== 200) {
            return Promise.reject(new Error(apiResponse.message || 'API Error'));
          }
    
          return apiResponse.data;
        }
        ,(error: AxiosError) => {
          // Handle error responses
          this.handleRequestError(error, error.config?.method||"UNKNOWN", error.config?.url||"UNKNOWN");
          return Promise.reject(error);
        }
      );
    }

    async get<T>(url: string, params = {}, config = {}): Promise<T> {
      if(!this.initialized){
        await this.init();
      }
      if(!this.apiclient){
        throw new Error('API client not initialized');
      }

      try {
        const response = await this.apiclient.get<any, T>(url, { 
          ...config, 
          params 
        });
        return response;
      } catch (error) {
        this.handleRequestError(error, 'GET', url);
      
        throw error;
      }
    }

    async post<T>(url: string, data = {}, config = {}): Promise<T> {
      if(!this.initialized){
        await this.init();
      }
      if(!this.apiclient){
        throw new Error('API client not initialized');
      }
      try {
        
        const response = await this.apiclient.post<any, T>(url, data, config);
        return response;
      } catch (error) {
        this.handleRequestError(error, 'POST', url);
        throw error;
      }
    }
  }

  //Create and export singleton instance
  const createApiService = () => {
    const apiService = ApiService.getInstance();
    return {
        get: async <T>(url: string, params = {}, config = {}): Promise<T> => {
            await apiService.init();
            return apiService.get<T>(url, params, config);
        },
        post: async <T>(url: string, data = {}, config = {}): Promise<T> => {
            await apiService.init();
            return apiService.post<T>(url, data, config);
        }
    };
  };

 export const request = createApiService();
 export default request;
  // // Cache configuration
  // const cache = new QuickLRU({
  //   maxSize: 100,
  //   maxAge: config.cacheMaxAge || 60000 // 降低缓存时间为1分钟//900000 // 15 minutes default
  // });


  
  // // Create axios instance
  // // const apiClient: AxiosInstance = axios.create({
  // //   baseURL: config.apiBaseUrl,
  // //   timeout: config.timeout || 10000,
  // //   headers: {
  // //     'Content-Type': 'application/json',
  // //     'X-Requested-With': 'XMLHttpRequest',
  // //   },
  // //   withCredentials: true,
  // // });
  
  // // // Configure retry logic
  // // axiosRetry(apiClient, {
  // //   retries: config.retryCount || 3,
  // //   retryDelay: (retryCount) => retryCount * 1000,
  // //   retryCondition: (error: AxiosError) => {
  // //     return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
  // //            error.response?.status === 500;
  // //   },
  // // });
  
  // // Request interceptor
  // apiClient.interceptors.request.use(
  //   (config: CustomInternalAxiosRequestConfig) => {
  //     const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`;
      
  //     if (config.method?.toLowerCase() === 'get'&& !config.forceRefresh) {
  //       // Check if the response is cached
  //       const cachedResponse = cache.get(cacheKey);
  //       if (cachedResponse) {
  //         return Promise.resolve(cachedResponse as InternalAxiosRequestConfig);
  //       }
  //     }
      
  //     config._cacheKey = cacheKey;
      
  //     const token = localStorage.getItem('token');
  //     if (token && config.headers) {
  //       config.headers.Authorization = `Bearer ${token}`;
  //     }
      
  //     return config;
  //   },
  //   (error) => Promise.reject(error)
  // );
  
  // // Response interceptor
  // apiClient.interceptors.response.use(
  //   (response: AxiosResponse) => {
  //     const config = response.config as CustomInternalAxiosRequestConfig;
      
  //     if (config.method?.toLowerCase() === 'get' && config._cacheKey) {
  //       cache.set(config._cacheKey, response);
  //     }
  
  //     // Handle API response structure
  //     const apiResponse = response.data as ApiResponse;
  //     if (apiResponse.code !== 200) {
  //       return Promise.reject(new Error(apiResponse.message || 'API Error'));
  //     }
  
  //     return apiResponse.data;
  //   },
  //   (error: AxiosError) => {
  //     console.error('API Error:', {
  //       url: error.config?.url,
  //       method: error.config?.method,
  //       status: error.response?.status,
  //       message: error.message
  //     });
  //     return Promise.reject(error);
  //   }
  // );
  
  // // Type-safe request methods
  // export const request = {
  //   get: async <T>(url: string, params = {}, config = {}): Promise<T> => {
  //     try {
  //       return await apiClient.get<any, T>(url, { 
  //         ...config, 
  //         params 
  //       });
  //     } catch (error) {
  //       console.error(`GET ${url} failed:`, error);
  //       throw error;
  //     }
  //   },
  
  //   post: async <T>(url: string, data = {}, config = {}): Promise<T> => {
  //     try {
  //       return await apiClient.post<any, T>(url, data, config);
  //     } catch (error) {
  //       console.error(`POST ${url} failed:`, error);
  //       throw error;
  //     }
  //   }
  // };
  
  // export default request;