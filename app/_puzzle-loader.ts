import { Category, SchizoBoard } from "../app/_types";
import { shuffleArray } from "./_utils";

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

// Loads 16 random words from the google-10000-english-no-swears.txt file
async function loadRandomWords(): Promise<string[]> {
  const res = await fetch("/data/google-10000-english-no-swears.txt");
  if (!res.ok) throw new Error("Failed to load word list");
  const text = await res.text();
  const words = text.split("\n").map(w => w.trim()).filter(Boolean);
  return shuffleArray(words).slice(0, 16);
}

// Loads a random board: 50% chance regular, 50% chance random
export async function loadRandomSchizoBoard(): Promise<SchizoBoard> {
  if (Math.random() < 0.5) {
    console.log("Loading regular board1");
    // Regular board
    const puzzles = await loadAllPuzzles();
    const randomPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
    return { type: "regular", categories: convertJsonPuzzleToCategories(randomPuzzle) };
  } else {
    // Random board
    console.log("Loading random board1");
    const words = await loadRandomWords();
    return { type: "random", words };
  }
}

