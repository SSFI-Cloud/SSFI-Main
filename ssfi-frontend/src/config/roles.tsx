import { UserRole } from '@/types/dashboard';
import { Shield, MapPin, Building2, User, Trophy } from 'lucide-react';
import React from 'react';

export interface RoleConfigType {
    label: string;
    icon: React.ReactNode;
    color: string;
}

export const ROLE_CONFIG: Record<UserRole, RoleConfigType> = {
    GLOBAL_ADMIN: {
        label: 'Global Admin',
        icon: <Shield className="w-3 h-3" />,
        color: 'red',
    },
    STATE_SECRETARY: {
        label: 'State Secretary',
        icon: <MapPin className="w-3 h-3" />,
        color: 'blue',
    },
    DISTRICT_SECRETARY: {
        label: 'District Secretary',
        icon: <Building2 className="w-3 h-3" />,
        color: 'green',
    },
    CLUB_OWNER: {
        label: 'Club Owner',
        icon: <User className="w-3 h-3" />,
        color: 'purple',
    },
    STUDENT: {
        label: 'Student',
        icon: <Trophy className="w-3 h-3" />,
        color: 'amber',
    },
};
