'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  MapPin,
  Trophy,
  Check,
  Loader2,
  User,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import type { Event, Discipline, AgeCategory } from '@/types/event';
import { DISCIPLINES, AGE_CATEGORIES, formatEventDate } from '@/types/event';
import { useEventRegistration } from '@/lib/hooks/useEvents';

interface EventRegistrationModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
  studentInfo?: {
    id: string;
    uid: string;
    firstName: string;
    lastName: string;
    ageCategory: AgeCategory;
  };
  onSuccess?: () => void;
}

export default function EventRegistrationModal({
  event,
  isOpen,
  onClose,
  studentInfo,
  onSuccess,
}: EventRegistrationModalProps) {
  const [selectedDisciplines, setSelectedDisciplines] = useState<Discipline[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [remarks, setRemarks] = useState('');
  const [step, setStep] = useState<'selection' | 'confirm' | 'success'>('selection');

  const { registerForEvent, isLoading } = useEventRegistration();

  // Filter available disciplines
  const availableDisciplines = DISCIPLINES.filter((d) =>
    event.disciplines.includes(d.value)
  );

  // Filter available age categories
  const availableCategories = AGE_CATEGORIES.filter((c) =>
    event.ageCategories.includes(c.value)
  );

  // Calculate fee
  const calculateFee = () => {
    let fee = event.entryFee;
    
    if (event.lateFeeStartDate && event.lateFee) {
      const now = new Date();
      const lateFeeStart = new Date(event.lateFeeStartDate);
      if (now >= lateFeeStart) {
        fee += event.lateFee;
      }
    }
    
    return fee;
  };

  const totalFee = calculateFee();
  const isLateFee = event.lateFeeStartDate && new Date() >= new Date(event.lateFeeStartDate);

  const handleDisciplineToggle = (discipline: Discipline) => {
    setSelectedDisciplines((prev) =>
      prev.includes(discipline)
        ? prev.filter((d) => d !== discipline)
        : [...prev, discipline]
    );
  };

  const handleCategoryToggle = (category: string) => {
    if (!event.allowMultipleCategories) {
      setSelectedCategories([category]);
    } else {
      setSelectedCategories((prev) =>
        prev.includes(category)
          ? prev.filter((c) => c !== category)
          : [...prev, category]
      );
    }
  };

  const handleSubmit = async () => {
    if (selectedDisciplines.length === 0) {
      toast.error('Please select at least one discipline');
      return;
    }

    if (selectedCategories.length === 0) {
      toast.error('Please select at least one category');
      return;
    }

    try {
      await registerForEvent(event.id, {
        disciplines: selectedDisciplines,
        categories: selectedCategories,
        ageCategory: studentInfo?.ageCategory || availableCategories[0].value,
        remarks: remarks || undefined,
      });

      setStep('success');
      toast.success('Registration successful!');
      
      if (onSuccess) {
        setTimeout(onSuccess, 2000);
      }
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    }
  };

  const handleClose = () => {
    setStep('selection');
    setSelectedDisciplines([]);
    setSelectedCategories([]);
    setRemarks('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Success State */}
          {step === 'success' ? (
            <div className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center"
              >
                <Check className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Registration Successful!
              </h2>
              <p className="text-slate-400 mb-6">
                You have successfully registered for {event.name}
              </p>
              <p className="text-sm text-slate-500">
                {event.requiresApproval
                  ? 'Your registration is pending approval.'
                  : 'Please complete the payment to confirm your registration.'}
              </p>
              <button
                onClick={handleClose}
                className="mt-6 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <Trophy className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1 pr-8">
                    <h2 className="text-xl font-bold text-white mb-1">
                      Register for Event
                    </h2>
                    <p className="text-slate-400 line-clamp-1">{event.name}</p>
                  </div>
                </div>

                {/* Event Info */}
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="w-4 h-4" />
                    {formatEventDate(event.eventDate, event.eventEndDate)}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-4 h-4" />
                    {event.venue}, {event.city}
                  </div>
                </div>

                {/* Student Info */}
                {studentInfo && (
                  <div className="mt-4 p-3 bg-slate-900/50 rounded-xl flex items-center gap-3">
                    <User className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {studentInfo.firstName} {studentInfo.lastName}
                      </p>
                      <p className="text-xs text-slate-500">
                        UID: {studentInfo.uid} • Age Category: {studentInfo.ageCategory}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[50vh] space-y-6">
                {/* Disciplines Selection */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">
                    Select Discipline(s) <span className="text-red-400">*</span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableDisciplines.map((discipline) => (
                      <button
                        key={discipline.value}
                        type="button"
                        onClick={() => handleDisciplineToggle(discipline.value)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                          selectedDisciplines.includes(discipline.value)
                            ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                            : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <span>{discipline.icon}</span>
                        <span className="text-sm font-medium">{discipline.label}</span>
                        {selectedDisciplines.includes(discipline.value) && (
                          <Check className="w-4 h-4 ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories Selection */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">
                    Select Event Category <span className="text-red-400">*</span>
                    {!event.allowMultipleCategories && (
                      <span className="text-xs text-slate-500 font-normal ml-2">
                        (Single selection only)
                      </span>
                    )}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {availableCategories.map((category) => (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => handleCategoryToggle(category.value)}
                        className={`px-4 py-2 rounded-lg border transition-all ${
                          selectedCategories.includes(category.value)
                            ? 'bg-green-500/20 border-green-500 text-green-400'
                            : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <span className="text-sm font-medium">{category.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">
                    Remarks <span className="text-slate-500">(Optional)</span>
                  </h3>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Any special requirements or notes..."
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-700 bg-slate-800/80">
                {/* Fee Breakdown */}
                <div className="mb-4 p-4 bg-slate-900/50 rounded-xl">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-slate-400">Entry Fee</span>
                    <span className="text-white">₹{event.entryFee}</span>
                  </div>
                  {isLateFee && event.lateFee && (
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-amber-400">Late Fee</span>
                      <span className="text-amber-400">+ ₹{event.lateFee}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                    <span className="font-semibold text-white">Total</span>
                    <span className="text-xl font-bold text-green-400">
                      ₹{totalFee}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading || selectedDisciplines.length === 0 || selectedCategories.length === 0}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Confirm Registration
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
