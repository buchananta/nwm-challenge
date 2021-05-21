import logo from "./logo.svg";
import { useState } from "react";
import "./App.css";
import { deal, getCard, shuffle, addCards } from "./requests";

// structure for player and enemy cards
// its all kept on the endpoint, so this just
// basically just points to 'piles' on the backend
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
    const deckId = await deal(playerCards.hand, enemyCards.hand);
    setDeckId(deckId);
    setPlayerCards(pCards);
    setEnemyCards(eCards);
    setHasWon("pending");
    setField([[], []]);
    setError("");
  }

  async function drawCard(cards, count, setter) {
    let drawn = await getCard(deckId, cards.hand, count);
    if (drawn === undefined) {
      setError("Server failed to retrieve card");
      return [];
    }
    if (drawn.length < count) {
      // we failed to get the cards, so time to
      // swap piles, and check if won / lost
      if ((await shuffle(deckId, cards.discard)) === 0) {
        if (cards.hand[0] === "e") setHasWon("Won");
        if (cards.hand[0] === "p") setHasWon("Lost");
        return [];
      }
      let dDiscard = await getCard(deckId, cards.discard, count - drawn.length);
      setter({ hand: cards.discard, discard: cards.hand });
      if (dDiscard === undefined || dDiscard.length + drawn.length < count) {
        // depends on the naming of piles
        if (cards === enemyCards) setHasWon("Won");
        if (cards === playerCards) setHasWon("Lost");
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

  function resolve() {
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
  // If I was going to continue this.
  // The next step would be breaking
  // this into components.
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
      {(deckId == "" || hasWon !== "pending") && (
        <button onClick={() => setupNewGame()}>New Game</button>
      )}
      {field[0].length === 0 && deckId != "" && hasWon == "pending" && (
        <button onClick={() => war(1)}>war!</button>
      )}
      {field[0].length !== 0 && deckId && hasWon == "pending" && (
        <button onClick={() => resolve()}>resolve</button>
      )}
    </div>
  );
}

export default App;
