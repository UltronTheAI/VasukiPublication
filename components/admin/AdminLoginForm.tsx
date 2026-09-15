"use client";

import React, { useActionState } from "react";
import { loginAdminAction } from "@/app/admin/actions";
import { KeyRound, ArrowRight, Loader2 } from "lucide-react";

export function AdminLoginForm() {
  const [state, formAction, isPending] = useActionState(loginAdminAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs leading-relaxed animate-in fade-in">
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="admin-token"
          className="block text-xs font-semibold text-ink mb-1.5"
        >
          Administrator Access Token
        </label>
        <div className="relative">
          <KeyRound className="w-4 h-4 text-mute absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="admin-token"
            name="token"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••••••••••••••"
            className="w-full pl-9 pr-3 py-2 bg-canvas-soft border border-hairline hover:border-hairline-strong focus:border-ink rounded-lg text-xs font-mono text-ink placeholder:text-mute focus:outline-hidden transition-colors"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-ink text-white hover:bg-black text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-brand-green" />
            <span>Verifying Credentials...</span>
          </>
        ) : (
          <>
            <span>Unlock Admin Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </>
        )}
      </button>
    </form>
  );
}

