const db = require('./db.js');
const config = require('./config.json');

function filterByID(message, pid) {
  const user = message.guild.members.find(m => m.user.id === pid);
  if (!user) {
    console.log(`Unable to find user ${pid}, they may have left the server. Consider cleaning up?`);
  }
  return user;
}

function filterByName(message, pname) {
  const user = message.guild.members.find(m => m.displayName.toLowerCase() === pname.toLowerCase());
  return user;
}

function help(message) {
  message.channel.send(`\`\`\`Commands:
  ${config.prefix}HELP                 this message
  ${config.prefix}ADD GAME [PLAYER]    register yourself or someone else as a player of a game
  ${config.prefix}REMOVE GAME [PLAYER] remove yourself or someone else from a game's roster
  ${config.prefix}LIST GAME            see who wants to be pinged to play a game with you
  ${config.prefix}PING GAME            @ everyone who's in a game's roster to play right now
  ${config.prefix}LIST                 see what games people want to play
  \`\`\``);
}

async function add(game, player, message) {
  const connection = db.getDb();
  let user = filterByName(message, player);
  if (!user) {
    message.channel.send(`Can't find DOOFer ${player}, sorry.`);
    return;
  }
  user = user.id;
  connection.query('INSERT INTO players VALUES (?,?)', [game.toLowerCase(), user], (error) => {
    if (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        message.channel.send(`${player} already plays ${game}`);
        return;
      }
      throw error;
    }
    message.channel.send(`Added ${player} to ${game}`);
  });
}

function remove(game, player, message) {
  const connection = db.getDb();
  const user = filterByName(message, player).id;
  connection.query('DELETE FROM players WHERE game = ? AND player = ?', [game, user], (error, results) => {
    if (error) throw error;
    if (results.affectedRows === 0) {
      message.channel.send(`${player} doesn't play ${game}`);
      return;
    }
    message.channel.send(`Removed ${player} from ${game}`);
  });
}

function list(game, player, message) {
  const connection = db.getDb();
  connection.query('SELECT player FROM players WHERE game like ?', [game], (error, results) => {
    if (error) throw error;
    message.channel.send(results.reduce((players, row) => {
      const user = filterByID(message, row.player);
      if (user) {
        return `${players}, ${user.displayName}`;
      }
      return `${players}`;
    }, '').substring(2));
  });
}

function listGames(message) {
  const connection = db.getDb();
  connection.query('SELECT game, COUNT(*) AS count FROM players GROUP BY game ORDER BY COUNT(*) DESC, GAME ASC', (error, results) => {
    if (error) throw error;
    const response = results.reduce((resp, row) => {
      let { count } = row;
      if (row.count < 10) {
        count = `0${row.count}`;
      }
      return `${resp}\n${count} ${row.game}`;
    }, '');
    message.channel.send(`\`\`\`Games:${response}\`\`\``);
  });
}

function ping(game, player, message) {
  const connection = db.getDb();
  connection.query('SELECT player FROM players WHERE game like ?', [game], (error, results) => {
    if (error) throw error;
    message.channel.send(results.reduce((players, row) => {
      const user = filterByID(message, row.player);
      if (user) {
        return `${players}, ${user}`;
      }
      return `${players}`;
    }, '').substring(2));
  });
}

module.exports = {
  add,
  help,
  list,
  listGames,
  ping,
  remove,
};
