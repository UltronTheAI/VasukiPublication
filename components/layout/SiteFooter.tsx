import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Heart } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-hairline bg-canvas-soft text-mute py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand & Philosophy */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Image
                src="/Vasuki.png"
                alt="Vasuki Publication Logo"
                width={24}
                height={24}
                className="w-6 h-6 object-contain"
              />
              <span className="text-sm font-bold text-ink">Vasuki Publication</span>
            </div>
            <p className="text-xs text-body leading-relaxed max-w-md">
              The public web reading platform for books authored and published by the{" "}
              <strong className="text-ink font-semibold">VasukiSquare</strong> generation engine.
              Featuring zero-PDF web streaming, rich structured typography, and instant topic discovery.
            </p>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-ink font-semibold mb-3">
              Discovery
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-ink transition-colors">
                  All Publications
                </Link>
              </li>
              <li>
                <Link href="/?q=technical" className="hover:text-ink transition-colors">
                  Technical Architecture
                </Link>
              </li>
              <li>
                <Link href="/?q=guide" className="hover:text-ink transition-colors">
                  Practical Guides
                </Link>
              </li>
              <li>
                <Link href="/saved" className="hover:text-ink transition-colors">
                  Saved Queue
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Engine */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-ink font-semibold mb-3">
              Platform & Legal
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-brand-green" />
                <span>Zero-PDF Native DOM</span>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-ink transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-ink transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <span className="text-mute">License: Commercial Source v1.0</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom divider & copyright */}
        <div className="pt-8 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-mute">
          <p>© 2026 Swaraj Puppalwar. All rights reserved.</p>
          <p className="flex items-center gap-1 text-[11px]">
            <span>Engineered with Next.js 16 & React 19 for VasukiSquare</span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500 inline" />
          </p>
        </div>
      </div>
    </footer>
  );
}

