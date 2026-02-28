"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<any[]>([]);
    const [keyId, setKeyId] = useState("");
    const [keySecret, setKeySecret] = useState("");
    const [webhookSecret, setWebhookSecret] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetchSettings();
    }, []);

    async function fetchSettings() {
        try {
            const res = await fetch("/api/admin/settings");
            const data = await res.json();
            setSettings(data);

            // Set key ID to actual value (not masked)
            const keyIdSetting = data.find((s: any) => s.key === "razorpay_key_id");
            if (keyIdSetting?.value && !keyIdSetting.value.includes("•")) {
                setKeyId(keyIdSetting.value);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }

    async function handleSave() {
        setSaving(true);
        setMessage("");

        try {
            const res = await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    keyId: keyId || undefined,
                    keySecret: keySecret || undefined,
                    webhookSecret: webhookSecret || undefined
                })
            });

            const data = await res.json();

            if (data.success) {
                setMessage("✅ Settings saved successfully!");
                setKeySecret("");
                setWebhookSecret("");
                fetchSettings();
            } else {
                setMessage("❌ " + data.message);
            }
        } catch (e) {
            setMessage("❌ Failed to save settings");
        }

        setSaving(false);
    }

    const hasKeyId = settings.find(s => s.key === "razorpay_key_id")?.hasValue;
    const hasKeySecret = settings.find(s => s.key === "razorpay_key_secret")?.hasValue;
    const hasWebhookSecret = settings.find(s => s.key === "razorpay_webhook_secret")?.hasValue;

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-blue-900 text-white py-4 px-6 flex justify-between items-center">
                <h1 className="text-xl font-bold">Admin Settings</h1>
                <div className="flex gap-4">
                    <Link href="/admin/cms" className="text-sm hover:underline">CMS</Link>
                    <Link href="/" className="text-sm hover:underline">← Back to Site</Link>
                </div>
            </header>

            <main className="max-w-2xl mx-auto py-8 px-4">
                {loading ? (
                    <div className="text-center py-12">Loading...</div>
                ) : (
                    <>
                        {/* Razorpay Configuration */}
                        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center">
                                <span className="mr-2">💳</span>
                                Razorpay Configuration
                            </h2>

                            {/* Status Indicators */}
                            <div className="flex gap-4 mb-6">
                                <div className={`px-3 py-1 rounded-full text-sm ${hasKeyId ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    Key ID: {hasKeyId ? '✓ Set' : '✗ Not Set'}
                                </div>
                                <div className={`px-3 py-1 rounded-full text-sm ${hasKeySecret ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    Secret: {hasKeySecret ? '✓ Set' : '✗ Not Set'}
                                </div>
                                <div className={`px-3 py-1 rounded-full text-sm ${hasWebhookSecret ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    Webhook: {hasWebhookSecret ? '✓ Set' : '○ Optional'}
                                </div>
                            </div>

                            {/* Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Razorpay Key ID
                                    </label>
                                    <input
                                        type="text"
                                        value={keyId}
                                        onChange={(e) => setKeyId(e.target.value)}
                                        placeholder="rzp_live_xxxxxxxxxxxxx"
                                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Razorpay Key Secret
                                        {hasKeySecret && <span className="text-gray-400 ml-2">(leave blank to keep current)</span>}
                                    </label>
                                    <input
                                        type="password"
                                        value={keySecret}
                                        onChange={(e) => setKeySecret(e.target.value)}
                                        placeholder={hasKeySecret ? "••••••••••••" : "Enter secret key"}
                                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Webhook Secret
                                        <span className="text-gray-400 ml-2">(for payment confirmations)</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={webhookSecret}
                                        onChange={(e) => setWebhookSecret(e.target.value)}
                                        placeholder={hasWebhookSecret ? "••••••••••••" : "Enter webhook secret"}
                                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>

                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition disabled:opacity-50"
                                >
                                    {saving ? "Saving..." : "Save Settings"}
                                </button>

                                {message && (
                                    <div className={`p-3 rounded-lg text-center ${message.includes('✅') ? 'bg-green-100' : 'bg-red-100'}`}>
                                        {message}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Webhook URL Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-bold text-blue-800 mb-2">📌 Webhook Configuration</h3>
                            <p className="text-sm text-blue-700 mb-2">
                                Configure this webhook URL in your Razorpay Dashboard:
                            </p>
                            <code className="block bg-white p-2 rounded text-sm break-all">
                                {typeof window !== 'undefined' ? window.location.origin : ''}/api/payments/webhook
                            </code>
                            <p className="text-xs text-blue-600 mt-2">
                                Events to enable: payment.captured, payment_link.paid
                            </p>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
