'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegistrationStore } from '@/lib/store/registrationStore';

const schema = z.object({
  fatherName: z.string().min(2, 'Father name is required'),
  motherName: z.string().min(2, 'Mother name is required'),
  guardianPhone: z.string().length(10, 'Enter valid 10-digit phone'),
  guardianEmail: z.string().email().optional().or(z.literal('')),
  schoolName: z.string().optional(),
  schoolClass: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const inputCls = (err?: boolean) =>
  `w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:border-green-500 text-sm transition-all ${err ? 'border-red-400 focus:ring-red-400/20' : 'border-gray-200 focus:ring-green-500/20'}`;

export default function FamilySchoolStep({ onComplete }: { onComplete: (data: FormData) => void }) {
  const { formData, updateFormData } = useRegistrationStore();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fatherName: formData.fatherName || '',
      motherName: formData.motherName || '',
      guardianPhone: (formData as any).guardianPhone || '',
      guardianEmail: (formData as any).guardianEmail || '',
      schoolName: formData.schoolName || '',
      schoolClass: (formData as any).schoolClass || '',
    },
  });

  const onSubmit = (data: FormData) => { updateFormData(data); onComplete(data); };

  return (
    <form id="step-2-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Father&apos;s Name <span className="text-red-400">*</span></label>
          <input {...register('fatherName')} placeholder="Father's full name" className={inputCls(!!errors.fatherName)} />
          {errors.fatherName && <p className="mt-1 text-xs text-red-500">{errors.fatherName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Mother&apos;s Name <span className="text-red-400">*</span></label>
          <input {...register('motherName')} placeholder="Mother's full name" className={inputCls(!!errors.motherName)} />
          {errors.motherName && <p className="mt-1 text-xs text-red-500">{errors.motherName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Guardian&apos;s Phone <span className="text-red-400">*</span></label>
          <input {...register('guardianPhone')} type="tel" maxLength={10} placeholder="10-digit number" className={inputCls(!!errors.guardianPhone)} />
          {errors.guardianPhone && <p className="mt-1 text-xs text-red-500">{errors.guardianPhone.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Guardian&apos;s Email <span className="text-gray-400">(Optional)</span></label>
          <input {...register('guardianEmail')} type="email" placeholder="guardian@email.com" className={inputCls(!!errors.guardianEmail)} />
          {errors.guardianEmail && <p className="mt-1 text-xs text-red-500">{errors.guardianEmail.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">School/College Name</label>
          <input {...register('schoolName')} placeholder="School or college name" className={inputCls()} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Class/Grade</label>
          <select {...register('schoolClass')} className={inputCls()}>
            <option value="">Select class</option>
            {[...Array(12)].map((_, i) => (
              <option key={i} value={`${i + 1}`}>Class {i + 1}</option>
            ))}
            <option value="college">College</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
    </form>
  );
}
