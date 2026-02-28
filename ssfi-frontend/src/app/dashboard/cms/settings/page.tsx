'use client';

import { useState, useEffect } from 'react';
import {
  Save, Globe, Mail, Phone, MapPin, Facebook, Instagram,
  Youtube, Linkedin, AlertTriangle, Loader2, Clock, Plus,
  Trash2, Building2, Twitter
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSiteSettings } from '@/lib/hooks/useCMS';
import { SiteSettings } from '@/types/cms';

interface Department {
  name: string;
  email: string;
  phone: string;
}

interface ExtendedMeta {
  departments?: Department[];
  officeHours?: { weekdays?: string; saturday?: string };
  mapEmbedUrl?: string;
  phone2?: string;
}

export default function SettingsPage() {
  const { fetchSettings, updateSettings, isLoading } = useSiteSettings();
  const [settings, setSettings] = useState<SiteSettings & { metadata?: ExtendedMeta }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    const data = await fetchSettings();
    if (data) setSettings(data);
  };

  const meta: ExtendedMeta = (settings as any).metadata || {};
  const setMeta = (update: Partial<ExtendedMeta>) => {
    setSettings(s => ({ ...s, metadata: { ...meta, ...update } }));
  };

  const departments: Department[] = meta.departments || [];
  const addDept = () => setMeta({ departments: [...departments, { name: '', email: '', phone: '' }] });
  const removeDept = (i: number) => setMeta({ departments: departments.filter((_, idx) => idx !== i) });
  const updateDept = (i: number, field: keyof Department, value: string) => {
    const updated = [...departments];
    updated[i] = { ...updated[i], [field]: value };
    setMeta({ departments: updated });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings(settings as SiteSettings);
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally { setIsSaving(false); }
  };

  if (isLoading && !settings.siteName) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  const inputClass = "w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-gray-500 text-sm";
  const labelClass = "text-sm font-medium text-gray-700";
  const sectionClass = "bg-white p-6 rounded-xl border border-gray-200 space-y-5";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Site Settings</h2>
        <p className="text-gray-500 text-sm mt-1">Configure global info, contact details, and social links</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">

        {/* General Info */}
        <div className={sectionClass}>
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <Globe className="w-5 h-5 text-gray-900" />
            <h3 className="text-base font-semibold text-gray-900">General Information</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className={labelClass}>Site Name</label>
              <input value={settings.siteName || ''} onChange={e => setSettings({ ...settings, siteName: e.target.value })} className={inputClass} placeholder="Speed Skating Federation of India" />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Tagline</label>
              <input value={settings.siteTagline || ''} onChange={e => setSettings({ ...settings, siteTagline: e.target.value })} className={inputClass} placeholder="Promoting skating excellence across India" />
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className={sectionClass}>
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <Phone className="w-5 h-5 text-gray-900" />
            <h3 className="text-base font-semibold text-gray-900">Contact Details</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className={labelClass}>Primary Email</label>
              <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input type="email" value={settings.contactEmail || ''} onChange={e => setSettings({ ...settings, contactEmail: e.target.value })} className={`${inputClass} pl-9`} placeholder="info@ssfiskate.com" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Primary Phone</label>
              <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input value={settings.contactPhone || ''} onChange={e => setSettings({ ...settings, contactPhone: e.target.value })} className={`${inputClass} pl-9`} placeholder="+91 98000 00000" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Secondary Phone</label>
              <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input value={meta.phone2 || ''} onChange={e => setMeta({ phone2: e.target.value })} className={`${inputClass} pl-9`} placeholder="+91 98000 00001" />
              </div>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className={labelClass}>Address</label>
              <div className="relative"><MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-600" />
                <textarea rows={2} value={settings.address || ''} onChange={e => setSettings({ ...settings, address: e.target.value })} className={`${inputClass} pl-9 resize-none`} placeholder="123, Skating Complex, New Delhi – 110001" />
              </div>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className={labelClass}>Google Maps Embed URL</label>
              <input value={meta.mapEmbedUrl || ''} onChange={e => setMeta({ mapEmbedUrl: e.target.value })} className={inputClass} placeholder="https://www.google.com/maps/embed?pb=..." />
              <p className="text-xs text-gray-600">Go to Google Maps → Share → Embed a map → copy the src URL</p>
            </div>
          </div>
        </div>

        {/* Office Hours */}
        <div className={sectionClass}>
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <Clock className="w-5 h-5 text-gray-900" />
            <h3 className="text-base font-semibold text-gray-900">Office Hours</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className={labelClass}>Monday – Friday</label>
              <input value={meta.officeHours?.weekdays || ''} onChange={e => setMeta({ officeHours: { ...meta.officeHours, weekdays: e.target.value } })} className={inputClass} placeholder="9:00 AM – 5:00 PM" />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Saturday</label>
              <input value={meta.officeHours?.saturday || ''} onChange={e => setMeta({ officeHours: { ...meta.officeHours, saturday: e.target.value } })} className={inputClass} placeholder="10:00 AM – 2:00 PM" />
            </div>
          </div>
        </div>

        {/* Departments */}
        <div className={sectionClass}>
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-gray-900" />
              <h3 className="text-base font-semibold text-gray-900">Departments</h3>
            </div>
            <button type="button" onClick={addDept}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Dept
            </button>
          </div>
          {departments.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-4">No departments added yet. Click "Add Dept" above.</p>
          ) : (
            <div className="space-y-3">
              {departments.map((dept, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-center">
                  <input value={dept.name} onChange={e => updateDept(i, 'name', e.target.value)} className={inputClass} placeholder="Dept Name" />
                  <input value={dept.email} onChange={e => updateDept(i, 'email', e.target.value)} className={inputClass} placeholder="dept@ssfiskate.com" />
                  <input value={dept.phone} onChange={e => updateDept(i, 'phone', e.target.value)} className={inputClass} placeholder="+91 ..." />
                  <button type="button" onClick={() => removeDept(i)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Social Links */}
        <div className={sectionClass}>
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <Facebook className="w-5 h-5 text-blue-500" />
            <h3 className="text-base font-semibold text-gray-900">Social Media</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { key: 'facebook', label: 'Facebook', Icon: Facebook, color: 'text-blue-500', placeholder: 'https://facebook.com/ssfi' },
              { key: 'twitter', label: 'Twitter / X', Icon: Twitter, color: 'text-sky-700', placeholder: 'https://twitter.com/ssfi' },
              { key: 'instagram', label: 'Instagram', Icon: Instagram, color: 'text-pink-500', placeholder: 'https://instagram.com/ssfi' },
              { key: 'youtube', label: 'YouTube', Icon: Youtube, color: 'text-red-500', placeholder: 'https://youtube.com/@ssfi' },
              { key: 'linkedin', label: 'LinkedIn', Icon: Linkedin, color: 'text-blue-600', placeholder: 'https://linkedin.com/company/ssfi' },
            ].map(({ key, label, Icon, color, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <label className={labelClass}>{label}</label>
                <div className="relative">
                  <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${color}`} />
                  <input value={(settings.socialLinks as any)?.[key] || ''}
                    onChange={e => setSettings({ ...settings, socialLinks: { ...settings.socialLinks as any, [key]: e.target.value } })}
                    className={`${inputClass} pl-9`} placeholder={placeholder} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50">
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save All Settings
          </button>
        </div>
      </form>
    </div>
  );
}
