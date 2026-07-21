// Règles de calcul du suivi de déficit — partagées client + serveur.
//
// Principe central (règle produit) : une journée n'entre dans les moyennes et
// cumuls QUE si elle a été réellement suivie. Un jour sans repas loggé — ou
// avec juste un snack — n'est JAMAIS compté comme 0 kcal : il est exclu des
// calculs. Compter 0 gonflerait artificiellement le déficit apparent et
// fausserait les suggestions et le TDEE réel.

export type MealLike = {
  date: string;
  meal_type: string;
  total_calories: number;
  total_protein: number;
};

export type DaySummary = {
  date: string;
  calories: number;
  protein: number;
  mainMeals: number;
  tracked: boolean;
};

const MAIN_MEAL_TYPES = ["breakfast", "lunch", "dinner"];

// Jour « suivi » : au moins 2 repas principaux loggés, OU un total ≥ 1000 kcal
// (journée saisie en une seule grosse entrée). En dessous, la donnée est trop
// partielle pour entrer dans une moyenne.
export const TRACKED_MIN_MAIN_MEALS = 2;
export const TRACKED_MIN_CALORIES = 1000;

export function summarizeDays(meals: MealLike[], dates: string[]): DaySummary[] {
  return dates.map((date) => {
    const dayMeals = meals.filter((m) => m.date === date);
    const calories = dayMeals.reduce((s, m) => s + m.total_calories, 0);
    const protein = dayMeals.reduce((s, m) => s + m.total_protein, 0);
    const mainMeals = MAIN_MEAL_TYPES.filter((t) =>
      dayMeals.some((m) => m.meal_type === t)
    ).length;
    const tracked =
      mainMeals >= TRACKED_MIN_MAIN_MEALS || calories >= TRACKED_MIN_CALORIES;
    return { date, calories, protein, mainMeals, tracked };
  });
}

// Moyenne kcal sur les jours suivis uniquement. `excludeDate` sert à écarter
// le jour en cours : une journée pas terminée est incomplète par définition,
// elle comptera dans la moyenne dès le lendemain.
export function averageTrackedCalories(
  days: DaySummary[],
  excludeDate?: string
): { avg: number; avgProtein: number; trackedDays: number } {
  const tracked = days.filter((d) => d.tracked && d.date !== excludeDate);
  if (tracked.length === 0) return { avg: 0, avgProtein: 0, trackedDays: 0 };
  return {
    avg: Math.round(tracked.reduce((s, d) => s + d.calories, 0) / tracked.length),
    avgProtein: Math.round(
      tracked.reduce((s, d) => s + d.protein, 0) / tracked.length
    ),
    trackedDays: tracked.length,
  };
}

// ==================== Poids & TDEE réel ====================

export type WeightPoint = { date: string; weight: number };

export const KCAL_PER_KG = 7700;

// Pesées minimales pour qu'une pente soit du signal et pas du bruit
// (le poids brut fluctue de ±1-2 kg d'eau/glycogène au quotidien).
export const TREND_MIN_POINTS = 4;
export const TREND_MIN_SPAN_DAYS = 10;

const dayIndex = (date: string) =>
  Math.round(Date.parse(date + "T00:00:00Z") / 86_400_000);

// Tendance lissée : moyenne des pesées des 7 derniers jours de la fenêtre
// (le « poids tendance », insensible aux fluctuations d'eau), et pente en
// kg/semaine par régression linéaire sur toute la fenêtre fournie (~28 j).
export function weightTrend(entries: WeightPoint[]): {
  trendWeight: number | null;
  slopeKgPerWeek: number | null;
  points: number;
  spanDays: number;
} {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const points = sorted.length;
  if (points === 0)
    return { trendWeight: null, slopeKgPerWeek: null, points: 0, spanDays: 0 };

  const lastIdx = dayIndex(sorted[points - 1].date);
  const spanDays = lastIdx - dayIndex(sorted[0].date);

  const recent = sorted.filter((e) => lastIdx - dayIndex(e.date) < 7);
  const trendWeight =
    Math.round(
      (recent.reduce((s, e) => s + e.weight, 0) / recent.length) * 10
    ) / 10;

  if (points < TREND_MIN_POINTS || spanDays < TREND_MIN_SPAN_DAYS) {
    return { trendWeight, slopeKgPerWeek: null, points, spanDays };
  }

  // Régression linéaire poids = f(jour)
  const xs = sorted.map((e) => dayIndex(e.date));
  const ys = sorted.map((e) => e.weight);
  const xMean = xs.reduce((s, x) => s + x, 0) / points;
  const yMean = ys.reduce((s, y) => s + y, 0) / points;
  let num = 0;
  let den = 0;
  for (let i = 0; i < points; i++) {
    num += (xs[i] - xMean) * (ys[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  const slopePerDay = den > 0 ? num / den : 0;
  return {
    trendWeight,
    slopeKgPerWeek: Math.round(slopePerDay * 7 * 100) / 100,
    points,
    spanDays,
  };
}

// TDEE réel = apport moyen loggé + énergie tirée des réserves (7700 kcal/kg
// perdu). Propriété clé : un biais systématique d'estimation des repas par
// l'IA est absorbé dans le résultat — si les repas sont sous-estimés de 15 %,
// le TDEE apparent baisse d'autant et l'objectif reste cohérent avec ce que
// l'utilisateur logge réellement.
export function realTdee(avgIntake: number, slopeKgPerWeek: number): number {
  return Math.round(avgIntake - (slopeKgPerWeek / 7) * KCAL_PER_KG);
}

// Le TDEE réel ne pilote l'objectif que s'il repose sur assez de données ;
// sinon on retombe sur la formule Mifflin-St Jeor. Borné à ±25 % du TDEE
// formule : garde-fou contre les données aberrantes (pesées manquantes,
// semaine de vacances non loggée...).
export const ADAPTIVE_MIN_TRACKED_DAYS = 10;

export function adaptiveTdee(params: {
  formulaTdee: number;
  avgIntake: number;
  trackedDays: number;
  slopeKgPerWeek: number | null;
}): { tdee: number; source: "reel" | "formule" } {
  const { formulaTdee, avgIntake, trackedDays, slopeKgPerWeek } = params;
  if (
    slopeKgPerWeek === null ||
    trackedDays < ADAPTIVE_MIN_TRACKED_DAYS ||
    avgIntake <= 0
  ) {
    return { tdee: formulaTdee, source: "formule" };
  }
  const raw = realTdee(avgIntake, slopeKgPerWeek);
  const clamped = Math.min(
    Math.round(formulaTdee * 1.25),
    Math.max(Math.round(formulaTdee * 0.75), raw)
  );
  return { tdee: clamped, source: "reel" };
}
