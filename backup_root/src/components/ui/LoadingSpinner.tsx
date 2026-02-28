interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    color?: "primary" | "white" | "gray";
}

export default function LoadingSpinner({
    size = "md",
    color = "primary",
}: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-8 h-8",
        lg: "w-12 h-12",
    };

    const colorClasses = {
        primary: "text-[#003399]",
        white: "text-white",
        gray: "text-gray-400",
    };

    return (
        <div className="flex items-center justify-center">
            <svg
                className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                />
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
            </svg>
        </div>
    );
}

// Skeleton Loader for Cards
export function SkeletonCard() {
    return (
        <div className="bg-white rounded-lg p-6 shadow-md animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
    );
}

// Skeleton for Table Rows
export function SkeletonTableRow({ columns = 4 }: { columns?: number }) {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                </td>
            ))}
        </tr>
    );
}

// Full Page Loading
export function PageLoader() {
    return (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
            <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600 font-medium">Loading...</p>
            </div>
        </div>
    );
}
