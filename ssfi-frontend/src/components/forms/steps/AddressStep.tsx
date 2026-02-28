'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegistrationStore } from '@/lib/store/registrationStore';

const schema = z.object({
  addressLine1: z.string().min(5, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  stateId: z.string().min(1, 'State is required'),
  districtId: z.string().min(1, 'District is required'),
  pincode: z.string().length(6, 'Pincode must be 6 digits'),
});
type FormData = z.infer<typeof schema>;

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Andaman and Nicobar','Chandigarh',
  'Dadra and Nagar Haveli','Daman and Diu','Delhi','Jammu and Kashmir',
  'Ladakh','Lakshadweep','Puducherry',
];

const inputCls = (err?: boolean) =>
  `w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:border-green-500 text-sm transition-all ${err ? 'border-red-400 focus:ring-red-400/20' : 'border-gray-200 focus:ring-green-500/20'}`;

export default function AddressStep({ onComplete }: { onComplete: (data: FormData) => void }) {
  const { formData, updateFormData } = useRegistrationStore();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      addressLine1: formData.addressLine1 || '',
      addressLine2: formData.addressLine2 || '',
      city: formData.city || '',
      stateId: formData.stateId || '',
      districtId: formData.districtId || '',
      pincode: formData.pincode || '',
    },
  });

  const onSubmit = (data: FormData) => { updateFormData(data); onComplete(data); };

  return (
    <form id="step-5-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Address Line 1 <span className="text-red-400">*</span></label>
          <input {...register('addressLine1')} placeholder="House no., Street, Locality" className={inputCls(!!errors.addressLine1)} />
          {errors.addressLine1 && <p className="mt-1 text-xs text-red-500">{errors.addressLine1.message}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Address Line 2 <span className="text-gray-400">(Optional)</span></label>
          <input {...register('addressLine2')} placeholder="Area, Landmark" className={inputCls()} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">City/Town <span className="text-red-400">*</span></label>
          <input {...register('city')} placeholder="City name" className={inputCls(!!errors.city)} />
          {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">District <span className="text-red-400">*</span></label>
          <input {...register('districtId')} placeholder="District name" className={inputCls(!!errors.districtId)} />
          {errors.districtId && <p className="mt-1 text-xs text-red-500">{errors.districtId.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">State/UT <span className="text-red-400">*</span></label>
          <select {...register('stateId')} className={inputCls(!!errors.stateId)}>
            <option value="">Select state</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors.stateId && <p className="mt-1 text-xs text-red-500">{errors.stateId.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Pincode <span className="text-red-400">*</span></label>
          <input {...register('pincode')} maxLength={6} placeholder="6-digit pincode" className={inputCls(!!errors.pincode)} />
          {errors.pincode && <p className="mt-1 text-xs text-red-500">{errors.pincode.message}</p>}
        </div>
      </div>
    </form>
  );
}
