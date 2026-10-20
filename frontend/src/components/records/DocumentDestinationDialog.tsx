import React from 'react';
import { Button } from '@components/common';
import { useTranslation } from '@i18n/translate';
import type { DocumentType } from '@app-types/records';
import { documentListDestination, type DocumentDirection } from '@lib/recordsDocumentNavigation';

interface Props {
  category: DocumentType;
  onClose: () => void;
  onNavigate: (destination: string) => void;
}

export default function DocumentDestinationDialog({ category, onClose, onNavigate }: Props) {
  const { t } = useTranslation();
  const [direction, setDirection] = React.useState<DocumentDirection>('DEN');
  const [restricted, setRestricted] = React.useState(false);
  const dialog = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    const previousFocus = document.activeElement;
    dialog.current?.querySelector<HTMLElement>('select')?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key === 'Tab') {
        const controls = dialog.current?.querySelectorAll<HTMLElement>('select, input, button');
        if (!controls?.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-backdrop p-4">
      <form ref={dialog} role="dialog" aria-modal="true" aria-labelledby="document-destination-title"
        className="w-full max-w-md space-y-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-lg"
        onSubmit={(event) => { event.preventDefault(); onNavigate(documentListDestination(category, direction, restricted)); }}>
        <h2 id="document-destination-title" className="m-0 text-lg font-bold text-main">{t('records.destination.title')}</h2>
        <p className="text-sm text-secondary">{t('records.documentTypes.name')}: <strong>{category.ten_loai}</strong></p>
        <label className="block space-y-2 text-sm text-main">
          <span>{t('records.destination.direction')}</span>
          <select value={direction} onChange={(event) => setDirection(event.target.value as DocumentDirection)}
            className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-main">
            <option value="DEN">{t('records.documentKinds.vanbanden')}</option>
            <option value="DI">{t('records.documentKinds.vanbandi')}</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-main">
          <input type="checkbox" checked={restricted} onChange={(event) => setRestricted(event.target.checked)} />
          {t('records.destination.restricted')}
        </label>
        <p className="text-xs text-muted">{t('records.destination.note')}</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>{t('records.actions.cancel')}</Button>
          <Button type="submit" icon="fa-arrow-right">{t('records.actions.viewDocuments')}</Button>
        </div>
      </form>
    </div>
  );
}
