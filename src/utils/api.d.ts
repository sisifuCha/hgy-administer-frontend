import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// 定义API响应的基本结构
export interface ApiResponse<T = any> {
    code: number;
    msg: string;
    data: T;
}

// 定义API对象的类型
export interface Api {
    // GET请求
    get<T = any>(url: string, params?: Record<string, any>, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;

    // POST请求
    post<T = any>(url: string, data?: Record<string, any>, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;

    // PUT请求
    put<T = any>(url: string, data?: Record<string, any>, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;

    // DELETE请求
    delete<T = any>(url: string, params?: Record<string, any>, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;

    // PATCH请求
    patch<T = any>(url: string, data?: Record<string, any>, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;

    // 文件上传
    upload<T = any>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;

    // 文件下载
    download<T = any>(url: string, params?: Record<string, any>, config?: AxiosRequestConfig): Promise<Blob>;

    // 原始axios实例
    instance: AxiosInstance;
}

// 导出默认的api对象
declare const api: Api;
export default api;

// 导出service实例
export declare const service: AxiosInstance;