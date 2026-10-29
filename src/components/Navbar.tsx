"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Layers,
  Compass,
  CalendarCheck,
  Award,
  Inbox,
  ClipboardCheck,
  Users,
  ScrollText,
  AlertTriangle,
  LogOut,
  Bell,
  Menu,
  X,
  Search,
} from "lucide-react";
import useSWR from "swr";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [navSearch, setNavSearch] = useState("");

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearch.trim()) {
      router.push(`/resources?query=${encodeURIComponent(navSearch.trim())}`);
    } else {
      router.push("/resources");
    }
  };

  const getNavLinks = () => {
    const baseLinks = [
      { label: "Home", href: "/" },
      { label: "Explore", href: "/resources" },
    ];

    if (user) {
      if (user.role === "user") {
        baseLinks.push(
          { label: "My Bookings", href: "/bookings" },
          { label: "Credentials", href: "/credentials" }
        );
      } else if (user.role === "owner") {
        baseLinks.push(
          { label: "Review Queue", href: "/owner/queue" },
          { label: "Equipment", href: "/owner/resources" },
          { label: "Incidents", href: "/owner/incidents" }
        );
      } else if (user.role === "manager") {
        baseLinks.push(
          { label: "Check-in & Return", href: "/manager/checkin" },
          { label: "Verify Creds", href: "/manager/credentials" }
        );
      } else if (user.role === "admin") {
        baseLinks.push(
          { label: "Directory", href: "/admin/users" },
          { label: "Incidents", href: "/admin/incidents" },
          { label: "Audit Log", href: "/admin/audit" }
        );
      }
    } else {
      baseLinks.push(
        { label: "My Bookings", href: "/bookings" },
        { label: "Resources", href: "/resources" }
      );
    }

    baseLinks.push({ label: "About", href: "/#how-it-works" });
    return baseLinks;
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-3 z-50 w-full px-3 sm:px-6">
      {/* Floating Pill Container matching reference screenshot */}
      <div className="max-w-7xl mx-auto rounded-full bg-white/85 backdrop-blur-xl border border-white/90 shadow-[0_8px_30px_rgb(47,107,255,0.08)] px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 transition-all">
        {/* Brand with 3D Stack Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-tr from-[#2F6BFF] to-[#38bdf8] flex items-center justify-center shadow-md shadow-[#2F6BFF]/25 group-hover:scale-105 transition-transform duration-200">
            <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <span className="text-base sm:text-lg font-extrabold text-[#0F1E4D] tracking-tight group-hover:text-[#2F6BFF] transition-colors">
            AccessHub
          </span>
        </Link>

        {/* Desktop Links (Home, Explore, My Bookings, Resources, About) */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname.startsWith(link.href + "/");

            return (
              <Link
                key={link.label}
                href={link.href}
                className={`relative py-1 text-xs sm:text-sm font-semibold transition-colors duration-150 ${
                  isActive
                    ? "text-[#2F6BFF] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#2F6BFF] after:rounded-full"
                    : "text-slate-500 hover:text-[#0F1E4D]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Center-Right Pill Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex items-center gap-2 bg-[#F4F7FF] border border-[#2F6BFF]/15 px-3 py-1.5 rounded-full text-xs text-slate-500 w-44 lg:w-56 focus-within:w-64 focus-within:border-[#2F6BFF] focus-within:bg-white transition-all shadow-inner"
        >
          <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
            placeholder="Search for labs, equipment..."
            className="w-full bg-transparent text-xs text-[#0F1E4D] placeholder-slate-400 focus:outline-none"
          />
        </form>

        {/* Right Section: Notification Bell + User Chip */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              {/* Notification Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-full text-slate-500 hover:text-[#0F1E4D] hover:bg-slate-100 relative transition"
                  title="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-2xl p-4 z-50">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#0F1E4D]">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EEF4FF] text-[#2F6BFF]">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => handleMarkAsRead()}
                          className="text-[11px] font-semibold text-[#2F6BFF] hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((n: any) => (
                          <div
                            key={n._id}
                            onClick={() => handleMarkAsRead(n._id)}
                            className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                              n.read
                                ? "bg-slate-50 border-slate-100 text-slate-500"
                                : "bg-[#EEF4FF]/70 border-[#2F6BFF]/20 text-[#0F1E4D]"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="leading-snug">{n.message}</p>
                              {!n.read && (
                                <span className="h-1.5 w-1.5 rounded-full bg-[#2F6BFF] shrink-0 mt-1" />
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 block">
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

              {/* User Chip matching reference screenshot */}
              <div className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-[#F4F7FF] border border-[#2F6BFF]/20 shadow-sm">
                <div className="h-7 w-7 rounded-full bg-[#2F6BFF] text-white font-bold text-xs flex items-center justify-center uppercase shadow-sm shrink-0">
                  {user.name ? user.name.charAt(0) : user.role ? user.role.charAt(0) : "U"}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="text-xs font-bold text-[#0F1E4D] truncate max-w-[100px]">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-500 capitalize">
                    {user.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="p-1 rounded-full text-slate-400 hover:text-red-500 transition ml-1"
                  title="Sign Out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href="/login"
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-[#2F6BFF] hover:bg-[#EEF4FF] transition"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#2F6BFF] text-white hover:bg-[#1E56DF] shadow-sm shadow-[#2F6BFF]/25 transition hover:-translate-y-0.5"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-full text-slate-600 hover:bg-slate-100"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 max-w-7xl mx-auto rounded-3xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-2xl p-4 space-y-2">
          {user && (
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-[#2F6BFF] text-white font-bold text-xs flex items-center justify-center uppercase">
                  {user.name ? user.name.charAt(0) : "U"}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0F1E4D]">{user.name}</div>
                  <div className="text-[11px] text-slate-400">{user.email} &bull; <span className="capitalize">{user.role}</span></div>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-xs text-red-500 font-semibold px-2 py-1 rounded-lg hover:bg-red-50"
              >
                Sign Out
              </button>
            </div>
          )}

          <div className="grid gap-1 pt-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname === link.href || pathname.startsWith(link.href + "/");

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                    isActive
                      ? "bg-[#EEF4FF] text-[#2F6BFF]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-[#0F1E4D]"
                  }`}
                >
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
