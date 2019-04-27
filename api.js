const db = require('./db.js');

function filterByID(message, pid) {
  const user = message.guild.members.find(m => m.user.id === pid);
  if (!user) {
    console.log(`Unable to find user ${pid}, they may have left the server. Consider cleaning up?`);
  }
  return user;
}

function filterByName(message, pname) {
  const user = message.guild.members.find(m => m.user.username === pname);
  return user;
}

async function add(game, player, message) {
  const connection = db.getDb();
  let user = filterByName(message, player);
  if (!user) {
    message.channel.send(`Can't find DOOFer ${player}, sorry.`);
    return;
  }
  user = user.id;
  connection.query(`INSERT INTO players VALUES ('${game}', '${user}')`, (error) => {
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
  connection.query(`DELETE FROM players WHERE game = '${game}' AND player = '${user}'`, (error, results) => {
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
  connection.query(`SELECT player FROM players WHERE game like '%${game}%'`, (error, results) => {
    if (error) throw error;
    message.channel.send(results.reduce((players, row) => {
      const user = filterByID(message, row.player);
      if (user) {
        return `${players}, ${user.user.username}`;
      }
      return `${players}`;
    }, '').substring(2));
  });
}

function ping(game, player, message) {
  const connection = db.getDb();
  connection.query(`SELECT player FROM players WHERE game like '${game}'`, (error, results) => {
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
  remove,
  list,
  ping,
};
