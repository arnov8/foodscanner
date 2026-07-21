import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// Icône de l'app : anneau blanc sur dégradé émeraude — reprend l'identité
// visuelle du CalorieRing du dashboard. Générée au build, aucun asset binaire.
export default function Icon() {
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
          borderRadius: 96,
        }}
      >
        <div
          style={{
            width: 300,
            height: 300,
            borderRadius: 9999,
            border: "52px solid rgba(255,255,255,0.95)",
          }}
        />
      </div>
    ),
    size
  );
}
