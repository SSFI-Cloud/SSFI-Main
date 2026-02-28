"use client";

import { useState, useId } from "react";

interface FloatingInputProps {
    label: string;
    type?: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
    error?: string;
    success?: boolean;
    placeholder?: string;
    disabled?: boolean;
    autoComplete?: string;
}

export default function FloatingInput({
    label,
    type = "text",
    name,
    value,
    onChange,
    required = false,
    error,
    success,
    placeholder,
    disabled = false,
    autoComplete,
}: FloatingInputProps) {
    const [isFocused, setIsFocused] = useState(false);
    const id = useId();

    const isActive = isFocused || value.length > 0;

    return (
        <div className="relative w-full">
            <input
                id={id}
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                required={required}
                disabled={disabled}
                autoComplete={autoComplete}
                placeholder={isActive ? placeholder : ""}
                className={`
                    peer w-full px-4 pt-6 pb-2 text-base
                    border rounded-lg transition-all duration-200
                    bg-white
                    ${error ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""}
                    ${success ? "border-green-500 focus:border-green-500 focus:ring-green-100" : ""}
                    ${!error && !success ? "border-gray-300 focus:border-[#003399] focus:ring-blue-100" : ""}
                    focus:outline-none focus:ring-2
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                `}
            />

            {/* Floating Label */}
            <label
                htmlFor={id}
                className={`
                    absolute left-4 transition-all duration-200 pointer-events-none
                    ${isActive ? "top-2 text-xs font-medium" : "top-1/2 -translate-y-1/2 text-base"}
                    ${isFocused ? "text-[#003399]" : "text-gray-500"}
                    ${error ? "text-red-500" : ""}
                    ${success ? "text-green-600" : ""}
                `}
            >
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {/* Validation Icons */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {success && (
                    <svg
                        className="w-5 h-5 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                )}
                {error && (
                    <svg
                        className="w-5 h-5 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                        />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
}
