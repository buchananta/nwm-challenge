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

  async function setupNewGame() {
    const deckId = await deal(playerCards.hand, enemyCards.hand);
    setDeckId(deckId);
  }

  async function drawCard(cards, count, setter) {
    const drawn = await getCard(deckId, cards.hand, count);
    if (drawn === undefined || drawn.length < count) {
      swapPiles(setter, cards);
      if (drawn.length) {
        return [...drawn, ...drawCard(cards, count - drawn.length, setter)];
      } else return drawCard(cards, count, setter);
    }
    return drawn;
  }

  function claimCards(discard, field) {
    const set1 = field[0].map((c) => c.code).join(",");
    const set2 = field[1].map((c) => c.code).join(",");
    addCards(deckId, discard, set1 + "," + set2);
  }

  async function war(count) {
    const pCards = await drawCard(playerCards, count, setPlayerCards);
    const eCards = await drawCard(enemyCards, count, setEnemyCards);
    setField([...field[0], ...pCards], [...field[1], ...eCards]);
  }

  async function resolve() {
    const l = field[0].length - 1;
    if (field[0][l].value > field[1][l].value) {
      claimCards(playerCards.discard, field);
    } else if (field[0][l].value < field[1][l].value) {
      claimCards(enemyCards.discard, field);
    } else {
      war(4);
    }
  }

  async function swapPiles(setter, cards) {
    setter({ ...cards, hand: cards.discard, discard: cards.hand });
    const remaining = await shuffle(deckId, cards.hand);
    if (remaining === 0) {
      if (cards.hand[0] === "e") setHasWon("Won");
      if (cards.hand[0] === "p") setHasWon("Lost");
    }
  }

  if (hasWon !== "pending") {
    return <h1>You {hasWon}!</h1>;
  }

  return (
    <div className="App">
      <h1>Lets Play War!</h1>
      <p>{deckId}</p>
      <button onClick={() => setupNewGame()}>New Game</button>
    </div>
  );
}

export default App;
