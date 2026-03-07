'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { FileText, Camera, X, Check, Loader2, CreditCard } from 'lucide-react';
import { useRegistrationStore } from '@/lib/store/registrationStore';
import { StudentRegistrationData } from '@/types/student';

const formSchema = z.object({
  photoFile: z.any().optional(),
  aadhaarFile: z.any().optional(),
  birthCertificateFile: z.any().optional(),
  termsAccepted: z.boolean().refine((v) => v === true, 'You must accept terms'),
});
type FormData = z.infer<typeof formSchema>;

interface DocumentsStepProps {
  onComplete: (data: Partial<StudentRegistrationData>) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function DocumentsStep({ onComplete, onSubmit, isSubmitting }: DocumentsStepProps) {
  const { formData, updateFormData, setPreview, previews } = useRegistrationStore();
  const [termsAccepted, setTermsAccepted] = useState(formData.termsAccepted || false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(previews.profilePhoto || null);
  const [aadhaarPreview, setAadhaarPreview] = useState<string | null>(previews.aadhaarCard || null);
  const [certPreview, setCertPreview] = useState<string | null>(previews.birthCertificate || null);

  const { handleSubmit, setValue } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { termsAccepted: false },
  });

  const handleFileSelect = (
    field: 'photoFile' | 'aadhaarFile' | 'birthCertificateFile',
    setPreviewFn: (url: string | null) => void
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result as string;
      setPreviewFn(b64);
      setValue(field, b64);
      const storeField = field === 'photoFile' ? 'profilePhoto' : field === 'aadhaarFile' ? 'aadhaarCard' : 'birthCertificate';
      setPreview(storeField as keyof typeof previews, b64);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (field: 'photoFile' | 'aadhaarFile' | 'birthCertificateFile', setPreviewFn: (url: string | null) => void) => {
    setPreviewFn(null); setValue(field, undefined);
    const storeField = field === 'photoFile' ? 'profilePhoto' : field === 'aadhaarFile' ? 'aadhaarCard' : 'birthCertificate';
    setPreview(storeField as keyof typeof previews, null);
  };

  const onFormSubmit = (data: FormData) => {
    if (!termsAccepted) return;
    const mappedData: Partial<StudentRegistrationData> = {
      ...data, profilePhoto: data.photoFile, aadhaarCardImage: data.aadhaarFile,
      birthCertificate: data.birthCertificateFile, termsAccepted: true,
    };
    updateFormData({ termsAccepted: true });
    onComplete(mappedData);
    onSubmit();
  };

  const uploadBox = (
    preview: string | null,
    onRemove: () => void,
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    accept: string,
    icon: React.ReactNode,
    label: string
  ) => (
    <div className="aspect-square rounded-xl border-2 border-dashed overflow-hidden relative transition-colors bg-gray-50 border-gray-200 hover:border-green-300 hover:bg-green-50">
      {preview ? (
        <>
          <img src={preview} alt={label} className="w-full h-full object-cover" />
          <button type="button" onClick={onRemove} className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </>
      ) : (
        <label className="flex flex-col items-center justify-center h-full cursor-pointer gap-2 p-2">
          <div className="text-gray-400">{icon}</div>
          <span className="text-xs text-gray-500 text-center">{label}</span>
          <input type="file" accept={accept} className="hidden" onChange={onFileChange} />
        </label>
      )}
    </div>
  );

  return (
    <form id="step-6-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Profile Photo <span className="text-red-400">*</span></label>
          {uploadBox(photoPreview, () => removeFile('photoFile', setPhotoPreview), handleFileSelect('photoFile', setPhotoPreview), 'image/*', <Camera className="w-7 h-7" />, 'Passport photo')}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Aadhaar Card <span className="text-red-400">*</span></label>
          {uploadBox(aadhaarPreview, () => removeFile('aadhaarFile', setAadhaarPreview), handleFileSelect('aadhaarFile', setAadhaarPreview), 'image/*,application/pdf', <CreditCard className="w-7 h-7" />, 'Aadhaar card')}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Birth Certificate <span className="text-gray-400">(Optional)</span></label>
          {uploadBox(certPreview, () => removeFile('birthCertificateFile', setCertPreview), handleFileSelect('birthCertificateFile', setCertPreview), 'image/*,application/pdf', <FileText className="w-7 h-7" />, 'Birth cert')}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-medium text-amber-800 mb-1">Photo Guidelines</p>
        <ul className="text-xs text-amber-700 space-y-0.5">
          <li>• Passport-size photo with plain background</li>
          <li>• Aadhaar: clear scan with all details visible</li>
          <li>• Max 5MB per file</li>
        </ul>
      </div>

      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={termsAccepted}
            onChange={(e) => { setTermsAccepted(e.target.checked); setValue('termsAccepted', e.target.checked); updateFormData({ termsAccepted: e.target.checked }); }}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-green-500 focus:ring-green-500/20" />
          <p className="text-sm text-gray-700">
            I hereby declare that all information provided is true and correct. I agree to the{' '}
            <a href="/terms" className="text-green-600 hover:underline">Terms &amp; Conditions</a> and{' '}
            <a href="/privacy" className="text-green-600 hover:underline">Privacy Policy</a> of SSFI.
          </p>
        </label>
      </div>

      <motion.button type="submit" disabled={!termsAccepted || isSubmitting}
        whileHover={{ scale: termsAccepted && !isSubmitting ? 1.01 : 1 }}
        className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${termsAccepted && !isSubmitting
          ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25'
          : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
        {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : <><Check className="w-5 h-5" /> Submit Registration</>}
      </motion.button>

      {!termsAccepted && <p className="text-center text-xs text-amber-600">Please accept the terms and conditions to submit</p>}
    </form>
  );
}
