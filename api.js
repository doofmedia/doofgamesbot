const db = require('./db.js')
const config = require('./config.json')
const gridgraph = require('./gridgraph.js')

function filterByID (message, pid) {
  const user = message.guild.members.get(pid)
  if (!user) {
    console.log(`Unable to find user ${pid}, they may have left the server. Consider cleaning up?`)
  }
  return user
}

function getUserFromMention (message, mention) {
  const matches = mention.match(/^<@!?(\d+)>$/)
  if (matches) {
    const id = matches[1]
    return message.client.users.get(id)
  }
  return null
}

function filterByName (message, pName) {
  const user = getUserFromMention(message, pName)
  if (!user) {
    return message.guild.members.find(m => m.displayName === pName)
  }
  return message.guild.members.find(m => m.id === user.id)
}

function forceDM (message, response, title) {
  if (message.channel.type !== 'dm') {
    message.channel.send('Sending via DM to avoid channel spam.')
    message.author.send(`\`\`\`${title}\n${response}\`\`\``)
    return
  }
  message.channel.send(`\`\`\`${response}\`\`\``)
}

function help (message) {
  message.channel.send(`\`\`\`Use this bot to get pings from others on games you want to play together!
Commands:
  ${config.prefix}HELP                 this message
  ${config.prefix}ADD GAME [PLAYER]    register yourself or someone else as a player of a game
  ${config.prefix}REMOVE GAME [PLAYER] remove yourself or someone else from a game's roster
  ${config.prefix}LIST GAME            see who wants to be pinged to play a game with you
  ${config.prefix}PING GAME            @ everyone who's in a game's roster to play right now
  ${config.prefix}LIST                 see what games people want to play
  ${config.prefix}LISTPLAYER PLAYER    see what games a person plays
  ${config.prefix}NET NODE1, NODE2...  make a randomly generated network/graph\`\`\``)
}

function add (game, player, message) {
  const connection = db.getDb()
  let user = filterByName(message, player)
  if (!user) {
    message.channel.send(`Can't find DOOFer ${player}, sorry.`)
    return
  }
  user = user.id
  connection.query('INSERT INTO players VALUES (?,?)', [game.toLowerCase(), user], (error) => {
    if (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        message.channel.send(`${player} already plays ${game}`)
        return
      }
      throw error
    }
    message.channel.send(`Added ${player} to ${game}`)
  })
}

function remove (game, player, message) {
  const connection = db.getDb()
  const user = filterByName(message, player).id
  connection.query('DELETE FROM players WHERE game = ? AND player = ?', [game, user], (error, results) => {
    if (error) throw error
    if (results.affectedRows === 0) {
      message.channel.send(`${player} doesn't play ${game}`)
      return
    }
    message.channel.send(`Removed ${player} from ${game}`)
  })
}

function list (game, player, message) {
  const connection = db.getDb()
  connection.query('SELECT player FROM players WHERE game like ?', [game], (error, results) => {
    if (error) throw error
    let response = results.reduce((players, row) => {
      const user = filterByID(message, row.player)
      if (user) {
        return `${players}, ${user.displayName}`
      }
      return `${players}`
    }, '').substring(2)
    if (response.length === 0) {
      response = `Sorry, unable to find any players for ${game}`
    }
    message.channel.send(response)
  })
}

function listGames (message) {
  const connection = db.getDb()
  connection.query('SELECT game, COUNT(*) AS count FROM players GROUP BY game ORDER BY COUNT(*) DESC, GAME ASC', (error, results) => {
    if (error) throw error
    const response = results.reduce((resp, row) => {
      let { count } = row
      if (row.count < 10) {
        count = `0${row.count}`
      }
      return `${resp}\n${count} ${row.game}`
    }, '')
    forceDM(message, response, 'Games:')
  })
}

function network (nodes, homestuck, message) {
  let response = '```' + gridgraph.renderGridGraph(gridgraph.polycule(nodes), homestuck) + '```'
  message.channel.send(response)
}

function listPlayer (player, message) {
  const connection = db.getDb()
  const user = filterByName(message, player)
  connection.query('SELECT game FROM players WHERE player like ?', [user.user.id], (error, results) => {
    if (error) throw error
    let response = results.reduce((games, game) => `${games} ${game.game}\n`, '')
    if (response.length === 0) {
      response = `Sorry, unable to find any games for ${player}`
    }
    forceDM(message, response, 'Games:')
  })
}

function ping (game, player, message) {
  const connection = db.getDb()
  connection.query('SELECT player FROM players WHERE game like ?', [game], (error, results) => {
    if (error) throw error
    message.channel.send(`${player} wants to play ${game} ` + results.reduce((players, row) => {
      const user = filterByID(message, row.player)
      if (user) {
        return `${players}, ${user}`
      }
      return `${players}`
    }, '').substring(2))
  })
}

module.exports = {
  add,
  help,
  list,
  listGames,
  listPlayer,
  ping,
  remove,
  network
}
