'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api/client';
import Image from 'next/image';

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  type: 'hero' | 'team' | 'news';
  label?: string;
  hint?: string;
}

const DIMENSIONS: Record<string, string> = {
  hero: '1920 × 1080 (auto-cropped)',
  team: '480 × 600 portrait (top-crop)',
  news: '1200 × 630 (auto-cropped)',
};

export default function ImageUpload({ value, onChange, type, label, hint }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await apiClient.post(`/upload/image?type=${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(res.data.data.url);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1').replace('/api/v1', '');

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-slate-300">{label}</label>}

      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
          <div className={`relative w-full ${type === 'team' ? 'aspect-[4/5]' : 'aspect-video'} max-h-64`}>
            <Image
              src={value.startsWith('http') ? value : `${API_BASE}${value}`}
              alt="Uploaded"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-1.5">
            <p className="text-xs text-white/70 truncate">{value.split('/').pop()}</p>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={`flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors min-h-[120px]
            ${dragOver ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/50'}`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
              <p className="text-sm text-slate-400">Processing image…</p>
            </>
          ) : (
            <>
              <div className="p-3 bg-slate-800 rounded-xl">
                <Upload className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-300">Click or drag image here</p>
                <p className="text-xs text-slate-500 mt-1">Converted to WebP • {DIMENSIONS[type]}</p>
                {hint && <p className="text-xs text-slate-600 mt-0.5">{hint}</p>}
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />
    </div>
  );
}
