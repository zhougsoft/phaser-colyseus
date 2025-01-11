import type { MapSchema, Schema } from '@colyseus/schema'
import { Client, Room } from 'colyseus.js'
import Phaser from 'phaser'
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  MOVEMENT_VELOCITY,
  FIXED_TIME_STEP,
} from 'shared'
import characterImage from './assets/character.png'

// @TODO: make these configurable
const HOST_DOMAIN = 'localhost'
const HOST_PORT = 6969

const SERVER_URL = `ws://${HOST_DOMAIN}:${HOST_PORT}`

interface Player extends Schema {
  x: number
  y: number
}

interface State extends Schema {
  players: MapSchema<Player>
}

class GameScene extends Phaser.Scene {
  client: Client
  room: Room<State> | null = null
  accumulatedDeltaTime: number = 0

  playerSprites: { [sessionId: string]: Phaser.GameObjects.Sprite } = {}
  currentPlayerSprite: Phaser.GameObjects.Sprite | null = null

  // User input state
  cursorKeys?: Phaser.Types.Input.Keyboard.CursorKeys
  playerInput = {
    left: false,
    right: false,
    up: false,
    down: false,
  }

  constructor() {
    super('GameScene')
    this.client = new Client(SERVER_URL)
  }

  /**
   * Runs once before the scene is created
   */
  preload() {
    this.cursorKeys = this.input?.keyboard?.createCursorKeys()
    this.load.image('character', characterImage)
  }

  /**
   * Runs once when the scene is created
   */
  async create() {
    console.log('joining room...')

    try {
      this.room = await this.client.joinOrCreate('main_room')
      console.log('joined with session id:', this.room.sessionId)

      // Listen for players joining the room
      this.room.state.players.onAdd((player, sessionId) => {
        if (!this.room) {
          console.error('room not found')
          return
        }

        // Create a local sprite for the new player & store a reference by sessionId
        const sprite = this.add.sprite(player.x, player.y, 'character')
        sprite.setScale(0.25)
        this.playerSprites[sessionId] = sprite

        // Store a reference for the current player sprite
        if (sessionId === this.room.sessionId) {
          this.currentPlayerSprite = sprite
        }

        // Listen for server updates from the player
        player.onChange(() => {
          // Update local sprite's state with the server's updated data
          sprite.setData('serverX', player.x)
          sprite.setData('serverY', player.y)
        })

        // Alternatively, you can listen to individual properties:
        // player.listen("x", (newX, prevX) => console.log(newX, prevX));
        // player.listen("y", (newY, prevY) => console.log(newY, prevY));
      })

      // Listen for dropped other players
      this.room.state.players.onRemove((_player, sessionId) => {
        const entity = this.playerSprites[sessionId]
        if (entity) {
          // Destroy entity & clear local reference
          entity.destroy()
          delete this.playerSprites[sessionId]
        }
      })
    } catch (error) {
      console.error(error)
    }
  }

  /**
   * Runs once per frame
   */
  update(_time: number, delta: number): void {
    this.accumulatedDeltaTime += delta
    while (this.accumulatedDeltaTime >= FIXED_TIME_STEP) {
      this.accumulatedDeltaTime -= FIXED_TIME_STEP
      this.fixedUpdate()
    }
  }

  /**
   * Runs once per game tick; do game logic here
   */
  fixedUpdate() {
    // Skip loop if not loaded
    if (!this.room || !this.currentPlayerSprite) return

    // Interpolate other player sprite positions
    for (const sessionId in this.playerSprites) {
      // Skip interpolation for the current player
      if (sessionId === this.room.sessionId) continue

      // Get stored sprite reference w/ included server position data
      const sprite = this.playerSprites[sessionId]
      const { serverX, serverY } = sprite.data.values

      // Interpolate local sprite position towards server position
      sprite.x = Phaser.Math.Linear(sprite.x, serverX, 0.2)
      sprite.y = Phaser.Math.Linear(sprite.y, serverY, 0.2)
    }

    // Update local player input
    if (!this.cursorKeys) return
    this.playerInput.left = this.cursorKeys.left.isDown
    this.playerInput.right = this.cursorKeys.right.isDown
    this.playerInput.up = this.cursorKeys.up.isDown
    this.playerInput.down = this.cursorKeys.down.isDown

    // Send updated local player input to server as payload for movement calculation
    this.room.send(0, this.playerInput)

    // Calculate the player movement locally on the client to predict the next location (reduces perceived latency)
    // NOTE: This logic should match the logic on the server (TODO: put in a shared package)
    if (this.playerInput.left) {
      this.currentPlayerSprite.x -= MOVEMENT_VELOCITY
    } else if (this.playerInput.right) {
      this.currentPlayerSprite.x += MOVEMENT_VELOCITY
    }

    if (this.playerInput.up) {
      this.currentPlayerSprite.y -= MOVEMENT_VELOCITY
    } else if (this.playerInput.down) {
      this.currentPlayerSprite.y += MOVEMENT_VELOCITY
    }
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  backgroundColor: '#000',
  pixelArt: true,
  scene: [GameScene],
}

new Phaser.Game(config)
