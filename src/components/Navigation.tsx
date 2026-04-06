"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Camera,
  LayoutDashboard,
  History,
  Settings,
  ScanLine,
} from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analyze", label: "Scanner", icon: Camera },
  { href: "/history", label: "Historique", icon: History },
  { href: "/settings", label: "Profils", icon: Settings },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col w-72 min-h-screen p-4">
        <div className="glass-strong flex flex-col h-full rounded-2xl p-5">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 gradient-green rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
              <ScanLine className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                Food Scanner
              </h1>
              <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">
                Nutrition IA
              </p>
            </div>
          </div>

          {/* Nav links */}
          <div className="flex flex-col gap-1.5 flex-1">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active
                      ? "gradient-green text-white shadow-lg shadow-green-500/25"
                      : "text-gray-500 hover:text-gray-800 hover:bg-white/60"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? "text-white" : ""}`} />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Bottom branding */}
          <div className="px-2 pt-4 border-t border-white/30">
            <p className="text-[10px] text-gray-400">
              Powered by Claude AI
            </p>
          </div>
        </div>
      </nav>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-3">
        <div className="glass-strong flex justify-around py-2 rounded-2xl mx-2">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all ${
                  active
                    ? "text-emerald-600"
                    : "text-gray-400"
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg transition-all ${
                    active ? "gradient-green shadow-md shadow-green-500/25" : ""
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${active ? "text-white" : ""}`}
                  />
                </div>
                <span className="text-[10px] font-semibold">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
