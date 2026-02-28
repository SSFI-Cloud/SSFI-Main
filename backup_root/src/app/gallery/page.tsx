
import Link from "next/link";

async function getGallery() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    try {
        const res = await fetch(`${baseUrl}/api/cms/gallery`, { cache: "no-store" });
        return res.ok ? await res.json() : [];
    } catch {
        return [];
    }
}

export default async function GalleryPage() {
    const albums = await getGallery();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-blue-900 text-white py-6">
                <div className="max-w-6xl mx-auto px-4">
                    <Link href="/" className="text-2xl font-bold">SSFI</Link>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold mb-8 text-gray-800">Gallery</h1>

                {albums.length === 0 ? (
                    <div className="text-center text-gray-500 py-16">
                        <p className="text-xl">No albums yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {albums.map((album: any) => (
                            <div key={album.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                <div
                                    className="h-48 bg-gray-200 bg-cover bg-center"
                                    style={{
                                        backgroundImage: album.cover_image
                                            ? `url(${album.cover_image})`
                                            : 'none'
                                    }}
                                >
                                    {!album.cover_image && (
                                        <div className="h-full flex items-center justify-center text-gray-400">
                                            📷
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-lg text-gray-800">{album.title}</h3>
                                    {album.event_date && (
                                        <p className="text-gray-500 text-sm">
                                            {new Date(album.event_date).toLocaleDateString('en-IN')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
