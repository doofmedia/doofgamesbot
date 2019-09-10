const Discord = require('discord.js');

const db = require('./db.js');
const api = require('./api.js');
const config = require('./config.json');

db.initDb();

function bounceDM(message) {
  if (message.channel.type === 'dm') {
    message.channel.send('Command not supported in DM.');
    return true;
  }
  return false;
}

// Initialize Discord Bot
const client = new Discord.Client();

client.on('ready', () => { console.log(`Connected! Logged in as ${client.user.tag}`); });

client.on('message', async (message) => {
  try {
    if (process.env.DOOFDEVMODE) {
      config.channel = config.devchannel;
    }
    // TODO Restrict from even processing messages outside of this channel to cut usage.
    if ((message.channel.id !== config.channel && message.channel.type !== 'dm')
    || message.content.substring(0, config.prefix.length) !== config.prefix
    || message.author.bot) {
      return;
    }

    const args = message.content.substring(config.prefix.length).split(' ');
    const [cmd, game] = args;
    let player = message.author.username;
    if (message.channel.type !== 'dm') {
      player = message.member.displayName;
    }

    if (args[2]) {
    // TODO could we fetch the proper user here instead for cleaner code?
      player = args[2]; // eslint-disable-line prefer-destructuring
    }

    switch (cmd.toLowerCase()) {
      case 'help':
        api.help(message);
        break;
      case 'ping':
        if (bounceDM(message)) { break; }
        if (args.length !== 2) {
          message.channel.send(`\`\`\`usage: ${config.prefix}ping GAME\`\`\``);
          break;
        }
        api.ping(game, player, message);
        break;
      case 'add':
        if (bounceDM(message)) { break; }
        if (args.length < 2 || args.length > 3) {
          message.channel.send(`\`\`\`usage: ${config.prefix}add GAME [PLAYER]\`\`\``);
          break;
        }
        api.add(game, player, message);
        break;
      case 'remove':
        if (bounceDM(message)) { break; }
        if (args.length < 2 || args.length > 3) {
          message.channel.send(`\`\`\`usage: ${config.prefix}remove GAME [PLAYER]\`\`\``);
          break;
        }
        api.remove(game, player, message);
        break;
      case 'list':
        if (args.length > 2) {
          message.channel.send(`\`\`\`usage: ${config.prefix}list [GAME]\`\`\``);
          break;
        }
        if (args.length === 2) {
          if (bounceDM(message)) { break; }
          api.list(game, player, message);
          break;
        }
        api.listGames(message);
        break;
      case 'check':
      case '👀':
      case 'listplayer':
        if (bounceDM(message)) { break; }
        if (args.length !== 2) {
          message.channel.send(`\`\`\`usage: ${config.prefix}listplayer PLAYER\`\`\``);
          break;
        }
        // TODO got some tech debt here from assumptions made earlier
        // that player would always be the second argument :p.
        player = args[1]; // eslint-disable-line prefer-destructuring
        api.listPlayer(player, message);
        break;
      default:
    }
  } catch (error) {
    message.channel.send(`Caught error ${error}, please ask Dawn for help.`);
  }
});

client.login(process.env.BOTPASS);
