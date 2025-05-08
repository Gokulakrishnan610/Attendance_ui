import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/layout/user-nav";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-xl font-semibold text-foreground hidden sm:block">
            {title}
          </h1>
           <Badge variant="outline" className="ml-2 hidden lg:block">Pro</Badge>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Add any other header items here, like notifications bell */}
          <UserNav />
        </div>
      </div>
    </header>
  );
}
