// gymos-app/src/hooks/useStaffRole.ts
import { useEffect, useState } from 'react';
import { useAuthContext } from '@/store/AuthContext';
import { useAppContext } from '@/store/AppContext';
import { getPermissions, getRoleLabel, RolePermissions } from '@/utils/permissions';
import api from '@/services/api';

interface StaffRoleState {
    role: string;
    roleLabel: string;
    permissions: RolePermissions;
    isOwner: boolean;
    isLoading: boolean;
}

export const useStaffRole = (): StaffRoleState => {
    const { user } = useAuthContext();
    const { gymId } = useAppContext();
    const [role, setRole] = useState<string>('trainer');
    const [isLoading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRole = async () => {
            // Gym owner — full access
            if (user?.role === 'gym_owner') {
                setRole('gym_owner');
                setLoading(false);
                return;
            }
            // Staff — get their specific role from staff profile
            try {
                const { data } = await api.get('/me/staff-profile');
                if (data.data?.role) {
                    setRole(data.data.role);
                }
            } catch { }
            setLoading(false);
        };
        fetchRole();
    }, [user, gymId]);

    return {
        role,
        roleLabel: getRoleLabel(role),
        permissions: getPermissions(role),
        isOwner: role === 'gym_owner',
        isLoading,
    };
};