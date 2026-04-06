import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { image, mimeType } = await request.json();

    if (!image) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType || "image/jpeg",
                data: image,
              },
            },
            {
              type: "text",
              text: `Analyse cette photo de repas/aliment. Identifie chaque aliment visible et estime les valeurs nutritionnelles.

Réponds UNIQUEMENT avec un JSON valide (pas de texte avant ou après), dans ce format exact :
{
  "foods": [
    {
      "name": "nom de l'aliment",
      "quantity": 150,
      "unit": "g",
      "calories": 200,
      "protein": 15,
      "carbs": 20,
      "fat": 8
    }
  ],
  "total_calories": 200,
  "total_protein": 15,
  "total_carbs": 20,
  "total_fat": 8
}

Règles :
- Estime les quantités de manière réaliste basé sur ce que tu vois
- Les calories sont en kcal, protéines/glucides/lipides en grammes
- Sois précis sur l'identification des aliments
- Les totaux doivent être la somme des aliments individuels
- Si tu ne peux pas identifier le plat, retourne {"error": "Impossible d'identifier les aliments"}`,
            },
          ],
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return Response.json(
        { error: "No text response from AI" },
        { status: 500 }
      );
    }

    const result = JSON.parse(textContent.text);

    if (result.error) {
      return Response.json({ error: result.error }, { status: 422 });
    }

    return Response.json(result);
  } catch (error) {
    console.error("Analysis error:", error);
    return Response.json({ error: "Failed to analyze image" }, { status: 500 });
  }
}
