"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect, Suspense } from "react";

interface GoogleAnalyticsProps {
  gaId?: string;
}

function GoogleAnalyticsInner({ gaId = "G-7DBX5JSSKM" }: GoogleAnalyticsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Exclude admin dashboard and all subroutes completely
  const isAdmin = pathname ? pathname.startsWith("/admin") : false;

  useEffect(() => {
    if (isAdmin || !gaId || typeof window === "undefined" || !window.gtag) {
      return;
    }

    const search = searchParams?.toString();
    const url = search ? `${pathname}?${search}` : pathname;

    window.gtag("config", gaId, {
      page_path: url,
    });
  }, [pathname, searchParams, isAdmin, gaId]);

  // Do not load or execute Google Analytics on admin routes or if no measurement ID is configured
  if (isAdmin || !gaId) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}

// Global typing for gtag in window
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function GoogleAnalytics(props: GoogleAnalyticsProps) {
  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsInner {...props} />
    </Suspense>
  );
}

