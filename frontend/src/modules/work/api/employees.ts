import { CurrentUser, Employee } from '../types/employee';
import { request } from './client';

/** Danh sách cán bộ cho các ô chọn người. Truyền search để lọc theo tên hoặc tên đăng nhập. */
export function listEmployees(search = '', signal?: AbortSignal): Promise<Employee[]> {
  return request<Employee[]>('work/employees/', { params: { search }, signal });
}

/** Người dùng đang đăng nhập (hiện đang giả lập bằng header X-Mock-User-Id). */
export function getMe(signal?: AbortSignal): Promise<CurrentUser> {
  return request<CurrentUser>('work/me/', { signal });
}
