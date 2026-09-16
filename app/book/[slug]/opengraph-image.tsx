import { ImageResponse } from "next/og";
import { getPublicBookBySlug } from "@/lib/repositories/books";
import { getCoverForBook } from "@/lib/repositories/covers";
import type { CoverDesignPlan } from "@/lib/types/publication";

export const alt = "Vasuki Publication Overview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = await getPublicBookBySlug(slug);

  if (!book) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f8fafc",
            color: "#0f172a",
            fontFamily: "sans-serif",
            padding: 48,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#ecfdf5",
              border: "1px solid #a7f3d0",
              borderRadius: 9999,
              padding: "8px 20px",
              marginBottom: 20,
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: "bold",
                color: "#047857",
                letterSpacing: 2,
              }}
            >
              VASUKI PUBLICATION
            </span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 38,
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: 12,
            }}
          >
            Publication Not Found
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 18,
              color: "#64748b",
            }}
          >
            The requested technical book is not available in the public catalog.
          </div>
        </div>
      ),
      { ...size }
    );
  }

  const cover = await getCoverForBook(book.id || book._id || "");
  const design = (cover?.design || {}) as CoverDesignPlan;

  const title = book.title || book.seo?.title || "Technical Publication";
  const subtitle = book.subtitle || book.seo?.description || book.description || "";
  const category = (book.category || book.discovery?.category || "TECHNICAL HANDBOOK").toUpperCase();
  const author = book.author || cover?.author || "VasukiSquare Editorial";
  const pageCount = book.page_count || 0;
  const accentColor = design.accent_color || "#059669";

  // Dynamic title size calculation to prevent overflow
  const titleFontSize = title.length > 55 ? 32 : title.length > 35 ? 38 : 44;
  const coverTitleFontSize = title.length > 50 ? 20 : title.length > 30 ? 23 : 26;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#f8fafc",
          color: "#0f172a",
          padding: 56,
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle background ambient gradient accent */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -100,
            width: 550,
            height: 550,
            borderRadius: "50%",
            backgroundColor: "#ecfdf5",
            opacity: 0.9,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -150,
            left: -100,
            width: 450,
            height: 450,
            borderRadius: "50%",
            backgroundColor: "#f1f5f9",
            opacity: 0.8,
          }}
        />

        {/* Left: Reconstructed VasukiSquare Book Cover Mini View */}
        <div
          style={{
            width: 330,
            height: 480,
            backgroundColor: "#f9fbfa",
            borderRadius: 16,
            border: "1.5px solid #e2e8f0",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.06)",
            position: "relative",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {/* Background Vector Scenery Art */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              opacity: 0.18,
            }}
          >
            <svg
              viewBox="0 0 794 1123"
              width="330"
              height="480"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="397.0" cy="591.1" r="77.5" fill="#111827" fillOpacity="0.08" stroke="#111827" strokeWidth="2.5" strokeOpacity="0.35" />
              <line x1="304.5" y1="591.1" x2="264.5" y2="591.1" stroke="#111827" strokeWidth="1.5" strokeOpacity="0.25" />
              <line x1="313.2" y1="552.0" x2="276.9" y2="535.1" stroke="#111827" strokeWidth="1.5" strokeOpacity="0.25" />
              <line x1="337.6" y1="520.3" x2="311.9" y2="489.6" stroke="#111827" strokeWidth="1.5" strokeOpacity="0.25" />
              <line x1="373.1" y1="501.8" x2="362.7" y2="463.2" stroke="#111827" strokeWidth="1.5" strokeOpacity="0.25" />
              <line x1="413.1" y1="500.0" x2="420.0" y2="460.6" stroke="#111827" strokeWidth="1.5" strokeOpacity="0.25" />
              <line x1="450.0" y1="515.4" x2="473.0" y2="482.6" stroke="#111827" strokeWidth="1.5" strokeOpacity="0.25" />
              <path d="M 0 1123 L 0 651.1 Q 238.2 591.1 397.0 651.1 Q 595.5 699.1 794 627.1 L 794 1123 Z" fill="#111827" opacity="0.15" />
              <path d="M 0 1123 L 0 831.1 Q 238.2 741.1 397.0 831.1 Q 595.5 903.1 794 795.1 L 794 1123 Z" fill="#111827" opacity="0.35" />
              <path d="M 0 1123 L 0 1071.1 Q 238.2 951.1 397.0 1071.1 Q 595.5 1167.1 794 1023.1 L 794 1123 Z" fill="#111827" opacity="0.65" />
              <path d="M 277.9 1123 C 333.48 954.55, 571.68 842.25, 492.28 729.95 C 412.88 651.34, 349.36 631.11, 391.0 591.1 L 403.0 591.1 C 381.12 631.1, 460.52 651.34, 539.92 729.95 C 619.32 842.25, 412.88 954.55, 516.1 1123 Z" fill="#111827" opacity="0.92" />
            </svg>
          </div>

          {/* Top category in cover */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              position: "relative",
              zIndex: 2,
            }}
          >
            <div
              style={{
                backgroundColor: "#001e2b",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                padding: "4px 10px",
                borderRadius: 4,
                display: "flex",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "#ffffff",
                  letterSpacing: 1.5,
                }}
              >
                {category}
              </span>
            </div>
          </div>

          {/* Dark Floating Title Card in cover */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#001e2b",
              borderRadius: 8,
              border: "1px solid rgba(255, 255, 255, 0.15)",
              padding: "16px 18px",
              boxShadow: "0 10px 20px -5px rgba(0, 0, 0, 0.4)",
              position: "relative",
              zIndex: 2,
              margin: "auto 0",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: coverTitleFontSize,
                fontWeight: 800,
                lineHeight: 1.2,
                color: "#ffffff",
                letterSpacing: -0.5,
              }}
            >
              {title}
            </div>
            <div
              style={{
                width: 32,
                height: 3,
                backgroundColor: accentColor,
                marginTop: 8,
                marginBottom: 8,
                borderRadius: 2,
                display: "flex",
              }}
            />
            {book.subtitle ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 12,
                  color: "#cbd5e1",
                  lineHeight: 1.35,
                }}
              >
                {book.subtitle.length > 55 ? `${book.subtitle.slice(0, 55)}...` : book.subtitle}
              </div>
            ) : null}
          </div>

          {/* Footer strip in cover */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#001e2b",
              borderTop: "1px solid rgba(255, 255, 255, 0.15)",
              margin: "-24px -24px -24px -24px",
              padding: "12px 20px",
              fontSize: 11,
              position: "relative",
              zIndex: 2,
            }}
          >
            <span style={{ fontWeight: 700, color: "#ffffff" }}>{author}</span>
            <span style={{ fontFamily: "monospace", fontSize: 10, color: "#cbd5e1", letterSpacing: 1 }}>
              FIRST EDITION
            </span>
          </div>
        </div>

        {/* Right: Social Headline & Vasuki Brand Identity */}
        <div
          style={{
            flex: 1,
            height: 480,
            marginLeft: 48,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Top Brand Tag */}
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                padding: "8px 18px",
                borderRadius: 9999,
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: 1.5,
                }}
              >
                VASUKI PUBLICATION
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "#059669",
                  marginLeft: 10,
                  fontWeight: 700,
                }}
              >
                • VasukiSquare Engine
              </span>
            </div>
          </div>

          {/* Center Title & Subtitle */}
          <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", marginBottom: "auto" }}>
            <div
              style={{
                display: "flex",
                fontSize: titleFontSize,
                fontWeight: 800,
                color: "#0f172a",
                lineHeight: 1.2,
                letterSpacing: -1,
                marginBottom: 16,
              }}
            >
              {title}
            </div>
            {subtitle ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 18,
                  color: "#475569",
                  lineHeight: 1.45,
                }}
              >
                {subtitle.length > 150 ? `${subtitle.slice(0, 150)}...` : subtitle}
              </div>
            ) : null}
          </div>

          {/* Bottom Footer Info */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1.5px solid #e2e8f0",
              paddingTop: 18,
            }}
          >
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", marginRight: 20 }}>
                <span style={{ fontSize: 14, color: "#64748b", marginRight: 4 }}>Category:</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{category}</span>
              </div>
              {pageCount > 0 && (
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                  <span style={{ fontSize: 14, color: "#64748b", marginRight: 4 }}>Length:</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{pageCount} Pages</span>
                </div>
              )}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#ecfdf5",
                border: "1px solid #a7f3d0",
                padding: "6px 14px",
                borderRadius: 8,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: "#047857",
                  fontWeight: 700,
                }}
              >
                Read Online on Web →
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
