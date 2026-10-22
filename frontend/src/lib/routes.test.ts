import { describe, it, expect } from 'vitest';
import { pathToPageId, pageIdToPath, resolveDocumentDetailUrl, resolveDocumentApiUrl } from './routes';

describe('Route Utility Helpers', () => {
  it('converts paths to active page IDs correctly', () => {
    expect(pathToPageId('/dashboard')).toBe('dashboard');
    expect(pathToPageId('/profile')).toBe('profile');
    expect(pathToPageId('/settings')).toBe('settings');
    expect(pathToPageId('/documents/incoming')).toBe('documents_incoming');
    expect(pathToPageId('/documents/outgoing')).toBe('documents_outgoing');
    expect(pathToPageId('/non-existent')).toBe('dashboard');
  });

  it('converts page IDs to paths correctly', () => {
    expect(pageIdToPath('dashboard')).toBe('/dashboard');
    expect(pageIdToPath('profile')).toBe('/profile');
    expect(pageIdToPath('documents_incoming')).toBe('/documents/incoming');
    expect(pageIdToPath('documents_outgoing')).toBe('/documents/outgoing');
    expect(pageIdToPath('password_change')).toBe('/password-change');
  });

  describe('resolveDocumentDetailUrl - Phân nhánh URL theo cấu trúc Đến / Đi', () => {
    it('điều hướng đúng URL Văn bản Đi khi truyền đối tượng có loai = DI', () => {
      expect(resolveDocumentDetailUrl({ id: 205, loai: 'DI' })).toBe('/documents/outgoing?detail=205');
      expect(resolveDocumentDetailUrl({ id: 206, document_kind: 'vanbandi' })).toBe('/documents/outgoing?detail=206');
    });

    it('điều hướng đúng URL Văn bản Đến khi truyền đối tượng có loai = DEN hoặc Hạn chế Đến', () => {
      expect(resolveDocumentDetailUrl({ id: 105, loai: 'DEN' })).toBe('/documents/incoming?detail=105');
      expect(resolveDocumentDetailUrl({ id: 106, pham_vi: 'HAN_CHE' })).toBe('/documents/incoming?detail=106');
    });

    it('xử lý văn bản cũ khi chỉ truyền ID (fallback)', () => {
      // Mặc định văn bản cũ giai đoạn 1 thuộc hệ Đến
      expect(resolveDocumentDetailUrl(99)).toBe('/documents/incoming?detail=99');
      // Nếu có fallbackType là DI
      expect(resolveDocumentDetailUrl(88, 'DI')).toBe('/documents/outgoing?detail=88');
    });
  });

  describe('resolveDocumentApiUrl - Phân nhánh URL API Backend', () => {
    it('gọi đúng query param khi có loai', () => {
      expect(resolveDocumentApiUrl(101, 'DEN')).toBe('/api/documents/101/?loai=DEN');
      expect(resolveDocumentApiUrl(201, 'DI')).toBe('/api/documents/201/?loai=DI');
    });

    it('gọi API Facade tổng hợp (/api/documents/{id}/) khi không có loai để Backend tự fallback', () => {
      expect(resolveDocumentApiUrl(301, null)).toBe('/api/documents/301/');
      expect(resolveDocumentApiUrl(302)).toBe('/api/documents/302/');
    });
  });
});


