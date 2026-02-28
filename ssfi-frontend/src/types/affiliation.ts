// Affiliation Types

export type RegistrationType = 'STATE_SECRETARY' | 'DISTRICT_SECRETARY' | 'CLUB' | 'STUDENT';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

// Registration Window
export interface RegistrationWindow {
  id: string;
  type: RegistrationType;
  title: string;
  description?: string;
  instructions?: string;
  startDate: string;
  endDate: string;
  baseFee: number;
  isPaused: boolean;
  createdAt: string;
}

// Registration Status Response
export interface RegistrationStatus {
  isOpen: boolean;
  window: RegistrationWindow | null;
  message: string;
}

export interface AllRegistrationStatuses {
  STATE_SECRETARY: RegistrationStatus;
  DISTRICT_SECRETARY: RegistrationStatus;
  CLUB: RegistrationStatus;
  STUDENT: RegistrationStatus;
}

// State Secretary
export interface StateSecretary {
  id: string;
  uid: string;
  name: string;
  gender: Gender;
  email: string;
  phone: string;
  aadhaarNumber: string;
  stateId: string;
  state?: { id: string; name: string; code: string };
  residentialAddress: string;
  identityProof: string;
  profilePhoto: string;
  status: ApprovalStatus;
  approvedAt?: string;
  rejectionRemarks?: string;
  createdAt: string;
}

// District Secretary
export interface DistrictSecretary {
  id: string;
  uid: string;
  name: string;
  gender: Gender;
  email: string;
  phone: string;
  aadhaarNumber: string;
  stateId: string;
  state?: { id: string; name: string; code: string };
  districtId: string;
  district?: { id: string; name: string; code: string };
  residentialAddress: string;
  identityProof: string;
  profilePhoto: string;
  status: ApprovalStatus;
  approvedAt?: string;
  rejectionRemarks?: string;
  createdAt: string;
}

// Club
export interface Club {
  id: string;
  uid: string;
  code: string;
  name: string;
  registrationNumber: string;
  establishedYear: number;
  contactPerson: string;
  phone: string;
  email?: string;
  stateId: string;
  state?: { id: string; name: string; code: string };
  districtId: string;
  district?: { id: string; name: string; code: string };
  address: string;
  logo?: string;
  status: ApprovalStatus;
  approvedAt?: string;
  rejectionRemarks?: string;
  createdAt: string;
  _count?: { students: number };
}

// Form Data Types
export interface StateSecretaryFormData {
  name: string;
  gender: Gender;
  email: string;
  phone: string;
  aadhaarNumber: string;
  stateId: string;
  residentialAddress: string;
  identityProof: string;
  profilePhoto: string;
  termsAccepted: boolean;
}

export interface DistrictSecretaryFormData {
  name: string;
  gender: Gender;
  email: string;
  phone: string;
  aadhaarNumber: string;
  stateId: string;
  districtId: string;
  residentialAddress: string;
  identityProof: string;
  profilePhoto: string;
  termsAccepted: boolean;
}

export interface ClubFormData {
  clubName: string;
  registrationNumber: string;
  establishedYear: number;
  contactPersonName: string;
  phone: string;
  email?: string;
  stateId: string;
  districtId: string;
  address: string;
  clubLogo?: string;
  status: 'ACTIVE' | 'INACTIVE';
  termsAccepted: boolean;
}

// API Response Types
export interface AffiliationListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Query Params
export interface AffiliationQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: RegistrationType;
  stateId?: string;
  districtId?: string;
  status?: ApprovalStatus;
  sortBy?: 'createdAt' | 'name' | 'clubName';
  sortOrder?: 'asc' | 'desc';
}

// Constants
export const REGISTRATION_TYPES: { value: RegistrationType; label: string; description: string }[] = [
  {
    value: 'STATE_SECRETARY',
    label: 'State Secretary',
    description: 'Register as a State Secretary to manage state-level operations',
  },
  {
    value: 'DISTRICT_SECRETARY',
    label: 'District Secretary',
    description: 'Register as a District Secretary to manage district-level operations',
  },
  {
    value: 'CLUB',
    label: 'Club',
    description: 'Register your skating club to affiliate with SSFI',
  },
  {
    value: 'STUDENT',
    label: 'Student',
    description: 'Register as a Student/Skater to participate in events',
  },
];

export const GENDERS: { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

export const STATUS_CONFIG: Record<ApprovalStatus, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'Pending', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  APPROVED: { label: 'Approved', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  REJECTED: { label: 'Rejected', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  SUSPENDED: { label: 'Suspended', color: 'text-slate-400', bgColor: 'bg-slate-500/20' },
};

// Utility Functions
export const formatRegistrationDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const getDaysRemaining = (endDate: string): number => {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const isWindowActive = (window: RegistrationWindow): boolean => {
  const now = new Date();
  const start = new Date(window.startDate);
  const end = new Date(window.endDate);
  return !window.isPaused && now >= start && now <= end;
};

// Payment Types
export interface PaymentInitiationResponse {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  key: string;
  userDetails: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface PaymentVerificationData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
