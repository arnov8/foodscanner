import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Icône écran d'accueil iOS. Fond plein bord à bord (pas de coins arrondis) :
// iOS applique lui-même son masque d'arrondi.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
        }}
      >
        <div
          style={{
            width: 106,
            height: 106,
            borderRadius: 9999,
            border: "18px solid rgba(255,255,255,0.95)",
          }}
        />
      </div>
    ),
    size
  );
}
