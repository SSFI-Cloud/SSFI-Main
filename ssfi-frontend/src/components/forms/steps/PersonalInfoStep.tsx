'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Calendar, User, Phone, Mail, Droplet } from 'lucide-react';

import { personalInfoSchema, type PersonalInfoData } from '@/lib/validations/student';
import { useRegistrationStore } from '@/lib/store/registrationStore';
import { GENDERS, BLOOD_GROUPS } from '@/types/student';
import { calculateAge, getAgeCategoryFromAge } from '@/lib/hooks/useStudent';

const inputCls = (err?: boolean) =>
  `w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:border-green-500 text-sm transition-all ${err ? 'border-red-400 focus:ring-red-400/20' : 'border-gray-200 focus:ring-green-500/20'}`;

interface PersonalInfoStepProps {
  onComplete: (data: PersonalInfoData) => void;
}

export default function PersonalInfoStep({ onComplete }: PersonalInfoStepProps) {
  const { formData, updateFormData } = useRegistrationStore();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<PersonalInfoData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: formData.firstName || '',
      lastName: formData.lastName || '',
      dateOfBirth: formData.dateOfBirth || '',
      gender: formData.gender,
      bloodGroup: formData.bloodGroup,
      email: formData.email || '',
      phone: formData.phone || '',
    },
  });

  const dateOfBirth = watch('dateOfBirth');
  const age = dateOfBirth ? calculateAge(dateOfBirth) : null;
  const ageCategory = age !== null ? getAgeCategoryFromAge(age) : null;

  const onSubmit = (data: PersonalInfoData) => { updateFormData(data); onComplete(data); };

  return (
    <form id="step-1-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name <span className="text-red-400">*</span></label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input {...register('firstName')} placeholder="First name" className={`${inputCls(!!errors.firstName)} pl-9`} />
          </div>
          {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name <span className="text-red-400">*</span></label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input {...register('lastName')} placeholder="Last name" className={`${inputCls(!!errors.lastName)} pl-9`} />
          </div>
          {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth <span className="text-red-400">*</span></label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input {...register('dateOfBirth')} type="date" max={new Date().toISOString().split('T')[0]}
              className={`${inputCls(!!errors.dateOfBirth)} pl-9`} />
          </div>
          {errors.dateOfBirth && <p className="mt-1 text-xs text-red-500">{errors.dateOfBirth.message}</p>}
          {age !== null && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-500">Age: {age} years</span>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">{ageCategory}</span>
            </motion.div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender <span className="text-red-400">*</span></label>
          <div className="grid grid-cols-3 gap-2">
            {GENDERS.map((g) => (
              <label key={g.value} className={`flex items-center justify-center px-3 py-2.5 rounded-xl border cursor-pointer text-sm font-medium transition-all ${watch('gender') === g.value ? 'bg-green-50 border-green-400 text-green-600' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                <input {...register('gender')} type="radio" value={g.value} className="sr-only" />
                {g.label}
              </label>
            ))}
          </div>
          {errors.gender && <p className="mt-1 text-xs text-red-500">{errors.gender.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Blood Group <span className="text-red-400">*</span></label>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {BLOOD_GROUPS.map((group) => (
            <label key={group} className={`flex items-center justify-center px-2 py-2 rounded-lg border cursor-pointer transition-all ${watch('bloodGroup') === group ? 'bg-red-50 border-red-400 text-red-600' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              <input {...register('bloodGroup')} type="radio" value={group} className="sr-only" />
              <Droplet className="w-3 h-3 mr-0.5 opacity-60" />
              <span className="text-xs font-medium">{group}</span>
            </label>
          ))}
        </div>
        {errors.bloodGroup && <p className="mt-1 text-xs text-red-500">{errors.bloodGroup.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number <span className="text-red-400">*</span></label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <span className="absolute left-9 top-1/2 -translate-y-1/2 text-gray-400 text-sm border-r border-gray-200 pr-2">+91</span>
            <input {...register('phone')} type="tel" maxLength={10} placeholder="10-digit number" className={`${inputCls(!!errors.phone)} pl-20`} />
          </div>
          {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-gray-400">(Optional)</span></label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input {...register('email')} type="email" placeholder="your@email.com" className={`${inputCls(!!errors.email)} pl-9`} />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800">
          <strong>Note:</strong> Date of birth is used to determine your age category for competitions. Ensure it matches your Aadhaar card.
        </p>
      </div>
    </form>
  );
}
