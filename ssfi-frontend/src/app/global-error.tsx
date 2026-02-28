'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4">
                    <h2 className="text-4xl font-bold mb-4">Something went wrong!</h2>
                    <button
                        onClick={() => reset()}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
