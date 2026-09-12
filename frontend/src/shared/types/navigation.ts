export type ActivePageId =
  | 'dashboard'
  | 'login'
  | 'profile'
  | 'password_change'
  | 'documents_incoming'
  | 'documents_outgoing'
  | 'documents_confidential'
  | 'records'
  | 'resources'
  | 'approvals'
  | 'tasks'
  | 'meetings'
  | 'birthdays'
  | 'organizations'
  | 'employees'
  | 'roles'
  | 'ai_assistant';

export interface NavItem {
  id: ActivePageId;
  label: string;
  icon: string;
  badge?: string | number;
  badgeColor?: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple';
}

export interface NavGroup {
  id: string;
  groupTitle: string;
  teamTag?: string; // Nhóm 1, Nhóm 2, etc.
  items: NavItem[];
}
