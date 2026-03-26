// gymos-app/src/utils/permissions.ts

export type StaffRole = 'gym_owner' | 'manager' | 'trainer' | 'front_desk' | 'accounts';

export interface RolePermissions {
  canViewMembers:    boolean;
  canAddMembers:     boolean;
  canEditMembers:    boolean;
  canCheckIn:        boolean;
  canViewBilling:    boolean;
  canCreateInvoice:  boolean;
  canRecordPayment:  boolean;
  canViewReports:    boolean;
  canViewPlans:      boolean;
  canEditPlans:      boolean;
  canViewStaff:      boolean;
  canManageStaff:    boolean;
  canBroadcast:      boolean;
  canViewSettings:   boolean;
  canEditGym:        boolean;
  canAccessKiosk:    boolean;
  canCreateClass:    boolean;
  canCancelClass:    boolean;
}

const PERMISSIONS: Record<StaffRole, RolePermissions> = {
  gym_owner: {
    canViewMembers:   true,  canAddMembers:    true,  canEditMembers:   true,
    canCheckIn:       true,  canViewBilling:   true,  canCreateInvoice: true,
    canRecordPayment: true,  canViewReports:   true,  canViewPlans:     true,
    canEditPlans:     true,  canViewStaff:     true,  canManageStaff:   true,
    canBroadcast:     true,  canViewSettings:  true,  canEditGym:       true,
    canAccessKiosk:   true,  canCreateClass:   true,  canCancelClass:   true,
  },
  manager: {
    canViewMembers:   true,  canAddMembers:    true,  canEditMembers:   true,
    canCheckIn:       true,  canViewBilling:   true,  canCreateInvoice: true,
    canRecordPayment: true,  canViewReports:   true,  canViewPlans:     true,
    canEditPlans:     false, canViewStaff:     true,  canManageStaff:   false,
    canBroadcast:     true,  canViewSettings:  true,  canEditGym:       false,
    canAccessKiosk:   true,  canCreateClass:   true,  canCancelClass:   true,
  },
  trainer: {
    canViewMembers:   true,  canAddMembers:    false, canEditMembers:   false,
    canCheckIn:       true,  canViewBilling:   false, canCreateInvoice: false,
    canRecordPayment: false, canViewReports:   false, canViewPlans:     true,
    canEditPlans:     false, canViewStaff:     false, canManageStaff:   false,
    canBroadcast:     false, canViewSettings:  true,  canEditGym:       false,
    canAccessKiosk:   true,  canCreateClass:   true,  canCancelClass:   true,
  },
  front_desk: {
    canViewMembers:   true,  canAddMembers:    true,  canEditMembers:   false,
    canCheckIn:       true,  canViewBilling:   true,  canCreateInvoice: true,
    canRecordPayment: true,  canViewReports:   false, canViewPlans:     true,
    canEditPlans:     false, canViewStaff:     false, canManageStaff:   false,
    canBroadcast:     false, canViewSettings:  true,  canEditGym:       false,
    canAccessKiosk:   true,  canCreateClass:   false, canCancelClass:   false,
  },
  accounts: {
    canViewMembers:   false, canAddMembers:    false, canEditMembers:   false,
    canCheckIn:       false, canViewBilling:   true,  canCreateInvoice: true,
    canRecordPayment: true,  canViewReports:   true,  canViewPlans:     true,
    canEditPlans:     false, canViewStaff:     false, canManageStaff:   false,
    canBroadcast:     false, canViewSettings:  true,  canEditGym:       false,
    canAccessKiosk:   false, canCreateClass:   false, canCancelClass:   false,
  },
};

export const getPermissions = (role?: string): RolePermissions => {
  return PERMISSIONS[role as StaffRole] || PERMISSIONS.trainer;
};

export const getRoleLabel = (role?: string): string => {
  const labels: Record<string, string> = {
    gym_owner:  'Gym Owner',
    manager:    'Manager',
    trainer:    'Trainer',
    front_desk: 'Front Desk',
    accounts:   'Accounts',
  };
  return labels[role || ''] || 'Staff';
};