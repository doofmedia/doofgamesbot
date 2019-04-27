const Discord = require('discord.js');

const db = require('./db.js');
const api = require('./api.js');
const config = require('./config.json');

db.initDb();

// Initialize Discord Bot
const client = new Discord.Client();

client.on('ready', () => { console.log(`Connected! Logged in as ${client.user.tag}`); });

client.on('message', async (message) => {
  // TODO Restrict from even receiving messages outside of this channel to cut usage.
  if (message.channel.id !== config.channel
    || message.content.substring(0, 1) !== config.prefix
    || message.author.bot) {
    return;
  }

  const args = message.content.substring(1).split(' ');
  if (args.length < 2 || args.length > 3) {
    message.channel.send('usage: COMMAND GAME [PLAYER]');
  }
  const [cmd, game] = args;
  let player = message.author.username;
  if (args[2]) {
    // TODO could we fetch the proper user here instead for cleaner code?
    player = args[2]; // eslint-disable-line prefer-destructuring
  }

  switch (cmd) {
    case 'ping':
      api.ping(game, player, message);
      break;
    case 'add':
      api.add(game, player, message);
      break;
    case 'remove':
      api.remove(game, player, message);
      break;
    case 'list':
      api.list(game, player, message);
      break;
    default:
  }
});

client.login(process.env.DBPASS);
