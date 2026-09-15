import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/security/admin-auth";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { ShieldCheck, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administrator Authentication | Vasuki Publication",
  description: "Secure private management portal for VasukiSquare publications.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLoginPage() {
  const isAuth = await verifyAdminSession();
  if (isAuth) {
    redirect("/admin");
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-hairline rounded-2xl p-8 shadow-xs">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-ink text-white flex items-center justify-center mb-4 shadow-xs">
            <ShieldCheck className="w-6 h-6 text-brand-green" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Admin Authentication
          </h1>
          <p className="text-xs text-mute mt-1 max-w-xs">
            Enter your secret server access token to access the publication management console.
          </p>
        </div>

        {/* Client Form with validation & rate-limit feedback */}
        <AdminLoginForm />

        {/* Security Notice */}
        <div className="mt-6 pt-4 border-t border-hairline flex items-center gap-2 text-[11px] text-mute">
          <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Constant-time token validation with HMAC-signed HttpOnly session.</span>
        </div>
      </div>
    </div>
  );
}

