import { Category } from "../app/_types";

// Converts a puzzle from the JSON format to the Category[] format
export function convertJsonPuzzleToCategories(jsonPuzzle: any): Category[] {
  // The JSON format uses levels 0-3, but Category expects 1-4
  return jsonPuzzle.answers.map((answer: any) => ({
    category: answer.group,
    items: answer.members,
    level: (answer.level + 1) as 1 | 2 | 3 | 4,
  }));
}

// Loads all puzzles from the JSON file (async)
export async function loadAllPuzzles(): Promise<any[]> {
  const res = await fetch("/data/connections.json");
  if (!res.ok) throw new Error("Failed to load puzzles");
  return res.json();
}

// Loads a random puzzle and converts it to Category[]
export async function loadRandomCategories(): Promise<Category[]> {
  const puzzles = await loadAllPuzzles();
  const randomPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
  return convertJsonPuzzleToCategories(randomPuzzle);
}
