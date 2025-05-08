import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Users, CalendarCheck, UserCircle, Settings } from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Students',
    href: '/students',
    icon: Users,
  },
  {
    title: 'Attendance',
    href: '/attendance',
    icon: CalendarCheck,
  },
  {
    title: 'Profile',
    href: '/profile',
    icon: UserCircle,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];
