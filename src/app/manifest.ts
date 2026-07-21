import type { MetadataRoute } from "next";

// Rend l'app installable sur l'écran d'accueil (iPhone/Android) en mode
// standalone : plein écran, sans barre d'adresse. Les icônes sont générées
// par src/app/icon.tsx et src/app/apple-icon.tsx (ImageResponse).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Food Scanner",
    short_name: "FoodScanner",
    description:
      "Scannez vos repas par photo avec l'IA et suivez votre déficit calorique",
    start_url: "/",
    display: "standalone",
    background_color: "#f0f4f0",
    theme_color: "#10b981",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
