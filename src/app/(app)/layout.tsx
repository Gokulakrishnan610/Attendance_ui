import { SidebarProvider } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { Header } from "@/components/layout/header"; // Assuming Header is generic enough or adapt as needed

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout structure uses the shadcn/ui Sidebar component.
  // The title for the Header would ideally be dynamic based on the current page.
  // For simplicity, a static title or a more complex context/hook based solution would be needed for dynamic titles.
  // Here, we'll pass a generic title or leave it to child pages to set via context if needed.

  return (
    <SidebarProvider defaultOpen>
      <MainSidebar />
      <div className="flex flex-col flex-1 min-h-screen md:ml-[var(--sidebar-width-icon)] peer-data-[collapsible=offcanvas]:ml-0 peer-data-[state=expanded]:md:ml-[var(--sidebar-width)] transition-[margin-left] ease-linear duration-200">
        {/* A dynamic header title solution is more complex and might involve context or page-specific settings */}
        {/* For now, a placeholder or a generic title is used. */}
        {/* <Header title="FaceAttend Pro" /> */}
        <main className="flex-1 bg-background">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
