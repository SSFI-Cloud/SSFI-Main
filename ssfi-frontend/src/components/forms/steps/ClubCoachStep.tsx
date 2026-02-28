'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegistrationStore } from '@/lib/store/registrationStore';
import { useStates, useDistricts, useClubs } from '@/lib/hooks/useStudent';

const schema = z.object({
  stateId: z.string().min(1, 'State is required'),
  districtId: z.string().min(1, 'District is required'),
  clubId: z.string().min(1, 'Club is required'),
  coachName: z.string().optional(),
  coachPhone: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const inputCls = (err?: boolean) =>
  `w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:border-green-500 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${err ? 'border-red-400 focus:ring-red-400/20' : 'border-gray-200 focus:ring-green-500/20'}`;

export default function ClubCoachStep({ onComplete }: { onComplete: (data: FormData) => void }) {
  const { formData, updateFormData } = useRegistrationStore();
  const [selectedState, setSelectedState] = useState(formData.stateId || '');
  const [selectedDistrict, setSelectedDistrict] = useState(formData.districtId || '');

  const { fetchStates, data: states, isLoading: statesLoading } = useStates();
  const { fetchDistricts, data: districts, isLoading: districtsLoading, clearDistricts } = useDistricts();
  const { fetchClubs, data: clubs, isLoading: clubsLoading, clearClubs } = useClubs();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      stateId: formData.stateId || '',
      districtId: formData.districtId || '',
      clubId: formData.clubId || '',
      coachName: formData.coachName || '',
      coachPhone: formData.coachPhone || '',
    },
  });

  const watchState = watch('stateId');
  const watchDistrict = watch('districtId');

  useEffect(() => { fetchStates(); }, [fetchStates]);

  useEffect(() => {
    if (watchState !== selectedState) {
      setSelectedState(watchState);
      setValue('districtId', '');
      setValue('clubId', '');
      setSelectedDistrict('');
      if (watchState) fetchDistricts(watchState); else clearDistricts();
    }
  }, [watchState]);

  useEffect(() => {
    if (watchDistrict !== selectedDistrict) {
      setSelectedDistrict(watchDistrict);
      setValue('clubId', '');
      if (watchDistrict) fetchClubs(watchDistrict); else clearClubs();
    }
  }, [watchDistrict]);

  const onSubmit = (data: FormData) => { updateFormData(data); onComplete(data); };

  return (
    <form id="step-4-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">State <span className="text-red-400">*</span></label>
          <select {...register('stateId')} disabled={statesLoading} className={inputCls(!!errors.stateId)}>
            <option value="">{statesLoading ? 'Loading...' : 'Select state'}</option>
            {states?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {errors.stateId && <p className="mt-1 text-xs text-red-500">{errors.stateId.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">District <span className="text-red-400">*</span></label>
          <select {...register('districtId')} disabled={!selectedState || districtsLoading} className={inputCls(!!errors.districtId)}>
            <option value="">{districtsLoading ? 'Loading...' : !selectedState ? 'Select state first' : 'Select district'}</option>
            {districts?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          {errors.districtId && <p className="mt-1 text-xs text-red-500">{errors.districtId.message}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Club <span className="text-red-400">*</span></label>
          <select {...register('clubId')} disabled={!selectedDistrict || clubsLoading} className={inputCls(!!errors.clubId)}>
            <option value="">{clubsLoading ? 'Loading...' : !selectedDistrict ? 'Select district first' : 'Select club'}</option>
            {clubs?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.clubId && <p className="mt-1 text-xs text-red-500">{errors.clubId.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Coach Name <span className="text-gray-400">(Optional)</span></label>
          <input {...register('coachName')} placeholder="Coach's full name" className={inputCls()} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Coach Phone <span className="text-gray-400">(Optional)</span></label>
          <input {...register('coachPhone')} type="tel" maxLength={10} placeholder="10-digit number" className={inputCls()} />
        </div>
      </div>
    </form>
  );
}
