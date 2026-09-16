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

        {/* Left: Reconstructed Light Book Cover Mini View */}
        <div
          style={{
            width: 330,
            height: 480,
            backgroundColor: "#ffffff",
            borderRadius: 16,
            border: "1.5px solid #e2e8f0",
            padding: 26,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
            position: "relative",
            flexShrink: 0,
          }}
        >
          {/* Top category in cover */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                backgroundColor: "#ecfdf5",
                border: "1px solid #a7f3d0",
                padding: "4px 10px",
                borderRadius: 6,
                display: "flex",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#047857",
                  letterSpacing: 1.5,
                }}
              >
                {category}
              </span>
            </div>
          </div>

          {/* Title block in cover */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              margin: "auto 0",
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                backgroundColor: accentColor,
                marginBottom: 14,
                borderRadius: 2,
                display: "flex",
              }}
            />
            <div
              style={{
                display: "flex",
                fontSize: coverTitleFontSize,
                fontWeight: 800,
                lineHeight: 1.25,
                color: "#0f172a",
                letterSpacing: -0.5,
              }}
            >
              {title}
            </div>
            {book.subtitle ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 13,
                  color: "#64748b",
                  marginTop: 8,
                  lineHeight: 1.35,
                }}
              >
                {book.subtitle.length > 60 ? `${book.subtitle.slice(0, 60)}...` : book.subtitle}
              </div>
            ) : null}
          </div>

          {/* Footer in cover */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid #f1f5f9",
              paddingTop: 12,
              fontSize: 12,
              color: "#64748b",
            }}
          >
            <span style={{ fontWeight: 600, color: "#334155" }}>{author}</span>
            <span style={{ fontFamily: "monospace", fontSize: 11 }}>
              {pageCount > 0 ? `${pageCount} Pages` : "Edition 1"}
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
