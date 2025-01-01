import { Room, Client } from '@colyseus/core'
import { MapSchema, Schema, type } from '@colyseus/schema'

const MAP_WIDTH = 800
const MAP_HEIGHT = 600
const MOVEMENT_VELOCITY = 2

export class Player extends Schema {
  @type('number') x: number
  @type('number') y: number
}

export class State extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>()
}

export class MainRoom extends Room<State> {
  maxClients = 5

  /**
   * When room is initialized
   */
  onCreate(options: any) {
    this.setState(new State())

    // Handle player input
    this.onMessage(0, (client, payload) => {
      // Get reference to the player who sent the message
      const player = this.state.players.get(client.sessionId)

      if (payload.left) {
        player.x -= MOVEMENT_VELOCITY
      } else if (payload.right) {
        player.x += MOVEMENT_VELOCITY
      }

      if (payload.up) {
        player.y -= MOVEMENT_VELOCITY
      } else if (payload.down) {
        player.y += MOVEMENT_VELOCITY
      }
    })
  }

  /**
   * When client a successfully joins the room
   */
  onJoin(client: Client, options: any) {
    console.log(client.sessionId, 'joined!')

    // create Player instance & place it randomly on the map
    const player = new Player()
    player.x = Math.random() * MAP_WIDTH
    player.y = Math.random() * MAP_HEIGHT

    // assign the Player instance to the client's sessionId
    // (client.sessionId is unique per connection!)
    this.state.players.set(client.sessionId, player)
  }

  /**
   * When a client leaves the room
   */
  onLeave(client: Client, consented: boolean) {
    this.state.players.delete(client.sessionId)
    console.log(client.sessionId, 'left!')
  }

  /**
   * Cleanup callback, called after there are no more clients in the room. (see `autoDispose`)
   */
  onDispose() {
    console.log('room', this.roomId, 'disposing...')
  }
}
