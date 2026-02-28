import { useState, useCallback } from 'react';
import apiClient from '../api/client';
import type {
  Event,
  EventListResponse,
  EventRegistration,
  RegistrationListResponse,
  EventStats,
  EventQueryParams,
  RegistrationQueryParams,
  EventRegistrationFormData,
} from '@/types/event';

const EVENTS_API = '/events';

// ============================================
// EVENT HOOKS
// ============================================

/**
 * Hook for fetching events list
 */
export const useEvents = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EventListResponse | null>(null);

  const fetchEvents = useCallback(async (params?: EventQueryParams) => {
    setIsLoading(true);
    setError(null);

    try {
      // Map frontend param names to backend API param names
      const apiParams: any = { ...params };
      if (apiParams.sortBy) {
        apiParams.sortField = apiParams.sortBy;
        delete apiParams.sortBy;
      }

      const response = await apiClient.get<{ data: EventListResponse }>(EVENTS_API, {
        params: apiParams,
      });
      setData(response.data.data);
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch events';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchEvents, data, isLoading, error };
};

/**
 * Hook for fetching upcoming events
 */
export const useUpcomingEvents = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EventListResponse | null>(null);

  const fetchUpcomingEvents = useCallback(async (limit: number = 6) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ data: EventListResponse }>(
        `${EVENTS_API}/upcoming`,
        { params: { limit } }
      );
      setData(response.data.data);
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch upcoming events';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchUpcomingEvents, data, isLoading, error };
};

/**
 * Hook for fetching a single event
 */
export const useEvent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Event | null>(null);

  const fetchEvent = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ data: Event }>(`${EVENTS_API}/${id}`);
      setData(response.data.data);
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch event';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchEvent, data, isLoading, error };
};

/**
 * Hook for event registration
 */
export const useEventRegistration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerForEvent = useCallback(async (
    eventId: string,
    data: Omit<EventRegistrationFormData, 'eventId'>
  ): Promise<EventRegistration> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ data: EventRegistration }>(
        `${EVENTS_API}/${eventId}/register`,
        data
      );
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to register for event';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelRegistration = useCallback(async (
    registrationId: string,
    reason?: string
  ): Promise<EventRegistration> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.delete<{ data: EventRegistration }>(
        `${EVENTS_API}/registrations/${registrationId}`,
        { data: { reason } }
      );
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to cancel registration';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { registerForEvent, cancelRegistration, isLoading, error };
};

/**
 * Hook for fetching registrations
 */
export const useRegistrations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RegistrationListResponse | null>(null);

  const fetchRegistrations = useCallback(async (params?: RegistrationQueryParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const endpoint = params?.eventId
        ? `${EVENTS_API}/${params.eventId}/registrations`
        : `${EVENTS_API}/my-registrations`;

      const response = await apiClient.get<{ data: RegistrationListResponse }>(endpoint, {
        params,
      });
      setData(response.data.data);
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch registrations';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMyRegistrations = useCallback(async (params?: Omit<RegistrationQueryParams, 'studentId'>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ data: RegistrationListResponse }>(
        `${EVENTS_API}/my-registrations`,
        { params }
      );
      setData(response.data.data);
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch your registrations';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchRegistrations, fetchMyRegistrations, data, isLoading, error };
};

/**
 * Hook for fetching event statistics
 */
export const useEventStats = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EventStats | null>(null);

  const fetchStats = useCallback(async (eventId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ data: EventStats }>(
        `${EVENTS_API}/${eventId}/stats`
      );
      setData(response.data.data);
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch event statistics';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchStats, data, isLoading, error };
};

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * Hook for checking if user can register for an event
 */
export const useCanRegister = (event: Event | null, studentAgeCategory?: string) => {
  if (!event) return { canRegister: false, reason: 'Event not found' };

  const now = new Date();
  const regStart = new Date(event.registrationStartDate);
  const regEnd = new Date(event.registrationEndDate);

  if (event.status !== 'REGISTRATION_OPEN') {
    return { canRegister: false, reason: 'Registration is not open' };
  }

  if (now < regStart) {
    return { canRegister: false, reason: 'Registration has not started yet' };
  }

  if (now > regEnd) {
    return { canRegister: false, reason: 'Registration has ended' };
  }

  if (event.maxParticipants && event._count?.registrations &&
    event._count.registrations >= event.maxParticipants) {
    return { canRegister: false, reason: 'Event is fully booked' };
  }

  if (studentAgeCategory && !event.ageCategories.includes(studentAgeCategory as any) &&
    !event.ageCategories.includes('OPEN')) {
    return { canRegister: false, reason: 'Your age category is not eligible' };
  }

  return { canRegister: true, reason: null };
};

// ============================================
// ADMIN HOOKS
// ============================================

/**
 * Hook for fetching pending event approvals (DRAFT status)
 */
export const useEventApprovals = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EventListResponse | null>(null);

  const fetchPendingEvents = useCallback(async (params?: EventQueryParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ data: EventListResponse }>(EVENTS_API, {
        params: {
          ...params,
          status: 'DRAFT', // Only fetch draft events pending approval
        },
      });
      setData(response.data.data);
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch pending events';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchPendingEvents, data, isLoading, error };
};

/**
 * Hook for updating event status (for approvals/rejections)
 */
export const useEventStatusUpdate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(async (
    eventId: number,
    status: string,
    remarks?: string
  ): Promise<Event> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.put<{ data: Event }>(
        `${EVENTS_API}/${eventId}/status`,
        { status, remarks }
      );
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update event status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const approveEvent = useCallback(async (eventId: number, remarks?: string) => {
    return updateStatus(eventId, 'PUBLISHED', remarks || 'Approved by Global Admin');
  }, [updateStatus]);

  const rejectEvent = useCallback(async (eventId: number, reason: string) => {
    return updateStatus(eventId, 'REJECTED', reason);
  }, [updateStatus]);

  return { updateStatus, approveEvent, rejectEvent, isLoading, error };
};

