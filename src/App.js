import logo from "./logo.svg";
import { useState } from "react";
import "./App.css";
import { deal, getCard, shuffle, addCards } from "./requests";

// The field is mostly going to be just a single card on each side
// but it's also going to have tieBreakers
// where 3 cards are played hidden, and a fourth flipped
// repeating as necessary (I had some pretty long ties in the past)
// this _could_ hypothetically result in a tie
// but I essentially need a list, and then a hidden: prop
// cards come in as an object with various props, I should
// be able to add a .isHidden prop pretty easily.
// I can also just only show cards that are at index % 4 == 0
const pCards = {
  hand: "pPileA",
  discard: "pPileB",
};
const eCards = {
  hand: "ePileA",
  discard: "ePileB",
};

function App() {
  const [deckId, setDeckId] = useState("");
  const [playerCards, setPlayerCards] = useState(pCards);
  const [enemyCards, setEnemyCards] = useState(eCards);
  const [field, setField] = useState([[], []]);
  const [hasWon, setHasWon] = useState("pending");
  const [error, setError] = useState("");
  async function setupNewGame() {
    const deckId = await deal(playerCards.hand, enemyCards.hand);
    setDeckId(deckId);
  }

  async function drawCard(cards, count, setter) {
    let drawn = await getCard(deckId, cards.hand, count);
    if (drawn === undefined) {
      setError("Server failed to retrieve card");
      return [];
    }
    if (drawn.length < count) {
      if ((await shuffle(deckId, cards.discard)) === 0) {
        if (cards.hand[0] === "e") setHasWon("Won");
        if (cards.hand[0] === "p") setHasWon("Lost");
        return [];
      }
      let dDiscard = await getCard(deckId, cards.discard, count - drawn.length);
      if (dDiscard === undefined || dDiscard.length + drawn.length < count) {
        if (cards.hand[0] === "e") setHasWon("Won");
        if (cards.hand[0] === "p") setHasWon("Lost");
        return [];
      }
      return [...drawn, ...dDiscard];
    }
    return drawn;
  }

  function claimCards(discard, field) {
    const set1 = field[0].map((c) => c.code);
    const set2 = field[1].map((c) => c.code);
    addCards(deckId, discard, [...set1, ...set2]);
    setField([[], []]);
  }

  async function war(count) {
    const pCards = await drawCard(playerCards, count, setPlayerCards);
    const eCards = await drawCard(enemyCards, count, setEnemyCards);
    setField([
      [...field[0], ...pCards],
      [...field[1], ...eCards],
    ]);
  }

  async function resolve() {
    const l = field[0].length - 1;
    if (field[0][l].value > field[1][l].value) {
      claimCards(playerCards.discard, field);
    } else if (field[0][l].value < field[1][l].value) {
      claimCards(enemyCards.discard, field);
    } else if (
      field[0][l].value === field[1][l].value &&
      field[0][l].value !== undefined
    ) {
      war(4);
    }
  }

  console.log("OKAY HERE WE GO!");
  console.log(playerCards.hand);
  console.log(enemyCards.hand);

  async function swapPiles(setter, cards) {
    const remaining = await shuffle(deckId, cards.discard);
    setter({ ...cards, hand: cards.discard, discard: cards.hand });
    console.log("REMAINING IS " + remaining);
    if (remaining === 0) {
      // this will explode horribly if
      // the default pile names are changed
      return "halt";
    }
  }

  if (hasWon !== "pending") {
    return <h1>You {hasWon}!</h1>;
  }
  if (error !== "") {
    return <h1>{error}</h1>;
  }

  return (
    <div className="App">
      <h1>Lets Play War!</h1>
      <p>{deckId}</p>
      {field[0].map((c) => (
        <span key={c.code}>{c.code}</span>
      ))}
      <br />
      {field[1].map((c) => (
        <span key={c.code}>{c.code}</span>
      ))}
      <button onClick={() => setupNewGame()}>New Game</button>
      <button onClick={() => war(1)}>war!</button>
      <button onClick={() => resolve()}>resolve</button>
    </div>
  );
}

export default App;
