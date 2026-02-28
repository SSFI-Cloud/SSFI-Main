import { Request } from 'express';

/**
 * Extended Request interface with user authentication data
 */
export interface AuthRequest extends Request {
    user?: {
        id: number;
        uid: string;
        role: 'GLOBAL_ADMIN' | 'STATE_SECRETARY' | 'DISTRICT_SECRETARY' | 'CLUB_OWNER' | 'STUDENT';
        email?: string;
        phone?: string;
        stateId?: number;
        districtId?: number;
        clubId?: number;
        studentId?: number;
    };
}

/**
 * Pagination options
 */
export interface PaginationOptions {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
