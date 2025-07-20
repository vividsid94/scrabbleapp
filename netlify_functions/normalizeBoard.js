function normalizeBoard(rawBoard) {
    return rawBoard.map(row =>
      row.map(cell => {
        if (typeof cell === 'string' && /^[A-Z]$/.test(cell)) return cell;
        if (typeof cell === 'string' && /^[a-z]$/.test(cell)) return cell; // Accept lowercase for blanks
        return '';
      })
    );
  }
  
  module.exports = { normalizeBoard };
  