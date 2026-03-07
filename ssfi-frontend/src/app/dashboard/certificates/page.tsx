'use client';

import { useState, useEffect } from 'react';
import { Download, Award, Calendar, MapPin, RefreshCw, FileText, CheckCircle, Medal } from 'lucide-react';

interface Certificate {
  id: number;
  certificateNumber: string;
  eventId: number;
  eventName: string;
  eventDate: string;
  eventEndDate: string;
  city: string;
  venue: string;
  eventCategory: string;
  skateCategory: string;
  position: string;
  issuedAt: string;
  downloadUrl: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.ssfiskate.com/api/v1';

function positionLabel(position: string): { label: string; color: string; bg: string } {
  if (position === '1') return { label: '🥇 1st Place',  color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' };
  if (position === '2') return { label: '🥈 2nd Place',  color: 'text-slate-600',  bg: 'bg-slate-50 border-slate-200'  };
  if (position === '3') return { label: '🥉 3rd Place',  color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' };
  return                       { label: '🎽 Participant', color: 'text-emerald-700',   bg: 'bg-emerald-50 border-emerald-200'    };
}

function categoryColor(cat: string) {
  const map: Record<string, string> = {
    ADJUSTABLE:   'bg-teal-100 text-teal-700',
    PRO_INLINE:   'bg-emerald-100 text-emerald-700',
    QUAD:         'bg-green-100 text-green-700',
    RECREATIONAL: 'bg-emerald-100 text-emerald-700',
  };
  return map[cat?.toUpperCase()] || 'bg-gray-100 text-gray-600';
}

function categoryDisplayName(cat: string) {
  const map: Record<string, string> = {
    ADJUSTABLE:   'Adjustable',
    PRO_INLINE:   'Pro-Inline',
    QUAD:         'Quad',
    RECREATIONAL: 'Recreational',
  };
  return map[cat?.toUpperCase()] || cat;
}

function CertCard({
  cert,
  downloading,
  onDownload,
}: {
  cert: Certificate;
  downloading: number | null;
  onDownload: (c: Certificate) => void;
}) {
  const pos     = positionLabel(cert.position);
  const isWinner = ['1', '2', '3'].includes(cert.position);

  const startDate = new Date(cert.eventDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const endDate = cert.eventEndDate
    ? new Date(cert.eventEndDate).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : startDate;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow ${
      isWinner ? 'border-yellow-200' : 'border-gray-100'
    }`}>
      {/* Top stripe */}
      <div className={`h-1.5 w-full ${
        isWinner
          ? 'bg-gradient-to-r from-yellow-400 via-emerald-400 to-yellow-400'
          : 'bg-gradient-to-r from-emerald-500 to-teal-500'
      }`} />

      <div className="p-5">
        {/* Position + category */}
        <div className="flex items-start justify-between mb-3 gap-2">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${pos.bg} ${pos.color}`}>
            {pos.label}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${categoryColor(cert.skateCategory)}`}>
            {categoryDisplayName(cert.skateCategory)}
          </span>
        </div>

        {/* Event name */}
        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-3 line-clamp-2">
          {cert.eventName}
        </h3>

        {/* Date + Venue */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{startDate}{endDate !== startDate ? ` – ${endDate}` : ''}</span>
          </div>
          {cert.city && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{cert.venue ? `${cert.venue}, ${cert.city}` : cert.city}</span>
            </div>
          )}
        </div>

        {/* Cert number */}
        <p className="text-[10px] text-gray-400 font-mono mb-4">{cert.certificateNumber}</p>

        {/* Download button */}
        <button
          onClick={() => onDownload(cert)}
          disabled={downloading === cert.id}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition
            ${isWinner
              ? 'bg-gradient-to-r from-yellow-500 to-emerald-500 text-white hover:from-yellow-600 hover:to-emerald-600 shadow-sm'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'}
            disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {downloading === cert.id ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating PDF…
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Download Certificate
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading]           = useState(true);
  const [downloading, setDownloading]   = useState<number | null>(null);
  const [error, setError]               = useState('');

  useEffect(() => { fetchCertificates(); }, []);

  const fetchCertificates = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');
      const res   = await fetch(`${API_BASE}/certificates/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setCertificates(json.data || []);
    } catch {
      setError('Could not load certificates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (cert: Certificate) => {
    setDownloading(cert.id);
    try {
      const token = localStorage.getItem('accessToken');
      const res   = await fetch(`${API_BASE}/certificates/${cert.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob    = await res.blob();
      const url     = URL.createObjectURL(blob);
      const link    = document.createElement('a');
      link.href     = url;
      link.download = `SSFI_Certificate_${cert.certificateNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download certificate. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const winners      = certificates.filter(c => ['1','2','3'].includes(c.position));
  const participants = certificates.filter(c => !['1','2','3'].includes(c.position));

  return (
    <div className="space-y-8">

      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-7 h-7 text-emerald-600" />
            My Certificates
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Download your official SSFI participation &amp; achievement certificates
          </p>
        </div>
        <button
          onClick={fetchCertificates}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* ── Stats ────────────────────────────────────────────────── */}
      {!loading && certificates.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Certificates', value: certificates.length, Icon: FileText,    bg: 'bg-emerald-50',   ic: 'text-emerald-600'   },
            { label: 'Podium Finishes',    value: winners.length,      Icon: Medal,       bg: 'bg-yellow-50', ic: 'text-yellow-600' },
            { label: 'Participations',     value: participants.length, Icon: CheckCircle, bg: 'bg-green-50',  ic: 'text-green-600'  },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
              <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                <stat.Icon className={`w-5 h-5 ${stat.ic}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Loading ──────────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading your certificates…</p>
          </div>
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* ── Empty ────────────────────────────────────────────────── */}
      {!loading && !error && certificates.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Award className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Certificates Yet</h3>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            Certificates are issued automatically once event results are published.
            Participate in events to earn yours!
          </p>
        </div>
      )}

      {/* ── Winners ──────────────────────────────────────────────── */}
      {!loading && winners.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Medal className="w-4 h-4 text-yellow-500" />
            Podium Finishes
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {winners.map(cert => (
              <CertCard key={cert.id} cert={cert} downloading={downloading} onDownload={handleDownload} />
            ))}
          </div>
        </section>
      )}

      {/* ── Participation certs ──────────────────────────────────── */}
      {!loading && participants.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            Participation Certificates
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {participants.map(cert => (
              <CertCard key={cert.id} cert={cert} downloading={downloading} onDownload={handleDownload} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
