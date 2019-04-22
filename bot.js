const Discord = require('discord.io');
const logger = require('winston');
const auth = require('./auth.json');
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console(), {
  colorize: true,
});
logger.level = 'debug';
// Initialize Discord Bot
const bot = new Discord.Client({
  token: auth.token,
  autorun: true,
});
bot.on('ready', () => {
  logger.info('Connected');
  logger.info('Logged in as: ');
  logger.info(`${bot.username} - (${bot.id})`);
});
const games = new Map();
function add(game, user, channelID) {
  if (!games[game]) {
    games[game] = new Map();
  }
  games[game][user] = 1;
  bot.sendMessage({
    to: channelID,
    message: `Added ${user} to ${game}`,
  });
}
bot.on('message', (user, userID, channelID, message) => {
  // Our bot needs to know if it will execute a command
  // It will listen for messages that will start with `!`
  if (message.substring(0, 1) === '!') {
    let args = message.substring(1).split(' ');
    const cmd = args[0];

    args = args.splice(1);
    switch (cmd) {
      // !ping
      case 'ping':
        bot.sendMessage({
          to: channelID,
          message: 'Pong!',
        });
        break;
      case 'add':
        if (args.length < 1 || args.length > 2) {
          bot.sendMessage({
            to: channelID,
            message: 'usage: add GAME (PLAYER)',
          });
          break;
        }
        if (args.length === 1) {
          add(args[0], user, channelID);
          break;
        }
        add(args[0], args[1], channelID);
        break;
      case 'list':
        // const message = games[args[0]].reduce(function (accumulator, '') {
        //     return accumulator + pilot;}, 0)
        // };
        // bot.sendMessage({
        //   to: channelID,
        //   message: games[args[0]],
        // });
        break;
      default:
            // Just add any case commands if you want to..
    }
  }
});
