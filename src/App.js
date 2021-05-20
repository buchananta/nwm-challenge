import logo from "./logo.svg";
import { useState } from "react";
import "./App.css";
import { getDeck, deal } from "./requests";

// the server handles most of the cards
// we just need an ID string to reference them
// And _maybe_ a tmpDrawn [] to hold cards
// inbetween the different piles?
const defaultDeck = {
  deckId: "",
  // is a little wonky to keep all these constants in state
  // but I already did it.
  playerHand: "ph_pile",
  playerDiscard: "pd_pile",
  enemyHand: "eh_pile",
  enemyDiscard: "ed_pile",
};

// The field is mostly going to be just a single card on each side
// but it's also going to have tieBreakers
// where 3 cards are played hidden, and a fourth flipped
// repeating as necessary (I had some pretty long ties in the past)
// this _could_ hypothetically result in a tie
// but I essentially need a list, and then a hidden: prop
// cards come in as an object with various props, I should
// be able to add a .isHidden prop pretty easily.
// I can also just only show cards that are at index % 4 == 0
const defaultField = {
  playerCards: [],
  enemyCards: [],
};

function App() {
  const [deck, setDeck] = useState(defaultDeck);
  const [field, setField] = useState(defaultField);
  console.log("HANDS" + deck.playerHand + deck.enemyHand);

  async function newGame() {
    const deckId = await getDeck();
    console.log("DECK ID IS" + deckId);
    setDeck({ ...defaultDeck, deckId });
  }

  async function setupNewGame(deck) {
    const deckId = await deal(deck.playerHand, deck.enemyHand);
    setDeck({ ...deck, deckId });
  }

  return (
    <div className="App">
      <h1>Lets Play War!</h1>
      <p>{deck.deckId}</p>
      <button onClick={() => setupNewGame(deck)}>New Game</button>
    </div>
  );
}

export default App;
