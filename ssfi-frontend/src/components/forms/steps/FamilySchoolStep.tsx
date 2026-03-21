'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRegistrationStore } from '@/lib/store/registrationStore';
import { familySchoolSchema, type FamilySchoolData, FATHER_OCCUPATIONS, ACADEMIC_BOARDS } from '@/lib/validations/student';

const inputCls = (err?: boolean) =>
  `w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:border-green-500 text-sm transition-all ${err ? 'border-red-400 focus:ring-red-400/20' : 'border-gray-200 focus:ring-green-500/20'}`;

export default function FamilySchoolStep({ onComplete }: { onComplete: (data: FamilySchoolData) => void }) {
  const { formData, updateFormData } = useRegistrationStore();

  const { register, handleSubmit, formState: { errors } } = useForm<FamilySchoolData>({
    resolver: zodResolver(familySchoolSchema),
    defaultValues: {
      fatherName: formData.fatherName || '',
      motherName: formData.motherName || '',
      fatherOccupation: (formData as any).fatherOccupation || '',
      schoolName: formData.schoolName || '',
      academicBoard: (formData as any).academicBoard || '',
    },
  });

  const onSubmit = (data: FamilySchoolData) => { updateFormData(data); onComplete(data); };

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
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Father&apos;s Occupation <span className="text-red-400">*</span></label>
          <select {...register('fatherOccupation')} className={inputCls(!!errors.fatherOccupation)}>
            <option value="">Select occupation</option>
            {FATHER_OCCUPATIONS.map(occ => (
              <option key={occ} value={occ}>{occ}</option>
            ))}
          </select>
          {errors.fatherOccupation && <p className="mt-1 text-xs text-red-500">{errors.fatherOccupation.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">School/College Name <span className="text-red-400">*</span></label>
          <input {...register('schoolName')} placeholder="School or college name" className={inputCls(!!errors.schoolName)} />
          {errors.schoolName && <p className="mt-1 text-xs text-red-500">{errors.schoolName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Academic Board <span className="text-red-400">*</span></label>
          <select {...register('academicBoard')} className={inputCls(!!errors.academicBoard)}>
            <option value="">Select board</option>
            {ACADEMIC_BOARDS.map(board => (
              <option key={board.value} value={board.value}>{board.label}</option>
            ))}
          </select>
          {errors.academicBoard && <p className="mt-1 text-xs text-red-500">{errors.academicBoard.message}</p>}
        </div>
      </div>
    </form>
  );
}
