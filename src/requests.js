import axios from "axios";

export function deal(playerHand, enemyHand) {
  let tmpDrawn = [[], []];
  return (
    axios
      // I feel like this should be a post, but it fails
      // with an awkward error in that case
      .get(`https://deckofcardsapi.com/api/deck/new/draw/?count=6`)
      .then((res) => {
        if (res.data.success === true) {
          res.data.cards.forEach((card, idx) => {
            tmpDrawn[idx % 2].push(card.code);
          });
          if (
            addCards(res.data.deck_id, playerHand, tmpDrawn[0]) &&
            addCards(res.data.deck_id, enemyHand, tmpDrawn[1])
          ) {
            return res.data.deck_id;
          } else {
            return "Error: server failed to create hands";
          }
        } else {
          return "Error: server failed to draw cards";
        }
      })
      .catch((error) => console.error(error))
  );
}

export function shuffle(deckId, hand) {
  return axios
    .get(`https://deckofcardsapi.com/api/deck/${deckId}/pile/${hand}/shuffle/`)
    .then((res) => {
      console.log(
        "remaining cards after shuffle" + res.data.piles[hand].remaining
      );
      return res.data.piles[hand].remaining;
    })
    .catch((error) => {
      console.error(error);
      return 0;
    });
}

export function getCard(deckId, hand, count) {
  return axios
    .get(
      `https://deckofcardsapi.com/api/deck/${deckId}/pile/${hand}/draw/?count=${count}`
    )
    .then((res) => res.data.cards)
    .catch((error) => {
      // if the pile is empty
      // server throws 404
      // but also tells us there are no
      // cards to draw
      if (error.response.data.success === false) {
        return [];
      } else {
        console.error(error);
      }
    });
}

export function addCards(deckId, handName, cards) {
  const handStr = cards.join(",");
  return axios
    .get(
      `https://deckofcardsapi.com/api/deck/${deckId}/pile/${handName}/add/?cards=${handStr}`
    )
    .then((res) => res.data.success)
    .catch((error) => console.error(error));
}
