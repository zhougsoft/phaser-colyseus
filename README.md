# phaser + colyseus starter

> basic multiplayer game starter w/ the Phaser game engine + Colyseus for server-side game state

### getting started

1. install dependencies: `npm install`
1. run shared package: `npm run shared`
1. run server: `npm run server`
1. run client: `npm run client`

- the client will be running at [http://localhost:3000](http://localhost:3000)
- the server will be running at [http://localhost:6969](http://localhost:6969)
- to access the Colyseus monitor, go to [http://localhost:6969/colyseus](http://localhost:6969/colyseus)

you can use the `shared` package to share code between client & server (eg: game logic, constants, etc)
