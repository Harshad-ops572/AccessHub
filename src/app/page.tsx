"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Navbar } from "@/components/Navbar";
import { GlassCard } from "@/components/GlassCard";
import { PillButton } from "@/components/PillButton";
import { StatusBadge } from "@/components/StatusBadge";
import { SectionHeader } from "@/components/SectionHeader";
import {
  Compass,
  Search,
  ArrowRight,
  FlaskConical,
  Cog,
  DoorOpen,
  Layers,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Star,
  FileText,
  UserCheck,
  Zap,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [imgError, setImgError] = useState(false);

  // Fetch real resource counts and listings from existing API
  const { data, isLoading } = useSWR("/api/resources", fetcher);
  const resources: any[] = data?.resources || [];

  // Compute real counts from database
  const totalCount = resources.length;
  const labCount = resources.filter((r) => r.category === "lab").length;
  const equipmentCount = resources.filter((r) =>
    ["makerspace", "camera", "testing"].includes(r.category)
  ).length;
  const spacesCount = resources.filter((r) => r.category === "room").length;
  const makerspaceCount = resources.filter((r) => r.category === "makerspace").length;
  const computeCount = resources.filter((r) => r.category === "computer").length;

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/resources?query=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/resources");
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "lab":
        return <FlaskConical className="h-6 w-6 text-[#2F6BFF]" />;
      case "makerspace":
        return <Layers className="h-6 w-6 text-[#2F6BFF]" />;
      case "room":
        return <DoorOpen className="h-6 w-6 text-[#2F6BFF]" />;
      case "computer":
        return <Cpu className="h-6 w-6 text-[#2F6BFF]" />;
      default:
        return <Cog className="h-6 w-6 text-[#2F6BFF]" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-slate-600 font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-12 sm:space-y-16">
        {/* HERO SECTION matching reference screenshot */}
        <section className="grid lg:grid-cols-12 gap-8 items-center pt-2 sm:pt-6">
          {/* Left Column: Heading + Search */}
          <div className="lg:col-span-5 space-y-6 text-left">
            {/* Tag pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#EEF4FF] text-[#2F6BFF] border border-[#2F6BFF]/20 shadow-sm">
              <span>Share &bull; Discover &bull; Build Together</span>
            </div>

            {/* Main Heading with vivid blue highlight */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold text-[#0F1E4D] tracking-tight leading-[1.12]">
              Your Campus <br />
              <span className="text-[#2F6BFF]">Resources,</span> One Hub
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base text-slate-500 leading-relaxed max-w-md">
              AccessHub helps students and faculty discover and book underused
              laboratories, equipment and spaces across the campus &mdash; safely,
              fairly and efficiently.
            </p>

            {/* Large Pill Search Bar with blue circular arrow button */}
            <form
              onSubmit={handleHeroSearch}
              className="relative max-w-md bg-white/90 backdrop-blur-md border border-white/90 p-1.5 pl-4 sm:pl-5 rounded-full shadow-[0_8px_30px_rgb(47,107,255,0.08)] flex items-center justify-between gap-2 focus-within:border-[#2F6BFF]/50 transition-all"
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for labs, equipment, spaces..."
                  className="w-full bg-transparent text-xs sm:text-sm text-[#0F1E4D] placeholder-slate-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="h-10 w-10 rounded-full bg-[#2F6BFF] hover:bg-[#1E56DF] active:bg-[#1845bb] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#2F6BFF]/30 transition-transform hover:scale-105"
                aria-label="Search resources"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Center Column: 3D Element with floating glass chips */}
          <div className="lg:col-span-4 relative flex items-center justify-center py-4 sm:py-0">
            <div className="relative w-full max-w-sm sm:max-w-md">
              {!imgError ? (
                <img
                  src="/hero-campus.png"
                  alt="3D Campus Illustration"
                  onError={() => setImgError(true)}
                  className="w-full h-auto object-contain drop-shadow-2xl animate-float select-none pointer-events-none"
                />
              ) : (
                /* Pure CSS 3D fallback if image generation is missing */
                <div className="relative w-72 h-72 mx-auto [perspective:1000px] flex items-center justify-center animate-float">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-[#2F6BFF]/20 to-sky-100/60 [transform:rotateX(20deg)_rotateY(-15deg)] shadow-2xl border border-white" />
                  <div className="relative z-10 p-6 rounded-2xl bg-white/90 backdrop-blur-md border border-white shadow-xl text-center">
                    <Layers className="h-12 w-12 text-[#2F6BFF] mx-auto mb-2" />
                    <div className="font-bold text-[#0F1E4D] text-sm">Campus Facility Hub</div>
                  </div>
                </div>
              )}

              {/* Floating Glass Chips around 3D Campus */}
              <div className="absolute top-2 left-0 sm:-left-2 bg-white/90 backdrop-blur-md border border-white/90 px-3 py-1.5 rounded-2xl shadow-[0_8px_20px_rgba(47,107,255,0.1)] flex items-center gap-2 text-xs font-bold text-[#0F1E4D] animate-float-slow">
                <div className="h-6 w-6 rounded-lg bg-[#EEF4FF] text-[#2F6BFF] flex items-center justify-center">
                  <FlaskConical className="h-3.5 w-3.5" />
                </div>
                <span>Labs</span>
              </div>

              <div className="absolute top-6 right-0 sm:-right-2 bg-white/90 backdrop-blur-md border border-white/90 px-3 py-1.5 rounded-2xl shadow-[0_8px_20px_rgba(47,107,255,0.1)] flex items-center gap-2 text-xs font-bold text-[#0F1E4D] animate-float">
                <div className="h-6 w-6 rounded-lg bg-[#EEF4FF] text-[#2F6BFF] flex items-center justify-center">
                  <Cog className="h-3.5 w-3.5" />
                </div>
                <span>Equipment</span>
              </div>

              <div className="absolute bottom-4 right-2 sm:right-6 bg-white/90 backdrop-blur-md border border-white/90 px-3 py-1.5 rounded-2xl shadow-[0_8px_20px_rgba(47,107,255,0.1)] flex items-center gap-2 text-xs font-bold text-[#0F1E4D] animate-float-slow">
                <div className="h-6 w-6 rounded-lg bg-[#EEF4FF] text-[#2F6BFF] flex items-center justify-center">
                  <DoorOpen className="h-3.5 w-3.5" />
                </div>
                <span>Spaces</span>
              </div>

              <div className="hidden sm:block absolute -bottom-3 left-4 text-[11px] font-semibold text-slate-400 italic">
                More resources. More possibilities &rarr;
              </div>
            </div>
          </div>

          {/* Right Column: "A smarter way to use campus resources" Card */}
          <div className="lg:col-span-3">
            <GlassCard className="p-6 space-y-6 shadow-xl" hoverEffect>
              <div>
                <h3 className="text-base font-extrabold text-[#0F1E4D] leading-snug">
                  A smarter way to use campus resources
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Verified availability across departments.
                </p>
              </div>

              <div className="space-y-4">
                {/* Labs Row */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#EEF4FF] text-[#2F6BFF] flex items-center justify-center shrink-0">
                      <FlaskConical className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#0F1E4D]">Labs</div>
                      <div className="text-[10px] text-slate-400">Cleanrooms & Bio</div>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-[#0F1E4D]">
                    {isLoading ? "..." : `${labCount}+ Available`}
                  </span>
                </div>

                {/* Equipment Row */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#EEF4FF] text-[#2F6BFF] flex items-center justify-center shrink-0">
                      <Cog className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#0F1E4D]">Equipment</div>
                      <div className="text-[10px] text-slate-400">Printers & Scopes</div>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-[#0F1E4D]">
                    {isLoading ? "..." : `${equipmentCount}+ Available`}
                  </span>
                </div>

                {/* Spaces Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#EEF4FF] text-[#2F6BFF] flex items-center justify-center shrink-0">
                      <DoorOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#0F1E4D]">Spaces</div>
                      <div className="text-[10px] text-slate-400">Studios & Rooms</div>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-[#0F1E4D]">
                    {isLoading ? "..." : `${spacesCount}+ Available`}
                  </span>
                </div>
              </div>

              <PillButton href="/resources" variant="primary" showArrow className="w-full">
                Explore Resources
              </PillButton>
            </GlassCard>
          </div>
        </section>

        {/* EXPLORE BY CATEGORY SECTION */}
        <section className="space-y-4">
          <SectionHeader
            icon={<Layers className="h-4 w-4" />}
            title="Explore by Category"
            subtitle="Find what you need, when you need it."
            viewAllHref="/resources"
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {[
              {
                id: "lab",
                label: "Laboratories",
                count: labCount,
                icon: FlaskConical,
              },
              {
                id: "testing",
                label: "Equipment",
                count: equipmentCount,
                icon: Cog,
              },
              {
                id: "room",
                label: "Spaces",
                count: spacesCount,
                icon: DoorOpen,
              },
              {
                id: "makerspace",
                label: "Makerspace",
                count: makerspaceCount,
                icon: Layers,
              },
              {
                id: "computer",
                label: "Computers & IT",
                count: computeCount,
                icon: Cpu,
              },
            ].map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.id}
                  href={`/resources?category=${cat.id}`}
                  className="group"
                >
                  <GlassCard
                    className="p-4 sm:p-5 h-full flex flex-col justify-between"
                    hoverEffect
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 rounded-2xl bg-[#EEF4FF] group-hover:bg-[#2F6BFF] text-[#2F6BFF] group-hover:text-white flex items-center justify-center transition-colors duration-200 shadow-sm">
                        <Icon className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-[#2F6BFF] group-hover:translate-x-1 transition-all" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0F1E4D] group-hover:text-[#2F6BFF] transition-colors">
                        {cat.label}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {isLoading ? "..." : `${cat.count}+ resources`}
                      </p>
                    </div>
                  </GlassCard>
                </Link>
              );
            })}
          </div>
        </section>

        {/* POPULAR RESOURCES & HOW IT WORKS SECTION */}
        <section className="space-y-4">
          <SectionHeader
            icon={<Star className="h-4 w-4" />}
            title="Popular Resources"
            subtitle="Most booked and highly rated resources on campus."
            viewAllHref="/resources"
          />

          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Cols: 4 Real Resource Cards */}
            <div className="lg:col-span-8 grid sm:grid-cols-2 gap-4 sm:gap-5">
              {isLoading ? (
                [1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-72 rounded-3xl bg-white/60 border border-white animate-pulse"
                  />
                ))
              ) : resources.length === 0 ? (
                <div className="col-span-2 p-8 text-center text-xs text-slate-400">
                  No resources currently listed.
                </div>
              ) : (
                resources.slice(0, 4).map((res) => {
                  const hasPhoto = res.photos && res.photos.length > 0;
                  return (
                    <GlassCard
                      key={res._id}
                      className="overflow-hidden flex flex-col justify-between group hover:[transform:perspective(1000px)_rotateX(2deg)_rotateY(-1deg)] motion-reduce:hover:transform-none transition-all duration-300"
                      hoverEffect
                    >
                      <div>
                        {/* Photo Banner with Available Badge */}
                        <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                          {hasPhoto ? (
                            <img
                              src={res.photos[0]}
                              alt={res.title}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-blue-100 via-indigo-50 to-sky-100 flex items-center justify-center text-[#2F6BFF]">
                              {getCategoryIcon(res.category)}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

                          {/* Green Pill Available Badge */}
                          <div className="absolute top-3 left-3">
                            <StatusBadge status="available" />
                          </div>
                        </div>

                        {/* Resource Info */}
                        <div className="p-4 sm:p-5 space-y-2">
                          <h3 className="text-sm font-bold text-[#0F1E4D] group-hover:text-[#2F6BFF] transition-colors line-clamp-1">
                            {res.title}
                          </h3>

                          <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                            <MapPin className="h-3.5 w-3.5 text-[#2F6BFF] shrink-0" />
                            <span className="truncate">{res.location}</span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                            <span className="capitalize">{res.category}</span>
                            <span>Max {res.maxDurationHours}h</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Book Now PillButton */}
                      <div className="p-4 sm:p-5 pt-0">
                        <PillButton
                          href={`/resources/${res._id}`}
                          variant="secondary"
                          size="sm"
                          showArrow
                          className="w-full"
                        >
                          Book Now
                        </PillButton>
                      </div>
                    </GlassCard>
                  );
                })
              )}
            </div>

            {/* Right 4 Cols: "How It Works" + "Verified & Safe" Cards */}
            <div className="lg:col-span-4 space-y-4">
              {/* How It Works Card */}
              <GlassCard className="p-6 space-y-5 shadow-xl">
                <div>
                  <h3 className="text-base font-extrabold text-[#0F1E4D]">
                    How It Works
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Streamlined booking in four easy steps.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      step: "1",
                      title: "Find",
                      desc: "Search and explore available campus resources.",
                      icon: Search,
                    },
                    {
                      step: "2",
                      title: "Request",
                      desc: "Send a booking request with your project details.",
                      icon: FileText,
                    },
                    {
                      step: "3",
                      title: "Approve",
                      desc: "Get confirmation from the owner and facility manager.",
                      icon: UserCheck,
                    },
                    {
                      step: "4",
                      title: "Use",
                      desc: "Access the resource safely and complete your work.",
                      icon: Zap,
                    },
                  ].map((item) => {
                    const StepIcon = item.icon;
                    return (
                      <div key={item.step} className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#EEF4FF] text-[#2F6BFF] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                          <StepIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#0F1E4D]">
                            {item.step}. {item.title}
                          </div>
                          <div className="text-[11px] text-slate-500 leading-snug">
                            {item.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-100 text-center">
                  <span className="text-xs font-semibold text-[#2F6BFF] italic">
                    Simple &bull; Safe &bull; Sustainable
                  </span>
                </div>
              </GlassCard>

              {/* Verified & Safe Card */}
              <GlassCard className="p-5 flex items-center gap-3.5 shadow-md">
                <div className="h-10 w-10 rounded-2xl bg-[#E6F9F0] text-[#059669] flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0F1E4D]">
                    Verified & Safe
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    All resources are verified, with proper approvals and safety checks.
                  </p>
                </div>
              </GlassCard>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER matching light clean design */}
      <footer className="mt-16 border-t border-white/80 bg-white/60 backdrop-blur-md py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-[#2F6BFF] flex items-center justify-center text-white">
              <Layers className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-[#0F1E4D]">AccessHub</span>
            <span>&bull;</span>
            <span>Campus Resource Sharing Platform</span>
          </div>

          <div className="flex items-center gap-5 text-slate-500">
            <Link href="/resources" className="hover:text-[#2F6BFF] transition-colors">
              Explore
            </Link>
            <Link href="/bookings" className="hover:text-[#2F6BFF] transition-colors">
              Bookings
            </Link>
            <Link href="/credentials" className="hover:text-[#2F6BFF] transition-colors">
              Credentials
            </Link>
            <Link href="/login" className="hover:text-[#2F6BFF] transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
