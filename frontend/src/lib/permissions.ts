import { useEffect, useState } from 'react';
import { apiClient } from '@lib/apiClient';

/**
 * Quyền của user đang đăng nhập (RBAC contract Issue #21), dùng để ẩn/hiện thao tác trên giao diện.
 * Đây không phải lớp bảo mật: backend vẫn kiểm quyền thật ở mọi API.
 */
export interface MyPermissions {
  is_superuser: boolean;
  permissions: string[];
}

let cached: Promise<MyPermissions> | null = null;

function loadMyPermissions(): Promise<MyPermissions> {
  if (!cached) {
    cached = apiClient<MyPermissions>('/api/auth/me/permissions/').catch((err) => {
      cached = null;
      throw err;
    });
  }
  return cached;
}

if (typeof window !== 'undefined') {
  window.addEventListener('tlbm_auth_changed', () => {
    cached = null;
  });
}

export function resetPermissionsCache(): void {
  cached = null;
}

export function hasPermission(me: MyPermissions | null, codename: string): boolean {
  return !!me && (Boolean(me.is_superuser) || (Array.isArray(me.permissions) && me.permissions.includes(codename)));
}

export function usePermissions() {
  const [me, setMe] = useState<MyPermissions | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let ignore = false;
    loadMyPermissions()
      .then((data) => {
        if (!ignore) {
          setMe(data);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!ignore) {
          setMe(null);
          setLoaded(true);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  return {
    loaded,
    isSuperuser: Boolean(me?.is_superuser),
    can: (codename: string) => hasPermission(me, codename),
  };
}
