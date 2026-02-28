"use client";

import { useState, useCallback, useRef } from "react";

interface FileDropzoneProps {
    label: string;
    accept?: string;
    maxSize?: number; // in MB
    onFileSelect: (file: File | null) => void;
    error?: string;
    preview?: string | null;
    required?: boolean;
}

export default function FileDropzone({
    label,
    accept = "image/*",
    maxSize = 5,
    onFileSelect,
    error,
    preview,
    required = false,
}: FileDropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const validateFile = (file: File): boolean => {
        // Check file size
        if (file.size > maxSize * 1024 * 1024) {
            setLocalError(`File size must be less than ${maxSize}MB`);
            return false;
        }

        // Check file type
        if (accept !== "*" && !file.type.match(accept.replace("*", ".*"))) {
            setLocalError("Invalid file type");
            return false;
        }

        setLocalError(null);
        return true;
    };

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);

            const file = e.dataTransfer.files[0];
            if (file && validateFile(file)) {
                setFileName(file.name);
                onFileSelect(file);
            }
        },
        [onFileSelect, maxSize, accept]
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && validateFile(file)) {
            setFileName(file.name);
            onFileSelect(file);
        }
    };

    const handleRemove = () => {
        setFileName(null);
        onFileSelect(null);
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    const displayError = error || localError;

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`
                    relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                    transition-all duration-200
                    ${isDragging ? "border-[#003399] bg-blue-50" : "border-gray-300 hover:border-gray-400"}
                    ${displayError ? "border-red-500 bg-red-50" : ""}
                    ${preview ? "border-green-500 bg-green-50" : ""}
                `}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    onChange={handleFileChange}
                    className="hidden"
                />

                {preview ? (
                    <div className="relative">
                        <img
                            src={preview}
                            alt="Preview"
                            className="max-h-40 mx-auto rounded-lg object-contain"
                        />
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemove();
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                            <svg
                                className="w-4 h-4"
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
                        </button>
                        <p className="mt-2 text-sm text-green-600 font-medium">
                            {fileName}
                        </p>
                    </div>
                ) : (
                    <>
                        <svg
                            className={`w-12 h-12 mx-auto mb-3 ${isDragging ? "text-[#003399]" : "text-gray-400"}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                        <p className="text-gray-600">
                            <span className="font-semibold text-[#003399]">
                                Click to upload
                            </span>{" "}
                            or drag and drop
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            {accept === "image/*"
                                ? "PNG, JPG, GIF"
                                : accept.toUpperCase()}{" "}
                            up to {maxSize}MB
                        </p>
                    </>
                )}
            </div>

            {displayError && (
                <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
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
                    {displayError}
                </p>
            )}
        </div>
    );
}
