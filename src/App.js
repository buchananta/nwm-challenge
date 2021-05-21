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

const VAL = {
  ACE: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  JACK: 11,
  QUEEN: 12,
  KING: 13,
};

function App() {
  const [deckId, setDeckId] = useState("");
  const [playerCards, setPlayerCards] = useState(pCards);
  const [enemyCards, setEnemyCards] = useState(eCards);
  const [field, setField] = useState([[], []]);
  const [hasWon, setHasWon] = useState("pending");
  const [error, setError] = useState("");
  async function setupNewGame() {
    setError("");
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
      setter({ hand: cards.discard, discard: cards.hand });
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
    if (VAL[field[0][l].value] > VAL[field[1][l].value]) {
      claimCards(playerCards.discard, field);
    } else if (VAL[field[0][l].value] < VAL[field[1][l].value]) {
      claimCards(enemyCards.discard, field);
    } else if (
      field[0][l].value === field[1][l].value &&
      field[0][l].value !== undefined
    ) {
      war(4);
    }
  }

  if (error !== "") {
    return (
      <div className="App">
        <h1>{error}</h1>
        <button onClick={setupNewGame}>Start New Game</button>
      </div>
    );
  }

  return (
    <div className="App">
      <h1>Lets Play War!</h1>
      <p>{deckId}</p>
      {hasWon !== "pending" && <h2>You {hasWon}!</h2>}
      {hasWon === "pending" && (
        <div className="Field">
          {field[1].map((c, i) => {
            if (i % 4 == 0) {
              return <img key={c.code} alt={c.code} src={c.image} />;
            } else {
              return <img key={c.code} alt={"hidden card"} src={"back.png"} />;
            }
          })}
          <br />
          {field[0].map((c, i) => {
            if (i % 4 == 0) {
              return <img key={c.code} alt={c.code} src={c.image} />;
            } else {
              return <img key={c.code} alt={"hidden card"} src={"back.png"} />;
            }
          })}
        </div>
      )}
      <br />
      {deckId == "" && <button onClick={() => setupNewGame()}>New Game</button>}
      {field[0].length === 0 && deckId != "" && (
        <button onClick={() => war(1)}>war!</button>
      )}
      {field[0].length !== 0 && (
        <button onClick={() => resolve()}>resolve</button>
      )}
    </div>
  );
}

export default App;
