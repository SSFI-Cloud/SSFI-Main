import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StudentRegistrationData } from '@/types/student';

// Default form values
const defaultFormData: Partial<StudentRegistrationData> = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: undefined,
  bloodGroup: undefined,
  email: '',
  phone: '',
  fatherName: '',
  motherName: '',
  schoolName: '',
  schoolClass: '',
  nomineeName: '',
  nomineeAge: undefined,
  nomineeRelation: undefined,
  nomineePhone: '',
  clubId: '',
  coachName: '',
  coachPhone: '',
  coachEmail: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  stateId: '',
  districtId: '',
  pincode: '',
  aadhaarNumber: '',
  aadhaarCardImage: '',
  profilePhoto: '',
  birthCertificate: '',
  termsAccepted: false,
};

interface RegistrationState {
  // Current step
  currentStep: number;

  // Form data
  formData: Partial<StudentRegistrationData>;

  // Completed steps
  completedSteps: number[];

  // Student UID after successful registration
  studentUid: string | null;

  // File previews
  previews: {
    profilePhoto: string | null;
    aadhaarCard: string | null;
    birthCertificate: string | null;
  };

  // Actions
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  updateFormData: (data: Partial<StudentRegistrationData>) => void;
  setFormField: <K extends keyof StudentRegistrationData>(
    field: K,
    value: StudentRegistrationData[K]
  ) => void;

  markStepComplete: (step: number) => void;
  markStepIncomplete: (step: number) => void;

  setPreview: (field: keyof RegistrationState['previews'], url: string | null) => void;

  setStudentUid: (uid: string | null) => void;

  resetForm: () => void;

  // Computed
  isStepComplete: (step: number) => boolean;
  canProceed: () => boolean;
}

export const useRegistrationStore = create<RegistrationState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStep: 1,
      formData: { ...defaultFormData },
      completedSteps: [],
      studentUid: null,
      previews: {
        profilePhoto: null,
        aadhaarCard: null,
        birthCertificate: null,
      },

      // Step navigation
      setCurrentStep: (step) => {
        if (step >= 1 && step <= 6) {
          set({ currentStep: step });
        }
      },

      nextStep: () => {
        const { currentStep } = get();
        if (currentStep < 6) {
          set({ currentStep: currentStep + 1 });
        }
      },

      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
          set({ currentStep: currentStep - 1 });
        }
      },

      // Form data management
      updateFormData: (data) => {
        set((state) => ({
          formData: { ...state.formData, ...data },
        }));
      },

      setFormField: (field, value) => {
        set((state) => ({
          formData: { ...state.formData, [field]: value },
        }));
      },

      // Step completion tracking
      markStepComplete: (step) => {
        set((state) => ({
          completedSteps: state.completedSteps.includes(step)
            ? state.completedSteps
            : [...state.completedSteps, step],
        }));
      },

      markStepIncomplete: (step) => {
        set((state) => ({
          completedSteps: state.completedSteps.filter((s) => s !== step),
        }));
      },

      // File previews
      setPreview: (field, url) => {
        set((state) => ({
          previews: { ...state.previews, [field]: url },
        }));
      },

      // Student UID
      setStudentUid: (uid) => {
        set({ studentUid: uid });
      },

      // Reset
      resetForm: () => {
        set({
          currentStep: 1,
          formData: { ...defaultFormData },
          completedSteps: [],
          studentUid: null,
          previews: {
            profilePhoto: null,
            aadhaarCard: null,
            birthCertificate: null,
          },
        });
      },

      // Computed helpers
      isStepComplete: (step) => {
        return get().completedSteps.includes(step);
      },

      canProceed: () => {
        const { currentStep, completedSteps } = get();
        return completedSteps.includes(currentStep);
      },
    }),
    {
      name: 'ssfi-registration-form',
      partialize: (state) => ({
        currentStep: state.currentStep,
        formData: state.formData,
        completedSteps: state.completedSteps,
        // Don't persist large file previews
      }),
    }
  )
);

// Selectors for specific step data
export const usePersonalInfoData = () =>
  useRegistrationStore((state) => ({
    firstName: state.formData.firstName,
    lastName: state.formData.lastName,
    dateOfBirth: state.formData.dateOfBirth,
    gender: state.formData.gender,
    bloodGroup: state.formData.bloodGroup,
    email: state.formData.email,
    phone: state.formData.phone,
  }));

export const useFamilySchoolData = () =>
  useRegistrationStore((state) => ({
    fatherName: state.formData.fatherName,
    motherName: state.formData.motherName,
    schoolName: state.formData.schoolName,
    schoolClass: state.formData.schoolClass,
  }));

export const useNomineeData = () =>
  useRegistrationStore((state) => ({
    nomineeName: state.formData.nomineeName,
    nomineeAge: state.formData.nomineeAge,
    nomineeRelation: state.formData.nomineeRelation,
    nomineePhone: state.formData.nomineePhone,
  }));

export const useClubCoachData = () =>
  useRegistrationStore((state) => ({
    clubId: state.formData.clubId,
    coachName: state.formData.coachName,
    coachPhone: state.formData.coachPhone,
    coachEmail: state.formData.coachEmail,
  }));

export const useAddressData = () =>
  useRegistrationStore((state) => ({
    addressLine1: state.formData.addressLine1,
    addressLine2: state.formData.addressLine2,
    city: state.formData.city,
    stateId: state.formData.stateId,
    districtId: state.formData.districtId,
    pincode: state.formData.pincode,
  }));

export const useDocumentsData = () =>
  useRegistrationStore((state) => ({
    aadhaarNumber: state.formData.aadhaarNumber,
    aadhaarCardImage: state.formData.aadhaarCardImage,
    profilePhoto: state.formData.profilePhoto,
    birthCertificate: state.formData.birthCertificate,
    termsAccepted: state.formData.termsAccepted,
  }));
