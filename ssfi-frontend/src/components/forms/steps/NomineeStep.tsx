'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegistrationStore } from '@/lib/store/registrationStore';

const schema = z.object({
  nomineeName: z.string().min(2, 'Nominee name is required'),
  nomineeRelation: z.string().min(1, 'Relation is required'),
  nomineeAge: z.number().min(18, 'Nominee must be 18+').max(100),
  nomineePhone: z.string().length(10, 'Enter valid 10-digit phone'),
});
type FormData = z.infer<typeof schema>;

const RELATIONS = ['Father', 'Mother', 'Spouse', 'Brother', 'Sister', 'Uncle', 'Aunt', 'Guardian', 'Other'];

const inputCls = (err?: boolean) =>
  `w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:border-green-500 text-sm transition-all ${err ? 'border-red-400 focus:ring-red-400/20' : 'border-gray-200 focus:ring-green-500/20'}`;

export default function NomineeStep({ onComplete }: { onComplete: (data: FormData) => void }) {
  const { formData, updateFormData } = useRegistrationStore();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nomineeName: (formData.nomineeName as string) || '',
      nomineeRelation: (formData.nomineeRelation as string) || '',
      nomineeAge: (formData.nomineeAge as number) || 18,
      nomineePhone: (formData.nomineePhone as string) || '',
    },
  });

  const onSubmit = (data: FormData) => { updateFormData(data); onComplete(data); };

  return (
    <form id="step-3-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800">
          The nominee will receive insurance benefits in case of any unforeseen circumstances. Nominee must be 18 years or older.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nominee Full Name <span className="text-red-400">*</span></label>
          <input {...register('nomineeName')} placeholder="Nominee's full name" className={inputCls(!!errors.nomineeName)} />
          {errors.nomineeName && <p className="mt-1 text-xs text-red-500">{errors.nomineeName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Relation with Skater <span className="text-red-400">*</span></label>
          <select {...register('nomineeRelation')} className={inputCls(!!errors.nomineeRelation)}>
            <option value="">Select relation</option>
            {RELATIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          {errors.nomineeRelation && <p className="mt-1 text-xs text-red-500">{errors.nomineeRelation.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nominee Age <span className="text-red-400">*</span></label>
          <input {...register('nomineeAge', { valueAsNumber: true })} type="number" min={18} max={100}
            onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) setValue('nomineeAge', v); }}
            placeholder="Age (18+)" className={inputCls(!!errors.nomineeAge)} />
          {errors.nomineeAge && <p className="mt-1 text-xs text-red-500">{errors.nomineeAge.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nominee Phone <span className="text-red-400">*</span></label>
          <input {...register('nomineePhone')} type="tel" maxLength={10} placeholder="10-digit number" className={inputCls(!!errors.nomineePhone)} />
          {errors.nomineePhone && <p className="mt-1 text-xs text-red-500">{errors.nomineePhone.message}</p>}
        </div>
      </div>
    </form>
  );
}
