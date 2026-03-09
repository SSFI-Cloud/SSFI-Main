'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    User,
    Users,
    Shield,
    MapPin,
    FileText,
    CheckCircle,
    AlertCircle,
    Loader2,
    School,
    Heart
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';

const STEPS = [
    { number: 1, title: 'Personal Info', icon: User },
    { number: 2, title: 'Family & School', icon: School },
    { number: 3, title: 'Nominee', icon: Heart },
    { number: 4, title: 'Club & Coach', icon: Shield },
    { number: 5, title: 'Address', icon: MapPin },
    { number: 6, title: 'Documents', icon: FileText },
];

export default function StudentRegistrationWizard() {
    const router = useRouter();
    const { token } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        // Step 1
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
        bloodGroup: '',
        email: '',
        phone: '',
        // Step 2
        fatherName: '',
        motherName: '',
        schoolName: '',
        academicBoard: 'STATE' as 'STATE' | 'CBSE' | 'ICSE' | 'OTHER',
        className: '',
        // Step 3
        nomineeName: '',
        nomineeAge: 18,
        nomineeRelation: 'FATHER' as 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER',
        nomineePhone: '',
        // Step 4
        clubId: '',
        coachName: '',
        coachPhone: '',
        coachEmail: '',
        // Step 5
        addressLine1: '',
        addressLine2: '',
        city: '',
        stateId: '',
        districtId: '',
        pincode: '',
        // Step 6
        aadhaarNumber: '',
        kycVerified: false,
        kycVerifiedName: '',
        kycVerifiedDob: '',
        kycVerifiedGender: '',
        kycProfileImage: '',
        profilePhoto: '',
        birthCertificate: '',
        termsAccepted: false,
    });

    const [clubs, setClubs] = useState<any[]>([]);
    const [states, setStates] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);

    useEffect(() => {
        if (!token) return;

        const fetchData = async () => {
            try {
                const [clubsRes, statesRes] = await Promise.all([
                    api.get('/clubs'),
                    api.get('/states')
                ]);

                if (clubsRes.data.status === 'success') setClubs(clubsRes.data.data.clubs || []);
                if (statesRes.data.status === 'success') setStates(statesRes.data.data || []);
            } catch (err) {
                console.error('Failed to fetch data', err);
            }
        };
        fetchData();
    }, [token]);

    useEffect(() => {
        if (!formData.stateId || !token) return;

        const fetchDistricts = async () => {
            try {
                const res = await api.get('/districts', { params: { stateId: formData.stateId } });
                if (res.data.status === 'success') setDistricts(res.data.data || []);
            } catch (err) {
                console.error('Failed to fetch districts', err);
            }
        };
        fetchDistricts();
    }, [formData.stateId, token]);

    const handleNext = () => {
        if (currentStep < 6) setCurrentStep(prev => prev + 1);
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await api.post('/students', {
                ...formData,
                clubId: Number(formData.clubId),
                stateId: Number(formData.stateId),
                districtId: Number(formData.districtId),
            });

            setSuccess(true);
            setTimeout(() => router.push('/dashboard/students'), 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create student');
        } finally {
            setIsLoading(false);
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/dashboard/students"
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Student Registration</h1>
                    <p className="text-gray-500">Complete all steps to register a new skater</p>
                </div>
            </div>

            {/* Progress Stepper */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    {STEPS.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = currentStep === step.number;
                        const isCompleted = currentStep > step.number;

                        return (
                            <div key={step.number} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-1">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${isCompleted
                                                ? 'bg-green-500 text-white'
                                                : isActive
                                                    ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20'
                                                    : 'bg-gray-100 text-gray-500'
                                            }`}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle className="w-5 h-5" />
                                        ) : (
                                            <Icon className="w-5 h-5" />
                                        )}
                                    </div>
                                    <span
                                        className={`text-xs mt-2 font-medium ${isActive ? 'text-emerald-600' : isCompleted ? 'text-green-600' : 'text-gray-600'
                                            }`}
                                    >
                                        {step.title}
                                    </span>
                                </div>
                                {index < STEPS.length - 1 && (
                                    <div
                                        className={`flex-1 h-1 mx-2 rounded ${isCompleted ? 'bg-green-500' : 'bg-gray-100'
                                            }`}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Messages */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-6 p-4 bg-red-100 border border-red-500/20 rounded-xl text-red-600 flex items-center gap-3"
                    >
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        {error}
                    </motion.div>
                )}
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-green-100 border border-green-500/20 rounded-xl text-green-600 flex items-center gap-3"
                    >
                        <CheckCircle className="w-5 h-5" />
                        Student registered successfully! Redirecting...
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        {currentStep === 1 && (
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">First Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.firstName}
                                            onChange={(e) => updateField('firstName', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Last Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.lastName}
                                            onChange={(e) => updateField('lastName', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Date of Birth *</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.dateOfBirth}
                                            onChange={(e) => updateField('dateOfBirth', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Gender *</label>
                                        <select
                                            required
                                            value={formData.gender}
                                            onChange={(e) => updateField('gender', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        >
                                            <option value="MALE">Male</option>
                                            <option value="FEMALE">Female</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Blood Group *</label>
                                        <select
                                            required
                                            value={formData.bloodGroup}
                                            onChange={(e) => updateField('bloodGroup', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        >
                                            <option value="">Select</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Phone *</label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.phone}
                                            onChange={(e) => updateField('phone', e.target.value)}
                                            maxLength={10}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => updateField('email', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Family & School</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Father's Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.fatherName}
                                            onChange={(e) => updateField('fatherName', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Mother's Name</label>
                                        <input
                                            type="text"
                                            value={formData.motherName}
                                            onChange={(e) => updateField('motherName', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">School Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.schoolName}
                                            onChange={(e) => updateField('schoolName', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Academic Board *</label>
                                        <select
                                            required
                                            value={formData.academicBoard}
                                            onChange={(e) => updateField('academicBoard', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        >
                                            <option value="STATE">State Board</option>
                                            <option value="CBSE">CBSE</option>
                                            <option value="ICSE">ICSE</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Class *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.className}
                                            onChange={(e) => updateField('className', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Nominee Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Nominee Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.nomineeName}
                                            onChange={(e) => updateField('nomineeName', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Nominee Age *</label>
                                        <input
                                            type="number"
                                            required
                                            min={18}
                                            value={formData.nomineeAge}
                                            onChange={(e) => updateField('nomineeAge', Number(e.target.value))}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Relation *</label>
                                        <select
                                            required
                                            value={formData.nomineeRelation}
                                            onChange={(e) => updateField('nomineeRelation', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        >
                                            <option value="FATHER">Father</option>
                                            <option value="MOTHER">Mother</option>
                                            <option value="GUARDIAN">Guardian</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Nominee Phone</label>
                                        <input
                                            type="tel"
                                            value={formData.nomineePhone}
                                            onChange={(e) => updateField('nomineePhone', e.target.value)}
                                            maxLength={10}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Club & Coach</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Club *</label>
                                        <select
                                            required
                                            value={formData.clubId}
                                            onChange={(e) => updateField('clubId', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        >
                                            <option value="">Select Club</option>
                                            {clubs.map((club) => (
                                                <option key={club.id} value={club.id}>
                                                    {club.name || club.club_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Coach Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.coachName}
                                            onChange={(e) => updateField('coachName', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Coach Phone *</label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.coachPhone}
                                            onChange={(e) => updateField('coachPhone', e.target.value)}
                                            maxLength={10}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Coach Email</label>
                                        <input
                                            type="email"
                                            value={formData.coachEmail}
                                            onChange={(e) => updateField('coachEmail', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 5 && (
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Address</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Address Line 1 *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.addressLine1}
                                            onChange={(e) => updateField('addressLine1', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Address Line 2</label>
                                        <input
                                            type="text"
                                            value={formData.addressLine2}
                                            onChange={(e) => updateField('addressLine2', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">City *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.city}
                                            onChange={(e) => updateField('city', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Pincode *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.pincode}
                                            onChange={(e) => updateField('pincode', e.target.value)}
                                            maxLength={6}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">State *</label>
                                        <select
                                            required
                                            value={formData.stateId}
                                            onChange={(e) => {
                                                updateField('stateId', e.target.value);
                                                updateField('districtId', '');
                                            }}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        >
                                            <option value="">Select State</option>
                                            {states.map((state) => (
                                                <option key={state.id} value={state.id}>
                                                    {state.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">District *</label>
                                        <select
                                            required
                                            value={formData.districtId}
                                            onChange={(e) => updateField('districtId', e.target.value)}
                                            disabled={!formData.stateId}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
                                        >
                                            <option value="">Select District</option>
                                            {districts.map((district) => (
                                                <option key={district.id} value={district.id}>
                                                    {district.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 6 && (
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Documents</h2>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Aadhaar Number *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.aadhaarNumber}
                                            onChange={(e) => updateField('aadhaarNumber', e.target.value)}
                                            maxLength={12}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                    <div className="pt-4 border-t border-gray-200">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                required
                                                checked={formData.termsAccepted}
                                                onChange={(e) => updateField('termsAccepted', e.target.checked)}
                                                className="w-5 h-5 rounded border-gray-200 text-emerald-500 focus:ring-emerald-500/50"
                                            />
                                            <span className="text-gray-700">
                                                I confirm all information is accurate and accept the terms *
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
                    {currentStep > 1 && (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                    )}
                    {currentStep < 6 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="flex-1 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium flex items-center justify-center gap-2"
                        >
                            Next
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={isLoading || !formData.termsAccepted}
                            className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Complete Registration
                                </>
                            )}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
