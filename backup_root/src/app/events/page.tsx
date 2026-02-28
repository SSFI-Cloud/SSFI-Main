
import Link from "next/link";

async function getEvents() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    try {
        const res = await fetch(`${baseUrl}/api/events/list`, { cache: "no-store" });
        return res.ok ? await res.json() : [];
    } catch {
        return [];
    }
}

export default async function EventsPage() {
    const events = await getEvents();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-blue-900 text-white py-6">
                <div className="max-w-6xl mx-auto px-4">
                    <Link href="/" className="text-2xl font-bold">SSFI</Link>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold mb-8 text-gray-800">Upcoming Events</h1>

                {events.length === 0 ? (
                    <div className="text-center text-gray-500 py-16">
                        <p className="text-xl">No upcoming events at the moment.</p>
                        <p>Check back soon!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map((event: any) => {
                            const eventDate = new Date(event.event_date);
                            const regEnd = new Date(event.reg_end_date);
                            const now = new Date();
                            const isOpen = now < regEnd;

                            return (
                                <div key={event.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                    {/* Top: Color band */}
                                    <div className={`h-2 ${isOpen ? 'bg-green-500' : 'bg-gray-400'}`} />

                                    {/* Content */}
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold mb-2 text-gray-800">
                                            {event.event_name}
                                        </h3>
                                        <p className="text-gray-600 mb-4">
                                            📅 {eventDate.toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </p>
                                        <p className="text-gray-600 mb-4">
                                            📍 {event.venue}
                                        </p>
                                        <p className="text-gray-600 mb-4">
                                            🏛️ {event.state?.state_name || 'All India'}
                                        </p>

                                        {/* Status Badge */}
                                        <div className="flex items-center justify-between">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${isOpen
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {isOpen ? 'Registration Open' : 'Closed'}
                                            </span>
                                            <span className="font-bold text-blue-600">
                                                ₹{event.event_fees}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
