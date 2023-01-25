export const addToPool = (play, pool) => {
  let newPool = pool;
  for (let i = 0; i < play.length; i++) {
    const char = play[i];
    if (char.toLowerCase() === char && char !== ".") {
      newPool += "?";
    } else if (char !== ".") {
      newPool += char;
    }
  }
  newPool = newPool.split('').sort((a, b) => {
    if (a === '?') return 1;
    if (b === '?') return -1;
    return a.localeCompare(b);
  }).join('');
  return newPool;
}
export const removeFromPool = (play, pool) => {
  let newPool = pool;
  for (let i = 0; i < play.length; i++) {
    const char = play[i];
    if (char.toLowerCase() === char && char !== ".") {
      newPool = newPool.replace("?", "");
    } else {
      newPool = newPool.replace(char, "");
    }
  }
  return newPool;
}
