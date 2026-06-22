import Anthropic from "@anthropic-ai/sdk";

// On-demand only — called when the user taps "Idées de plats" on a meal section.
// No automatic invocation: one Claude request per explicit click.

const MEAL_LABELS: Record<string, string> = {
  breakfast: "petit-déjeuner",
  lunch: "déjeuner",
  dinner: "dîner",
};

// Typical share of the daily intake per main meal (snacks ignored).
const MEAL_SHARE: Record<string, number> = {
  breakfast: 0.25,
  lunch: 0.4,
  dinner: 0.35,
};

const anthropic = new Anthropic({ maxRetries: 0 });
const MODELS = ["claude-sonnet-4-6", "claude-haiku-4-5-20251001"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      meal_type,
      goal,
      consumed_calories = 0,
      logged_types = [],
      weekly_avg = 0,
    } = body as {
      meal_type: string;
      goal: number;
      consumed_calories?: number;
      logged_types?: string[];
      weekly_avg?: number;
    };

    if (!meal_type || !MEAL_LABELS[meal_type] || !goal) {
      return Response.json(
        { error: "Paramètres manquants (meal_type, goal)" },
        { status: 400 }
      );
    }

    // Calories left for the rest of the day.
    const remainingDay = goal - consumed_calories;

    // Weekly adjustment: if the 7-day average is above goal, tighten today's
    // budget to compensate; if below, allow a little more room. Capped at ±250.
    const weeklyDelta = weekly_avg > 0 ? goal - weekly_avg : 0;
    const weeklyAdj = Math.max(-250, Math.min(250, Math.round(weeklyDelta * 0.5)));
    const adjustedRemaining = remainingDay + weeklyAdj;

    // Which main meals are still not logged today (including the requested one).
    const mainMeals = ["breakfast", "lunch", "dinner"];
    const stillToEat = mainMeals.filter(
      (m) => !logged_types.includes(m) || m === meal_type
    );
    const shareSum = stillToEat.reduce((s, m) => s + MEAL_SHARE[m], 0) || 1;
    const mealShare = MEAL_SHARE[meal_type] / shareSum;

    // Target for this specific meal, floored so we never suggest absurdly low.
    const rawTarget = Math.round(adjustedRemaining * mealShare);
    const targetCalories = Math.max(150, rawTarget);
    const tight = adjustedRemaining < 250; // little to no budget left

    const mealLabel = MEAL_LABELS[meal_type];

    const prompt = `Tu aides quelqu'un qui suit un déficit calorique et qui n'est PAS un grand cuisinier (plats simples, rapides, peu d'ingrédients, peu de cuisson).

Contexte du jour :
- Objectif calorique journalier : ${goal} kcal
- Déjà consommé aujourd'hui : ${Math.round(consumed_calories)} kcal
- Calories restantes pour la journée : ${Math.round(remainingDay)} kcal
- Repas à préparer : ${mealLabel}
- Budget conseillé pour ce ${mealLabel} : environ ${targetCalories} kcal${
      tight
        ? "\n- ATTENTION : il reste très peu de marge aujourd'hui, propose des plats vraiment légers."
        : ""
    }

Propose 3 à 4 idées de plats SIMPLES pour ce ${mealLabel}, qui tiennent dans le budget conseillé et aident à rester en déficit.

Réponds UNIQUEMENT avec un JSON valide (aucun texte avant ou après), dans ce format exact :
{
  "suggestions": [
    {
      "name": "nom court du plat",
      "description": "courte description avec les ingrédients principaux (1 phrase)",
      "calories": 450
    }
  ]
}

Règles :
- Plats simples et rapides (pas de recette compliquée)
- "calories" est une estimation réaliste en kcal pour la portion proposée
- Reste proche du budget conseillé (${targetCalories} kcal), un peu en dessous est préférable
- Varie les idées (ne propose pas 4 fois la même base)`;

    let lastError: unknown = null;
    for (const model of MODELS) {
      try {
        const response = await anthropic.messages.create({
          model,
          max_tokens: 1024,
          messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
        });

        const textContent = response.content.find((c) => c.type === "text");
        if (!textContent || textContent.type !== "text") {
          return Response.json({ error: "Pas de réponse de l'IA" }, { status: 500 });
        }

        let jsonStr = textContent.text.trim();
        if (jsonStr.startsWith("```")) {
          jsonStr = jsonStr
            .replace(/^```(?:json)?\s*\n?/, "")
            .replace(/\n?```\s*$/, "");
        }

        const result = JSON.parse(jsonStr);

        // Report usage to SitePulse (fire & forget), same as /api/analyze.
        fetch("https://sitepulse-peach.vercel.app/api/anthropic/usage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: response.model,
            input_tokens: response.usage.input_tokens,
            output_tokens: response.usage.output_tokens,
            project: "foodscanner",
          }),
        }).catch(() => {});

        return Response.json({
          suggestions: result.suggestions ?? [],
          target_calories: targetCalories,
        });
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
      {
        error:
          "Le service IA est temporairement surchargé. Réessayez dans quelques instants.",
      },
      { status: 529 }
    );
  } catch (error) {
    console.error("Suggest error:", error);
    return Response.json({ error: "Failed to suggest" }, { status: 500 });
  }
}
