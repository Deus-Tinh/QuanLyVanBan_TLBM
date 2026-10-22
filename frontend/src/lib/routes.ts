import { ActivePageId } from '@app-types/navigation';
import type { ModulePage } from '@app/moduleRoutes';

// Mỗi module khai báo trang của mình trong `paths.ts` (pages/<module>/paths.ts, modules/<module>/paths.ts).
const MODULE_PAGES: ModulePage[] = Object.values(
  import.meta.glob<ModulePage[]>(['../pages/*/paths.ts', '../modules/*/paths.ts'], { eager: true, import: 'default' })
).flat();

export const pageIdToPath = (pageId: ActivePageId): string =>
  MODULE_PAGES.find((page) => page.id === pageId)?.path ?? '/dashboard';

export const pathToPageId = (pathname: string): ActivePageId => {
  const clean = pathname.replace(/\/+$/, '') || '/';
  return MODULE_PAGES.find((page) => page.matches(clean))?.id ?? 'dashboard';
};
