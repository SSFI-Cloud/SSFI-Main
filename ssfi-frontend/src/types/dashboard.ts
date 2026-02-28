export type UserRole =
    | 'GLOBAL_ADMIN'
    | 'STATE_SECRETARY'
    | 'DISTRICT_SECRETARY'
    | 'CLUB_OWNER'
    | 'STUDENT';

export interface DashboardOverview {
    totalStates?: number;
    totalDistricts?: number;
    totalClubs?: number;
    totalStudents?: number;
    totalEvents?: number;
    activeStudents?: number;
    expiredMemberships?: number;
    approvedStudents?: number;
    pendingStudents?: number;
}

export interface PendingApprovals {
    stateSecretaries?: number;
    districtSecretaries?: number;
    clubs?: number;
    students?: number;
    total: number;
}

export interface RecentActivityItem {
    id: string;
    type: 'STUDENT' | 'CLUB' | 'EVENT';
    name: string;
    status: string;
    date: string;
    details?: string;
}

export interface DashboardStatistics {
    studentsByStatus?: Record<string, number>;
    studentsByGender?: Record<string, number>;
    eventsByStatus?: { status: string; count: number }[];
    registrationsByMonth?: { month: string; count: number }[];
    studentsByAgeCategory?: Record<string, number>;
    totalEventRegistrations?: number;
}

export interface DashboardData {
    role: UserRole;
    overview: DashboardOverview;
    pendingApprovals?: PendingApprovals;
    recentActivity?: {
        students?: RecentActivityItem[];
        clubs?: RecentActivityItem[];
        events?: RecentActivityItem[];
    };
    statistics?: DashboardStatistics;
}

export interface AdminDashboardData extends DashboardData {
    role: 'GLOBAL_ADMIN';
}

export interface StateDashboardData extends DashboardData {
    role: 'STATE_SECRETARY';
    stateName: string;
}

export interface DistrictDashboardData extends DashboardData {
    role: 'DISTRICT_SECRETARY';
    districtName: string;
    stateName: string;
}

export interface ClubDashboardData extends DashboardData {
    role: 'CLUB_OWNER';
    club: {
        name: string;
        code: string;
        state: string;
        district: string;
        status: string;
        phone?: string;
    };
    upcomingEvents?: any[];
}

export interface StudentDashboardData {
    role: 'STUDENT';
    profile: {
        id: string;
        uid: string;
        firstName: string;
        lastName: string;
        profilePhoto?: string;
        ageCategory: string;
        district: string;
        state: string;
        club: {
            name: string;
            phone?: string;
        };
        gender: string;
        status: string;
        phone?: string;
        email?: string;
    };
    membership: {
        status: string;
        isActive: boolean;
        expiryDate: string;
        daysUntilExpiry: number;
        needsRenewal: boolean;
    };
    eventRegistrations: any[];
    upcomingEvents: any[];
    stats: {
        totalEventsRegistered: number;
        upcomingEventsCount: number;
        completedEventsCount: number;
    };
}
