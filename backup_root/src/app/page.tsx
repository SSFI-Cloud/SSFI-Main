
import Link from "next/link";

// Server Component - fetches data at build/request time
async function getHomeData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  try {
    const [slidersRes, tickerRes, sponsorsRes] = await Promise.all([
      fetch(`${baseUrl}/api/cms/sliders`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/cms/news-ticker`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/cms/sponsors`, { cache: "no-store" })
    ]);

    return {
      sliders: slidersRes.ok ? await slidersRes.json() : [],
      ticker: tickerRes.ok ? await tickerRes.json() : [],
      sponsors: sponsorsRes.ok ? await sponsorsRes.json() : []
    };
  } catch (e) {
    return { sliders: [], ticker: [], sponsors: [] };
  }
}

export default async function Home() {
  const { sliders, ticker, sponsors } = await getHomeData();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[70vh] bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Skating Sports Federation of India
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Empowering the Future of Indian Skating
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/events"
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Register for Events
            </Link>
            <Link
              href="/rankings"
              className="border-2 border-white hover:bg-white hover:text-blue-900 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              View Rankings
            </Link>
          </div>
        </div>
      </section>

      {/* News Ticker */}
      {ticker.length > 0 && (
        <div className="bg-yellow-400 text-black py-2 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap">
            {ticker.map((item: any, i: number) => (
              <span key={i} className="mx-8 font-medium">
                📢 {item.message}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Why Join SSFI */}
      <section className="py-16 px-4 bg-gray-50">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
          Why Join SSFI?
        </h2>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <div className="text-5xl mb-4">🪪</div>
            <h3 className="text-xl font-bold mb-2">Official ID Card</h3>
            <p className="text-gray-600">Get your official SSFI membership card with unique ID</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <div className="text-5xl mb-4">🏆</div>
            <h3 className="text-xl font-bold mb-2">National Recognition</h3>
            <p className="text-gray-600">Compete in state and national level championships</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <div className="text-5xl mb-4">🛡️</div>
            <h3 className="text-xl font-bold mb-2">Insurance Cover</h3>
            <p className="text-gray-600">Accident insurance coverage for registered skaters</p>
          </div>
        </div>
      </section>

      {/* Stats Counter */}
      <section className="py-16 px-4 bg-blue-900 text-white">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl md:text-5xl font-bold">28</div>
            <div className="text-lg opacity-80">States</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold">700+</div>
            <div className="text-lg opacity-80">Districts</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold">500+</div>
            <div className="text-lg opacity-80">Clubs</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold">10,000+</div>
            <div className="text-lg opacity-80">Skaters</div>
          </div>
        </div>
      </section>

      {/* Sponsors */}
      {sponsors.length > 0 && (
        <section className="py-16 px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Our Sponsors
          </h2>
          <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-8">
            {sponsors.map((sponsor: any) => (
              <a
                key={sponsor.id}
                href={sponsor.website_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="grayscale hover:grayscale-0 transition-all"
              >
                <img
                  src={sponsor.logo_url}
                  alt={sponsor.name}
                  className="h-16 object-contain"
                />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 text-center">
        <p>© 2026 Skating Sports Federation of India. All rights reserved.</p>
      </footer>
    </div>
  );
}
