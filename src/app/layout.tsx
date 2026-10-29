import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "AccessHub | Campus Resource & Equipment Sharing Platform",
  description:
    "A trusted college campus platform sharing underused labs, makerspace tools, cameras and rooms with students and researchers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F4F7FF] text-slate-600 font-sans selection:bg-[#2F6BFF]/20 selection:text-[#0F1E4D] relative overflow-x-hidden">
        {/* Ambient cloud-like blurred blobs for soft depth */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-[10%] -right-[5%] w-[45vw] h-[45vw] rounded-full bg-blue-200/40 blur-[80px]" />
          <div className="absolute top-[25%] -left-[10%] w-[40vw] h-[40vw] rounded-full bg-indigo-100/60 blur-[90px]" />
          <div className="absolute bottom-[5%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-sky-200/40 blur-[75px]" />
        </div>
        <div className="relative z-10 flex flex-col min-h-full">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
