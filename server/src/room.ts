import { Room, Client } from '@colyseus/core'
import { MapSchema, Schema, type } from '@colyseus/schema'
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  FIXED_TIME_STEP,
  computePlayerMovementDeltas,
  type InputPayload,
} from 'shared'

export class Player extends Schema {
  @type('number') x: number
  @type('number') y: number
  inputQueue: InputPayload[] = []
}

export class State extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>()
}

export class MainRoom extends Room<State> {
  maxClients = 5

  /**
   * Runs once per game tick; this is the core game loop, do logic updates here to synchronize across clients
   */
  fixedUpdate(_deltaTime: number) {
    // Loop through each player and dequeue/apply their inputs
    this.state.players.forEach(player => {
      let inputPayload: InputPayload

      while ((inputPayload = player.inputQueue.shift())) {
        const { deltaX, deltaY } = computePlayerMovementDeltas(inputPayload)
        player.x += deltaX
        player.y += deltaY
      }
    })
  }

  /**
   * Runs when the room is initialized
   */
  onCreate(_options: any) {
    // Initialize the room state
    this.setState(new State())

    // Initialize fixed time step update loop
    let accumulatedDeltaTime = 0
    this.setSimulationInterval(deltaTime => {
      accumulatedDeltaTime += deltaTime
      while (accumulatedDeltaTime >= FIXED_TIME_STEP) {
        accumulatedDeltaTime -= FIXED_TIME_STEP
        this.fixedUpdate(deltaTime)
      }
    })

    // Handle player input
    this.onMessage(0, (client, payload: InputPayload) => {
      // Get reference to the player who sent the message
      const player = this.state.players.get(client.sessionId)

      // Enqueue input to player's input buffer
      player.inputQueue.push(payload)
    })
  }

  /**
   * Runs when a client successfully joins the room
   */
  onJoin(client: Client, _options: any) {
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
  onLeave(client: Client, _consented: boolean) {
    this.state.players.delete(client.sessionId)
    console.log(client.sessionId, 'left!')
  }

  /**
   * Cleanup callback; runs when there are no more clients in the room
   */
  onDispose() {
    console.log('room', this.roomId, 'disposing...')
  }
}
