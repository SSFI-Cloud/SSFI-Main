'use client';

import RegistrationGuard from '@/components/auth/RegistrationGuard';
import DistrictSecretaryRegistrationForm from '@/components/forms/affiliation/DistrictSecretaryForm';

export default function DistrictSecretaryPage() {
    return (
        <RegistrationGuard type="district">
            <DistrictSecretaryRegistrationForm />
        </RegistrationGuard>
    );
}
