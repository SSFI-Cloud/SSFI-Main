import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <Header />
            <main className="flex-grow pt-28">
                {children}
            </main>
            <Footer />
        </>
    );
}
