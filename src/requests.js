import axios from "axios";

// I actually don't need this function
export function getDeck() {
  return axios
    .get("https://deckofcardsapi.com/api/deck/new/shuffle")
    .then((res) => {
      if (res.data.success == true) {
        return res.data.deck_id;
      } else {
        return "Error: server creation of new deck failed";
      }
    })
    .catch((error) => console.error(error));
}
export function deal(playerHand, enemyHand) {
  let tmpDrawn = [[], []];
  return (
    axios
      // I feel like this should be a post, but it fails
      // with an awkward error in that case
      .get(`https://deckofcardsapi.com/api/deck/new/draw/?count=52`)
      .then((res) => {
        if (res.data.success == true) {
          res.data.cards.forEach((card, idx) => {
            tmpDrawn[idx % 2].push(card.code);
          });
          createHand(res.data.deck_id, playerHand, tmpDrawn[0]);
          createHand(res.data.deck_id, enemyHand, tmpDrawn[1]);
        } else {
          return "Error: server failed to draw cards";
        }
      })
      .catch((error) => console.error(error))
  );
}

async function createHand(deckId, handName, cards) {
  const handStr = cards.join(",");
  return axios
    .get(
      `https://deckofcardsapi.com/api/deck/${deckId}/pile/${handName}/add/?cards=${handStr}`
    )
    .then((res) => {
      if (res.data.success === true) {
        return deckId;
      } else {
        return "Error: server failed to create hand " + handName;
      }
    })
    .catch((error) => console.error(error));
}
