import type { DocumentType } from '@app-types/records';

export type DocumentDirection = 'DEN' | 'DI';

// Shared Group 2 contract: LoaiVanBan PK, NOT its label or the dossier PK.
export function documentListDestination(
  category: DocumentType,
  direction: DocumentDirection,
  restricted = false,
): string {
  const id = String(category.id);
  if (!/^[1-9]\d*$/.test(id)) throw new Error('Invalid document category ID');
  if (direction !== 'DEN' && direction !== 'DI') throw new Error('Invalid document direction');
  const query = new URLSearchParams({ loai_van_ban: id });
  if (restricted) query.set('pham_vi', 'HAN_CHE');
  return `/documents/${direction === 'DEN' ? 'incoming' : 'outgoing'}?${query}`;
}
