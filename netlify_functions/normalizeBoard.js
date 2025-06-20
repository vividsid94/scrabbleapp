function normalizeBoard(rawBoard) {
    return rawBoard.map(row =>
      row.map(cell => {
        if (typeof cell === 'string' && /^[A-Z]$/.test(cell)) return cell;
        return '';
      })
    );
  }
  
  module.exports = { normalizeBoard };
  