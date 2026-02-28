'use client';

import RegistrationGuard from '@/components/auth/RegistrationGuard';
import ClubRegistrationForm from '@/components/forms/affiliation/ClubRegistrationForm';

export default function ClubRegistrationPage() {
    return (
        <RegistrationGuard type="club">
            <ClubRegistrationForm />
        </RegistrationGuard>
    );
}
