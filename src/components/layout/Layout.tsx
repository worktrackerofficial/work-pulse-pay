import { ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-2 sm:p-4 lg:p-6 overflow-x-auto">
          <div className="min-w-0 w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}