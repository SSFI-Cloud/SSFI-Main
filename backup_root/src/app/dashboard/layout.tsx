
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Sidebar from "@/components/DashboardSidebar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const headersList = await headers();
    const userRole = headersList.get("x-user-role");
    const userId = headersList.get("x-user-id");

    // Middleware should handle mostly, but double check
    if (!userRole) {
        // In a real app with strict middleware this might not be reached, 
        // but good for safety or dev mode if middleware is bypassed.
        // For now, we rely on middleware.
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar role={userRole} />
            <div className="flex-1 flex flex-col">
                <header className="bg-white shadow p-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
                    <div className="text-sm text-gray-600">
                        Role: <span className="font-bold">{userRole}</span>
                    </div>
                </header>
                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
