# doofbot

This is the monorepo for all DOOF!Media Discord bots.
It accepts a runtime config parameter determining which behavior it will express.

## Contributing

PRs welcome.
Create issues for things that you want improved.

### Prerequisites

- Docker
- Node.js
- standardJS
If you have any problems with prerequisites (or we forgot one!), please reach out.

Set the following environment variables:
DBPASS: Ask Dawn or Elliot for password!
BOTPASS: Ask Dawn or Elliot for password!

Additionally, you must set BOTMODE to one of:
games,behaim,idl,mm. This will cause the bot to express the functions relevant to that mode.

We use standard.js, and request you run `standard --fix` before pushing your commits.

### Building

You can use `node bot.js` to quickly iterate. You'll need to do `make build` and `make push` for your container to be available to deploy.

### Deploying

Set DOOFPRODMODE=true

SSH on to the EC2 instance (ask Dawn or Elliot for details). Run:

`docker pull doofmedia/doofbot:version:0.0.8`, or whatever version is latest at the time.
`make run`
