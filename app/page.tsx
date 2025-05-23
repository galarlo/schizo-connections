"use client";

import { useCallback, useState } from "react";
import ControlButton from "./_components/button/control-button";
import Grid from "./_components/game/grid";
import GameLostModal from "./_components/modal/game-lost-modal";
import GameWonModal from "./_components/modal/game-won-modal";
import Popup from "./_components/popup";
import useAnimation from "./_hooks/use-animation";
import useGameLogic from "./_hooks/use-game-logic";
import usePopup from "./_hooks/use-popup";
import { SubmitResult, Word } from "./_types";
import { getPerfection } from "./_utils";

export default function Home() {
  const [popupState, showPopup] = usePopup();
  const {
    gameWords,
    selectedWords,
    clearedCategories,
    mistakesRemaining,
    isWon,
    isLost,
    guessHistoryRef,
    selectWord,
    shuffleWords,
    deselectAllWords,
    getSubmitResult,
    handleWin,
    handleLoss,
    revealBoardType,
    userBoardTypeGuess,
    actualBoardType,
    revealBoardTypeHandler,
  } = useGameLogic();

  const [showGameWonModal, setShowGameWonModal] = useState(false);
  const [showGameLostModal, setShowGameLostModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showBoardTypePrompt, setShowBoardTypePrompt] = useState(false);
  const [showBoardTypeResult, setShowBoardTypeResult] = useState(false);

  const {
    guessAnimationState,
    wrongGuessAnimationState,
    animateGuess,
    animateWrongGuess,
  } = useAnimation();

  // Show board type prompt when game ends
  if ((isWon || isLost) && !revealBoardType && !showBoardTypePrompt) {
    setShowBoardTypePrompt(true);
  }

  const handleSubmit = async () => {
    setSubmitted(true);
    await animateGuess(selectedWords);

    const result: SubmitResult = getSubmitResult();

    switch (result.result) {
      case "same":
        showPopup("You've already guessed that!");
        break;
      case "one-away":
        animateWrongGuess();
        showPopup("One away...");
        break;
      case "loss":
        showPopup("Better luck next time!");
        await handleLoss();
        setShowGameLostModal(true);
        break;
      case "win":
        showPopup(getPerfection(mistakesRemaining));
        await handleWin();
        setShowGameWonModal(true);
        break;
      case "incorrect":
        animateWrongGuess();
        break;
    }
    setSubmitted(false);
  };

  const onClickCell = useCallback(
    (word: Word) => {
      selectWord(word);
    },
    [selectWord]
  );

  const renderControlButtons = () => {
    const showResultsWonButton = (
      <ControlButton
        text="Show Results"
        onClick={() => {
          setShowGameWonModal(true);
        }}
      />
    );

    const showResultsLostButton = (
      <ControlButton
        text="Show Results"
        onClick={() => {
          setShowGameLostModal(true);
        }}
      />

    );

    const inProgressButtons = (
      <div className="flex gap-2 mb-12">
        <ControlButton
          text="Shuffle"
          onClick={shuffleWords}
          unclickable={submitted}
        />
        <ControlButton
          text="Deselect All"
          onClick={deselectAllWords}
          unclickable={selectedWords.length === 0 || submitted}
        />
        <ControlButton
          text="Submit"
          unclickable={selectedWords.length !== 4 || submitted}
          onClick={handleSubmit}
        />
      </div>
    );

    if (isWon) {
      return showResultsWonButton;
    } else if (isLost) {
      return showResultsLostButton;
    } else {
      return inProgressButtons;
    }
  };

  // Board type guessing prompt and reveal
  const renderBoardTypePrompt = () => {
    if (!showBoardTypePrompt || revealBoardType) return null;
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white p-8 rounded shadow-lg flex flex-col items-center">
          <h2 className="text-lg font-bold mb-4">
            Was this a regular board or a random board?
          </h2>
          <div className="flex gap-4">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={() => {
                revealBoardTypeHandler("regular");
                setShowBoardTypePrompt(false);
                setShowBoardTypeResult(true);
              }}
            >
              Regular
            </button>
            <button
              className="bg-purple-500 text-white px-4 py-2 rounded"
              onClick={() => {
                revealBoardTypeHandler("random");
                setShowBoardTypePrompt(false);
                setShowBoardTypeResult(true);
              }}
            >
              Random
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderBoardTypeResult = () => {
    if (!showBoardTypeResult || !revealBoardType) return null;
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white p-8 rounded shadow-lg flex flex-col items-center">
          <h2 className="text-lg font-bold mb-4">
            The answer was:{" "}
            <span className="font-mono">{actualBoardType?.toUpperCase()}</span>
          </h2>
          {userBoardTypeGuess === actualBoardType ? (
            <p className="text-green-600 font-semibold">You guessed correctly!</p>
          ) : (
            <p className="text-red-600 font-semibold">You guessed wrong.</p>
          )}
          <button
            className="mt-6 bg-gray-700 text-white px-4 py-2 rounded"
            onClick={() => setShowBoardTypeResult(false)}
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col items-center w-11/12 md:w-3/4 lg:w-7/12 mx-auto mt-14">
        <h1 className="text-black text-4xl font-semibold my-4 ml-4">
          Connections
        </h1>
        <hr className="mb-4 md:mb-4 w-full"></hr>
        <h1 className="text-black mb-4">Create four groups of four!</h1>
        <div className="relative w-full">
          <Popup show={popupState.show} message={popupState.message} />
          <Grid
            words={gameWords}
            selectedWords={selectedWords}
            onClick={onClickCell}
            clearedCategories={clearedCategories}
            guessAnimationState={guessAnimationState}
            wrongGuessAnimationState={wrongGuessAnimationState}
          />
        </div>
        <h2 className="text-black my-4 md:my-8 mx-8">
          Mistakes Remaining:{" "}
          {mistakesRemaining > 0 ? Array(mistakesRemaining).fill("•") : ""}
        </h2>
        {renderControlButtons()}
      </div>
      {renderBoardTypePrompt()}
      {renderBoardTypeResult()}
      <GameWonModal
        isOpen={showGameWonModal}
        onClose={() => setShowGameWonModal(false)}
        guessHistory={guessHistoryRef.current}
        perfection={getPerfection(mistakesRemaining)}
      />
      <GameLostModal
        isOpen={showGameLostModal}
        onClose={() => setShowGameLostModal(false)}
        guessHistory={guessHistoryRef.current}
      />
    </>
  );
}
