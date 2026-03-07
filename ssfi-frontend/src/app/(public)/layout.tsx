import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import NotificationRibbon from '@/components/layout/NotificationRibbon';

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            {/* <!-- Website designed and developed by Team Indefine (https://indefine.in) | LearnCrew (https://learncrew.org) | Lead: Lakshmanan Annamalai | March 2026 --> */}
            <NotificationRibbon />
            <Header />
            <main className="flex-grow" style={{ paddingTop: 'calc(7rem + var(--ribbon-h, 0px))' }}>
                {children}
            </main>
            <Footer />
        </>
    );
}
