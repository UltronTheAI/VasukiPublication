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
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#001e2b",
            color: "#ffffff",
            fontSize: 48,
            fontWeight: "bold",
          }}
        >
          Vasuki Publication — Book Not Found
        </div>
      ),
      { ...size }
    );
  }

  const cover = await getCoverForBook(book.id || book._id || "");
  const design = (cover?.design || {}) as CoverDesignPlan;

  const title = book.title;
  const subtitle = book.subtitle || book.description || "";
  const category = book.category || book.discovery?.category || "TECHNICAL HANDBOOK";
  const author = book.author || "VasukiSquare Editorial";
  const pageCount = book.page_count || 0;
  const accentColor = design.accent_color || "#00ed64";
  const bgColor = design.background_color || "#001e2b";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          backgroundColor: "#001e2b",
          color: "#ffffff",
          padding: 56,
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background ambient radial glow */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            backgroundColor: accentColor,
            opacity: 0.15,
            filter: "blur(80px)",
          }}
        />

        {/* Left: Reconstructed Book Cover Mini View */}
        <div
          style={{
            width: 340,
            height: 490,
            backgroundColor: bgColor,
            borderRadius: 16,
            border: `2px solid ${accentColor}40`,
            padding: 28,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
            position: "relative",
          }}
        >
          {/* Top category in cover */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: "bold",
                color: accentColor,
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              {category}
            </span>
          </div>

          {/* Title in cover */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                backgroundColor: accentColor,
                marginBottom: 16,
                borderRadius: 2,
              }}
            />
            <h2
              style={{
                fontSize: 26,
                fontWeight: "bold",
                lineHeight: 1.25,
                color: "#ffffff",
                margin: 0,
              }}
            >
              {title}
            </h2>
          </div>

          {/* Footer in cover */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(255,255,255,0.15)",
              paddingTop: 12,
              fontSize: 13,
              color: "#a8b3bc",
            }}
          >
            <span>{author}</span>
            <span>{pageCount > 0 ? `${pageCount} Pages` : "Edition 1"}</span>
          </div>
        </div>

        {/* Right: Social Headline & Vasuki Brand Identity */}
        <div
          style={{
            flex: 1,
            marginLeft: 48,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Top Brand Tag */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                padding: "8px 16px",
                borderRadius: 30,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: "bold",
                  color: "#ffffff",
                  letterSpacing: 1,
                }}
              >
                VASUKI PUBLICATION
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: accentColor,
                  marginLeft: 10,
                  fontWeight: "bold",
                }}
              >
                • VasukiSquare Engine
              </span>
            </div>
          </div>

          {/* Center Title & Subtitle */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h1
              style={{
                fontSize: 44,
                fontWeight: "bold",
                color: "#ffffff",
                lineHeight: 1.18,
                letterSpacing: -1,
                marginBottom: 16,
              }}
            >
              {title}
            </h1>
            {subtitle ? (
              <p
                style={{
                  fontSize: 20,
                  color: "#a8b3bc",
                  lineHeight: 1.4,
                  margin: 0,
                }}
              >
                {subtitle.length > 140 ? `${subtitle.slice(0, 140)}...` : subtitle}
              </p>
            ) : null}
          </div>

          {/* Bottom Footer Info */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(255, 255, 255, 0.12)",
              paddingTop: 20,
            }}
          >
            <div style={{ display: "flex", gap: 24, fontSize: 15, color: "#e1e5e8" }}>
              <span>Category: <strong>{category}</strong></span>
              {pageCount > 0 && <span>Length: <strong>{pageCount} Pages</strong></span>}
            </div>
            <span
              style={{
                fontSize: 14,
                color: accentColor,
                fontWeight: "bold",
              }}
            >
              Read Online on Web
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

