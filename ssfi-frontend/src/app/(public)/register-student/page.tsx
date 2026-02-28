'use client';

import RegistrationGuard from '@/components/auth/RegistrationGuard';
import StudentRegistrationForm from '@/components/forms/StudentRegistrationForm';

export default function RegisterStudentPage() {
    return (
        <RegistrationGuard type="student">
            <main className="min-h-screen bg-dark-950 py-8">
                <div className="container mx-auto px-4">
                    <StudentRegistrationForm />
                </div>
            </main>
        </RegistrationGuard>
    );
}
