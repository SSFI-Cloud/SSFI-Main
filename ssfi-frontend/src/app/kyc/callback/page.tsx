'use client';

import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

/**
 * Digilocker Callback Page
 * User is redirected here after completing Digilocker authentication.
 * This page just shows a "success" message and closes the popup.
 * The parent window polls the status endpoint to get the actual result.
 */
export default function KycCallbackPage() {
  useEffect(() => {
    // Attempt to close this popup after a short delay
    const timer = setTimeout(() => {
      try {
        window.close();
      } catch {
        // Browser may block window.close() if not opened by script
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900 mb-2">
          Digilocker Authentication Complete
        </h1>
        <p className="text-sm text-gray-500">
          This window will close automatically. If it doesn&apos;t, you can close it manually and return to the registration form.
        </p>
      </div>
    </div>
  );
}
