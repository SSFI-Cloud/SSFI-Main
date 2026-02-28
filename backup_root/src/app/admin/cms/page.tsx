"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CMSDashboard() {
    const [activeTab, setActiveTab] = useState("sliders");
    const [sliders, setSliders] = useState<any[]>([]);
    const [ticker, setTicker] = useState<any[]>([]);
    const [sponsors, setSponsors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [sliderForm, setSliderForm] = useState({ imageUrl: "", caption: "", linkUrl: "" });
    const [tickerForm, setTickerForm] = useState({ message: "" });
    const [sponsorForm, setSponsorForm] = useState({ name: "", logoUrl: "", websiteUrl: "" });

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const [s, t, sp] = await Promise.all([
                fetch("/api/cms/sliders").then(r => r.json()),
                fetch("/api/cms/news-ticker").then(r => r.json()),
                fetch("/api/cms/sponsors").then(r => r.json())
            ]);
            setSliders(s);
            setTicker(t);
            setSponsors(sp);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }

    async function addSlider(e: React.FormEvent) {
        e.preventDefault();
        await fetch("/api/cms/sliders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sliderForm)
        });
        setSliderForm({ imageUrl: "", caption: "", linkUrl: "" });
        fetchData();
    }

    async function addTicker(e: React.FormEvent) {
        e.preventDefault();
        await fetch("/api/cms/news-ticker", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tickerForm)
        });
        setTickerForm({ message: "" });
        fetchData();
    }

    async function addSponsor(e: React.FormEvent) {
        e.preventDefault();
        await fetch("/api/cms/sponsors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sponsorForm)
        });
        setSponsorForm({ name: "", logoUrl: "", websiteUrl: "" });
        fetchData();
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-blue-900 text-white py-4 px-6 flex justify-between items-center">
                <h1 className="text-xl font-bold">CMS Dashboard</h1>
                <div className="flex gap-4">
                    <Link href="/admin/settings" className="text-sm hover:underline">⚙️ Settings</Link>
                    <Link href="/" className="text-sm hover:underline">← Back to Site</Link>
                </div>
            </header>


            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 bg-white shadow-md min-h-screen p-4">
                    <nav className="space-y-2">
                        {["sliders", "ticker", "sponsors"].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`w-full text-left px-4 py-2 rounded-lg transition ${activeTab === tab
                                    ? "bg-blue-100 text-blue-800 font-medium"
                                    : "hover:bg-gray-100"
                                    }`}
                            >
                                {tab === "sliders" && "🖼️ Hero Sliders"}
                                {tab === "ticker" && "📢 News Ticker"}
                                {tab === "sponsors" && "🤝 Sponsors"}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6">
                    {loading ? (
                        <div className="text-center py-12">Loading...</div>
                    ) : (
                        <>
                            {/* Sliders */}
                            {activeTab === "sliders" && (
                                <div>
                                    <h2 className="text-2xl font-bold mb-6">Hero Sliders</h2>
                                    <form onSubmit={addSlider} className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4">
                                        <input
                                            type="text"
                                            placeholder="Image URL"
                                            value={sliderForm.imageUrl}
                                            onChange={e => setSliderForm({ ...sliderForm, imageUrl: e.target.value })}
                                            className="flex-1 border rounded px-3 py-2"
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Caption"
                                            value={sliderForm.caption}
                                            onChange={e => setSliderForm({ ...sliderForm, caption: e.target.value })}
                                            className="flex-1 border rounded px-3 py-2"
                                        />
                                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                                            Add Slider
                                        </button>
                                    </form>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {sliders.map((s: any) => (
                                            <div key={s.id} className="bg-white p-4 rounded-lg shadow">
                                                <img src={s.image_url} alt={s.caption} className="w-full h-32 object-cover rounded mb-2" />
                                                <p className="text-gray-700">{s.caption || "No caption"}</p>
                                            </div>
                                        ))}
                                        {sliders.length === 0 && <p className="text-gray-500">No sliders yet.</p>}
                                    </div>
                                </div>
                            )}

                            {/* Ticker */}
                            {activeTab === "ticker" && (
                                <div>
                                    <h2 className="text-2xl font-bold mb-6">News Ticker</h2>
                                    <form onSubmit={addTicker} className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4">
                                        <input
                                            type="text"
                                            placeholder="Ticker message..."
                                            value={tickerForm.message}
                                            onChange={e => setTickerForm({ ...tickerForm, message: e.target.value })}
                                            className="flex-1 border rounded px-3 py-2"
                                            required
                                        />
                                        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                            Add Message
                                        </button>
                                    </form>
                                    <ul className="space-y-2">
                                        {ticker.map((t: any) => (
                                            <li key={t.id} className="bg-white p-3 rounded-lg shadow flex items-center">
                                                <span className="mr-2">📢</span>
                                                <span>{t.message}</span>
                                            </li>
                                        ))}
                                        {ticker.length === 0 && <p className="text-gray-500">No messages yet.</p>}
                                    </ul>
                                </div>
                            )}

                            {/* Sponsors */}
                            {activeTab === "sponsors" && (
                                <div>
                                    <h2 className="text-2xl font-bold mb-6">Sponsors</h2>
                                    <form onSubmit={addSponsor} className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4 flex-wrap">
                                        <input
                                            type="text"
                                            placeholder="Sponsor Name"
                                            value={sponsorForm.name}
                                            onChange={e => setSponsorForm({ ...sponsorForm, name: e.target.value })}
                                            className="flex-1 border rounded px-3 py-2"
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Logo URL"
                                            value={sponsorForm.logoUrl}
                                            onChange={e => setSponsorForm({ ...sponsorForm, logoUrl: e.target.value })}
                                            className="flex-1 border rounded px-3 py-2"
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Website URL"
                                            value={sponsorForm.websiteUrl}
                                            onChange={e => setSponsorForm({ ...sponsorForm, websiteUrl: e.target.value })}
                                            className="flex-1 border rounded px-3 py-2"
                                        />
                                        <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                                            Add Sponsor
                                        </button>
                                    </form>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {sponsors.map((s: any) => (
                                            <div key={s.id} className="bg-white p-4 rounded-lg shadow text-center">
                                                <img src={s.logo_url} alt={s.name} className="h-16 mx-auto object-contain mb-2" />
                                                <p className="text-sm font-medium">{s.name}</p>
                                            </div>
                                        ))}
                                        {sponsors.length === 0 && <p className="text-gray-500">No sponsors yet.</p>}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
