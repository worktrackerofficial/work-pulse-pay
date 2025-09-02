import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  ClipboardCheck, 
  BarChart3,
  Calendar,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Jobs", href: "/jobs", icon: Briefcase },
  { name: "Workers", href: "/workers", icon: Users },
  { name: "Attendance", href: "/attendance", icon: ClipboardCheck },
  { name: "Payouts", href: "/payouts", icon: DollarSign },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-card border-r min-h-screen">
      <nav className="mt-8 px-4">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                end
                className={({ isActive }) =>
                  cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )
                }
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}