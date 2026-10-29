"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  ShieldCheck,
  Compass,
  CalendarCheck,
  Award,
  Layers,
  Inbox,
  ClipboardCheck,
  Users,
  ScrollText,
  AlertTriangle,
  LogOut,
  Bell,
  Menu,
  X,
  User as UserIcon,
} from "lucide-react";
import useSWR from "swr";

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Poll notifications with SWR every 15 seconds
  const fetcher = (url: string) => fetch(url).then((res) => res.json());
  const { data: notifData, mutate: mutateNotifs } = useSWR(
    user ? "/api/notifications" : null,
    fetcher,
    { refreshInterval: 15000 }
  );

  const notifications = notifData?.notifications || [];
  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const handleMarkAsRead = async (id?: string) => {
    try {
      await fetch(id ? `/api/notifications?id=${id}` : "/api/notifications", {
        method: "PATCH",
      });
      mutateNotifs();
    } catch (e) {
      console.error(e);
    }
  };

  const getNavLinks = () => {
    const baseLinks = [{ label: "Explore Resources", href: "/resources", icon: Compass }];

    if (!user) return baseLinks;

    const roleLinks: Record<string, Array<{ label: string; href: string; icon: any }>> = {
      user: [
        { label: "My Bookings", href: "/bookings", icon: CalendarCheck },
        { label: "Credentials", href: "/credentials", icon: Award },
      ],
      owner: [
        { label: "Review Queue", href: "/owner/queue", icon: Inbox },
        { label: "My Equipment", href: "/owner/resources", icon: Layers },
        { label: "Incidents", href: "/owner/incidents", icon: AlertTriangle },
      ],
      manager: [
        { label: "Check-in & Return", href: "/manager/checkin", icon: ClipboardCheck },
        { label: "Verify Credentials", href: "/manager/credentials", icon: Award },
      ],
      admin: [
        { label: "User Directory", href: "/admin/users", icon: Users },
        { label: "All Incidents", href: "/admin/incidents", icon: AlertTriangle },
        { label: "Audit Log", href: "/admin/audit", icon: ScrollText },
      ],
    };

    return [...baseLinks, ...(roleLinks[user.role] || [])];
  };

  const navLinks = getNavLinks();

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-950/70 text-purple-300 border-purple-700/60 shadow-sm shadow-purple-900/20";
      case "owner":
        return "bg-blue-950/70 text-blue-300 border-blue-700/60 shadow-sm shadow-blue-900/20";
      case "manager":
        return "bg-amber-950/70 text-amber-300 border-amber-700/60 shadow-sm shadow-amber-900/20";
      default:
        return "bg-emerald-950/70 text-emerald-300 border-emerald-700/60 shadow-sm shadow-emerald-900/20";
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 group-hover:shadow-indigo-500/40 transition-all duration-300">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-white tracking-tight leading-none group-hover:text-indigo-300 transition-colors">
              AccessHub
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide">Campus Resource Trust</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/60 border border-slate-800/80 rounded-xl p-1 backdrop-blur-sm">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Status / Actions */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              {/* Notification Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 relative transition"
                  title="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500 animate-pulse ring-2 ring-slate-950" />
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-3 z-50">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => handleMarkAsRead()}
                          className="text-[11px] text-indigo-400 hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-500">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((n: any) => (
                          <div
                            key={n._id}
                            onClick={() => handleMarkAsRead(n._id)}
                            className={`p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                              n.read
                                ? "bg-slate-900/40 border-slate-800 text-slate-400"
                                : "bg-indigo-950/30 border-indigo-900/50 text-slate-200"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="leading-snug">{n.message}</p>
                              {!n.read && (
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0 mt-1" />
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Role Badge & Info */}
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-medium text-slate-200 truncate max-w-[120px]">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                    {user.department}
                  </span>
                </div>

                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getRoleBadgeColor(
                    user.role
                  )}`}
                >
                  {user.role}
                </span>
              </div>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900 transition"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 pt-2 pb-4 space-y-1">
          {user && (
            <div className="py-2 mb-2 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">{user.name}</div>
                <div className="text-[11px] text-slate-400">{user.email}</div>
              </div>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getRoleBadgeColor(
                  user.role
                )}`}
              >
                {user.role}
              </span>
            </div>
          )}
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? "bg-slate-800 text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
export default Navbar;
