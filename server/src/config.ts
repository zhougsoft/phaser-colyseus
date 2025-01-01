import { monitor } from '@colyseus/monitor'
import config from '@colyseus/tools'
import { MainRoom } from './room'

export const PORT = 6969

export const colyseusConfig = config({
  initializeGameServer: gameServer => {
    /**
     * Define your room handlers:
     */
    gameServer.define('main_room', MainRoom)
  },

  initializeExpress: app => {
    /**
     * Bind your custom express routes here:
     * Read more: https://expressjs.com/en/starter/basic-routing.html
     */
    app.get('/ping', (req, res) => {
      res.send('pong')
    })

    /**
     * Use @colyseus/monitor
     * It is recommended to protect this route with a password
     * Read more: https://docs.colyseus.io/tools/monitor/#restrict-access-to-the-panel-using-a-password
     */
    app.use('/colyseus', monitor())
  },

  beforeListen: () => {
    /**
     * Before before gameServer.listen() is called
     */
  },
})
