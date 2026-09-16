import { ImageResponse } from "next/og";

export const alt = "Vasuki Publication — Public Web Platform for VasukiSquare Books";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#f8fafc",
          color: "#0f172a",
          padding: "60px 72px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Ambient background gradients */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -80,
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
            bottom: -120,
            left: -80,
            width: 450,
            height: 450,
            borderRadius: "50%",
            backgroundColor: "#f1f5f9",
            opacity: 0.8,
          }}
        />

        {/* Top Branding Row */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 6px -1px rgba(5, 150, 105, 0.2)",
                marginRight: 12,
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  border: "3px solid #ffffff",
                  borderRadius: 4,
                  display: "flex",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                fontSize: 24,
                fontWeight: 900,
                color: "#0f172a",
                letterSpacing: -0.5,
              }}
            >
              <span>Vasuki</span>
              <span style={{ color: "#059669" }}>Publication</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#ecfdf5",
              border: "1px solid #a7f3d0",
              padding: "6px 16px",
              borderRadius: 9999,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#047857",
                letterSpacing: 1,
              }}
            >
              VASUKISQUARE ENGINE
            </span>
          </div>
        </div>

        {/* Center Main Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: 960,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 52,
              fontWeight: 900,
              color: "#0f172a",
              lineHeight: 1.15,
              letterSpacing: -1.5,
              marginBottom: 18,
            }}
          >
            Public Web Reading Platform for VasukiSquare Books
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: "#475569",
              lineHeight: 1.45,
            }}
          >
            Zero-PDF native web streaming, rich typography, responsive A4 reader geometry, and instant topic discovery.
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1.5px solid #e2e8f0",
            paddingTop: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", marginRight: 24 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#059669", marginRight: 8, display: "flex" }} />
              <span style={{ fontWeight: 600, color: "#334155", fontSize: 15 }}>Zero PDF Dependency</span>
            </div>
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", marginRight: 24 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#059669", marginRight: 8, display: "flex" }} />
              <span style={{ fontWeight: 600, color: "#334155", fontSize: 15 }}>Native MongoDB Rendering</span>
            </div>
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#059669", marginRight: 8, display: "flex" }} />
              <span style={{ fontWeight: 600, color: "#334155", fontSize: 15 }}>Instant Offline Queue</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#ffffff",
              border: "1px solid #cbd5e1",
              padding: "8px 18px",
              borderRadius: 8,
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            }}
          >
            <span
              style={{
                fontSize: 14,
                color: "#0f172a",
                fontWeight: 700,
              }}
            >
              Explore Catalog →
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

