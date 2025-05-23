import { useEffect, useMemo, useRef, useState } from "react";
import { Category, SchizoBoard, SubmitResult, Word } from "../_types";
import { delay, shuffleArray } from "../_utils";

export default function useGameLogic() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [gameWords, setGameWords] = useState<Word[]>([]);
  const [boardLoaded, setBoardLoaded] = useState(false);
  const [schizoBoard, setSchizoBoard] = useState<SchizoBoard | null>(null);
  const selectedWords = useMemo(
    () => gameWords.filter((item: Word) => item.selected),
    [gameWords]
  );
  const [clearedCategories, setClearedCategories] = useState<Category[]>([]);
  const [isWon, setIsWon] = useState(false);
  const [isLost, setIsLost] = useState(false);
  const [mistakesRemaining, setMistakesRemaning] = useState(4);
  const guessHistoryRef = useRef<Word[][]>([]);

  // Add state to track if the board type should be revealed
  const [revealBoardType, setRevealBoardType] = useState(false);
  // Add state to track user's guess ("regular" or "random")
  const [userBoardTypeGuess, setUserBoardTypeGuess] = useState<"regular" | "random" | null>(null);

  // Only call loadRandomSchizoBoard ONCE per game session
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!schizoBoard) {
        const board = await import("../_puzzle-loader").then(m => m.loadRandomSchizoBoard());
        if (!cancelled) setSchizoBoard(board);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Set up categories and gameWords when schizoBoard is loaded
  useEffect(() => {
    if (!schizoBoard) return;
    if (schizoBoard.type === "regular") {
      setCategories(schizoBoard.categories);
      const words: Word[] = schizoBoard.categories
        .map((category: Category) =>
          category.items.map((word: string) => ({ word: word, level: category.level }))
        )
        .flat();
      setGameWords(shuffleArray(words));
    } else {
      setCategories([]); // No categories for random board
      const words: Word[] = schizoBoard.words.map((word: string) => ({ word, level: 1 }));
      setGameWords(shuffleArray(words));
    }
    setBoardLoaded(true);
  }, [schizoBoard]);

  const selectWord = (word: Word): void => {
    const newGameWords = gameWords.map((item: Word) => {
      // Only allow word to be selected if there are less than 4 selected words
      if (word.word === item.word) {
        return {
          ...item,
          selected: selectedWords.length < 4 ? !item.selected : false,
        };
      } else {
        return item;
      }
    });

    setGameWords(newGameWords);
  };

  const shuffleWords = () => {
    setGameWords([...shuffleArray(gameWords)]);
  };

  const deselectAllWords = () => {
    setGameWords(
      gameWords.map((item: Word) => {
        return { ...item, selected: false };
      })
    );
  };

  const getSubmitResult = (): SubmitResult => {
    const sameGuess = guessHistoryRef.current.some((guess: Word[]) =>
      guess.every((word: Word) => selectedWords.includes(word))
    );

    if (sameGuess) {
      console.log("Same!");
      return { result: "same" };
    }

    guessHistoryRef.current.push(selectedWords);

    // If there are no categories (random board), use random outcome
    if (categories.length === 0) {
      // If only 4 words remain, always treat as correct
      if (gameWords.length === 4) {
        const hiddenCategory = {
          category: `?${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          items: selectedWords.map(w => w.word),
          level: (clearedCategories.length + 1) as 1 | 2 | 3 | 4,
        };
        setClearedCategories([...clearedCategories, hiddenCategory]);
        setGameWords([]);
        return { result: "win" };
      }
      // Decrement mistakesRemaining for every guess attempt (except 'same')
      setMistakesRemaning(mistakesRemaining - 1);
      if (mistakesRemaining === 1) {
        return { result: "loss" };
      }
      const rand = Math.random();
      if (rand < 1/3) {
        // 33% nothing happens
        return { result: "incorrect" };
      } else if (rand < 2/3) {
        // 33% one-away
        return { result: "one-away" };
      } else {
        // 33% treat as correct category (remove words, show hidden bar)
        const hiddenCategory = {
          category: `?${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          items: selectedWords.map(w => w.word),
          level: (clearedCategories.length + 1) as 1 | 2 | 3 | 4,
        };
        setClearedCategories([...clearedCategories, hiddenCategory]);
        setGameWords(gameWords.filter((item: Word) => !selectedWords.some(w => w.word === item.word)));
        if (clearedCategories.length === 3) {
          return { result: "win" };
        } else {
          return { result: "correct" };
        }
      }
    }

    const likenessCounts = categories.map((category: Category) => {
      return selectedWords.filter((item: Word) => category.items.includes(item.word))
        .length;
    });

    const maxLikeness = Math.max(...likenessCounts);
    const maxIndex = likenessCounts.indexOf(maxLikeness);

    if (maxLikeness === 4) {
      return getCorrectResult(categories[maxIndex]);
    } else {
      return getIncorrectResult(maxLikeness);
    }
  };

  const getCorrectResult = (category: Category): SubmitResult => {
    setClearedCategories([...clearedCategories, category]);
    setGameWords(
      gameWords.filter((item: Word) => !category.items.includes(item.word))
    );

    if (clearedCategories.length === 3) {
      return { result: "win" };
    } else {
      return { result: "correct" };
    }
  };

  const getIncorrectResult = (maxLikeness: number): SubmitResult => {
    setMistakesRemaning(mistakesRemaining - 1);

    if (mistakesRemaining === 1) {
      return { result: "loss" };
    } else if (maxLikeness === 3) {
      return { result: "one-away" };
    } else {
      return { result: "incorrect" };
    }
  };

  const handleLoss = async () => {
    const remainingCategories = categories.filter(
      (category: Category) => !clearedCategories.includes(category)
    );

    deselectAllWords();

    for (const category of remainingCategories) {
      await delay(1000);
      setClearedCategories((prevClearedCategories: Category[]) => [
        ...prevClearedCategories,
        category,
      ]);
      setGameWords((prevGameWords: Word[]) =>
        prevGameWords.filter((item: Word) => !category.items.includes(item.word))
      );
    }

    await delay(1000);
    setIsLost(true);
  };

  const handleWin = async () => {
    await delay(1000);
    setIsWon(true);
  };

  // Helper to get the display categories (hide names unless revealed)
  const getDisplayCategories = () => {
    if (revealBoardType && schizoBoard?.type === "regular") {
      // Reveal real category names
      return clearedCategories;
    } else {
      // Hide all category names (set to '?<unique>')
      return clearedCategories.map((cat, idx) => ({
        ...cat,
        category: `?${cat.category ? `-${cat.category}` : ''}-${idx}`,
      }));
    }
  };

  // When the game is won or lost, prompt the user to guess board type
  useEffect(() => {
    if ((isWon || isLost) && !revealBoardType) {
      // Show prompt to user (handled in UI)
      // After user guesses, call revealBoardTypeHandler
    }
  }, [isWon, isLost, revealBoardType]);

  // Handler to be called from UI when user makes their guess
  const revealBoardTypeHandler = (guess: "regular" | "random") => {
    setUserBoardTypeGuess(guess);
    setRevealBoardType(true);
  };

  return {
    gameWords,
    selectedWords,
    clearedCategories: getDisplayCategories(),
    mistakesRemaining,
    isWon,
    isLost,
    guessHistoryRef,
    selectWord,
    shuffleWords,
    deselectAllWords,
    getSubmitResult,
    handleLoss,
    handleWin,
    revealBoardType, // for UI
    userBoardTypeGuess, // for UI
    actualBoardType: schizoBoard?.type, // for UI
    revealBoardTypeHandler, // for UI
  };
}
