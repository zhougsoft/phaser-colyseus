import { monitor } from '@colyseus/monitor'
import config from '@colyseus/tools'
import cors from 'cors'
import { MainRoom } from './room'

// These constants should match the client's constants (TODO: put in a shared package)
const HOST_DOMAIN = 'localhost'
export const HOST_PORT = 6969

export const colyseusConfig = config({
  initializeGameServer: gameServer => {
    /**
     * Define your room handlers:
     */
    gameServer.define('main_room', MainRoom)

    // You can simulate network latency with the `simulateLatency` method:
    // gameServer.simulateLatency(200)
  },

  initializeExpress: app => {
    app.use(
      cors({
        origin: HOST_DOMAIN,
      })
    )

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
