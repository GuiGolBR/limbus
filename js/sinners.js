export const SINNER_NAMES = {
  1: "Yi Sang",
  2: "Faust",
  3: "Don Quixote",
  4: "Ryōshū",
  5: "Meursault",
  6: "Hong Lu",
  7: "Heathcliff",
  8: "Ishmael",
  9: "Rodion",
  11: "Sinclair",
  12: "Outis",
  13: "Gregor"
};


export const SINNER_ORDER = Object.keys(SINNER_NAMES).map(n => parseInt(n));


export function groupBySinner(identities) {
  const group = {};
  SINNER_ORDER.forEach(s => group[s] = []);

  identities.forEach(id => {
    if (!group[id.sinner]) group[id.sinner] = [];
    group[id.sinner].push(id);
  });

  return group;
}
