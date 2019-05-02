const SQLite = require('better-sqlite3');

const sql = new SQLite('./doof.sqlite');

function initDb() {
  sql.prepare('CREATE TABLE players (game TEXT NOT NULL, player TEXT NOT NULL, PRIMARY KEY (game, player));').run();
  sql.pragma('synchronous = 1');
  sql.pragma('journal_mode = wal');
  const testput = sql.prepare('INSERT INTO players VALUES (@game, @player)');
  const testget = sql.prepare('SELECT * FROM PLAYERS');
  const entry = {
    game: 'A',
    player: 'B',
  };
  testput.run(entry);
  console.log(testget.get());
}

module.exports = {
  initDb,
};
