import { describe, expect, it } from 'vitest';
import { documentListDestination } from './recordsDocumentNavigation';
import { pathToPageId } from './routes';

const category = { id: 23, ho_so: 9, ten_loai: 'Category' };
describe('category handoff to shared document lists', () => {
  it('passes the category primary key rather than the parent dossier', () => {
    expect(documentListDestination(category, 'DEN')).toBe('/documents/incoming?loai_van_ban=23');
    expect(documentListDestination(category, 'DI')).toBe('/documents/outgoing?loai_van_ban=23');
  });
  it('represents confidential scope within both surviving document kinds', () => {
    expect(documentListDestination(category, 'DEN', true)).toBe('/documents/incoming?loai_van_ban=23&pham_vi=HAN_CHE');
    expect(documentListDestination(category, 'DI', true)).toBe('/documents/outgoing?loai_van_ban=23&pham_vi=HAN_CHE');
  });
  it('rejects a category without a valid primary key', () => {
    expect(() => documentListDestination({ ...category, id: '23&other=1' }, 'DEN')).toThrow();
  });
  it('selects the category navigation tab on global and dossier-scoped pages', () => {
    expect(pathToPageId('/records/document-types')).toBe('record_types');
    expect(pathToPageId('/records/9/document-types')).toBe('record_types');
    expect(pathToPageId('/records')).toBe('records');
  });
});
