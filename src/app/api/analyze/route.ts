import Anthropic from "@anthropic-ai/sdk";

const NUTRITION_PROMPT = `Analyse ce repas/aliment. Identifie chaque aliment et estime les valeurs nutritionnelles.

Reponds UNIQUEMENT avec un JSON valide (pas de texte avant ou apres), dans ce format exact :
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

Regles :
- Estime les quantites de maniere realiste (portion standard si pas de photo)
- Les calories sont en kcal, proteines/glucides/lipides en grammes
- Sois precis sur l'identification des aliments
- Les totaux doivent etre la somme des aliments individuels
- Si tu ne peux pas identifier le plat, retourne {"error": "Impossible d'identifier les aliments"}`;

const anthropic = new Anthropic();

const MODELS = ["claude-sonnet-4-20250514", "claude-haiku-4-5-20251001"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image, mimeType, text } = body;

    if (!image && !text) {
      return Response.json(
        { error: "Fournissez une image ou une description" },
        { status: 400 }
      );
    }

    const content: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

    // Add image if provided
    if (image) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mimeType || "image/jpeg",
          data: image,
        },
      });
      content.push({
        type: "text",
        text: `Analyse cette photo de repas/aliment. ${NUTRITION_PROMPT}`,
      });
    } else if (text) {
      content.push({
        type: "text",
        text: `Voici la description d'un repas : "${text}"\n\n${NUTRITION_PROMPT}`,
      });
    }

    // Try each model, falling back if overloaded
    let lastError: unknown = null;
    for (const model of MODELS) {
      try {
        const response = await anthropic.messages.create({
          model,
          max_tokens: 1024,
          messages: [{ role: "user", content }],
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
      } catch (err: unknown) {
        lastError = err;
        const isOverloaded =
          err instanceof Anthropic.APIError && err.status === 529;
        if (!isOverloaded) throw err;
        // Overloaded — try next model
      }
    }

    console.error("All models overloaded:", lastError);
    return Response.json(
      { error: "Le service IA est temporairement surchargé. Réessayez dans quelques instants." },
      { status: 529 }
    );
  } catch (error) {
    console.error("Analysis error:", error);
    return Response.json({ error: "Failed to analyze" }, { status: 500 });
  }
}
