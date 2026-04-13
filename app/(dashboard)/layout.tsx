import { requireUser } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileSidebar } from "@/components/layout/MobileSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto scrollbar-thin flex flex-col">
        <div className="md:hidden h-12 border-b border-white/[0.06] flex items-center px-3 flex-shrink-0">
          <MobileSidebar />
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {children}
        </div>
      </main>
    </div>
  );
}
