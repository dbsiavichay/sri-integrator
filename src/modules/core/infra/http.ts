import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

interface HttpClientConfig {
  baseURL: string;
  defaultHeaders?: Record<string, string>;
}

export class BaseHttpClient {
  protected axiosInstance: AxiosInstance;

  constructor({ baseURL, defaultHeaders = {} }: HttpClientConfig) {
    this.axiosInstance = axios.create({
      baseURL,
      headers: defaultHeaders,
    });
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get(url, config);
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post(url, data, config);
  }
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put(url, data, config);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete(url, config);
  }
}
