'use client';

import RegistrationGuard from '@/components/auth/RegistrationGuard';
import StateSecretaryRegistrationForm from '@/components/forms/affiliation/StateSecretaryForm';

export default function StateSecretaryPage() {
    return (
        <RegistrationGuard type="state">
            <StateSecretaryRegistrationForm />
        </RegistrationGuard>
    );
}
