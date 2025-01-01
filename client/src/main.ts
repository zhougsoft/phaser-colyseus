import type { MapSchema, Schema } from '@colyseus/schema'
import { Client, Room } from 'colyseus.js'
import Phaser from 'phaser'
import characterImage from './assets/character.png'

const SERVER_URL = 'ws://localhost:6969'

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
  playerSprites: { [sessionId: string]: Phaser.GameObjects.Sprite } = {}

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
      console.log('joined!')

      // Listen for new other players
      this.room.state.players.onAdd((player, sessionId) => {
        // Create a local sprite for the new player & store a reference by sessionId
        const sprite = this.add.sprite(player.x, player.y, 'character')
        sprite.setScale(0.25)
        this.playerSprites[sessionId] = sprite

        // Listen for server updates from this other player
        player.onChange(() => {
          // Update local sprite's state with the server's updated data
          sprite.x = player.x
          sprite.y = player.y
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
  update(_time: number, _delta: number): void {
    // Skip loop if missing things
    if (!this.room || !this.cursorKeys) return

    // Update local player input
    this.playerInput.left = this.cursorKeys.left.isDown
    this.playerInput.right = this.cursorKeys.right.isDown
    this.playerInput.up = this.cursorKeys.up.isDown
    this.playerInput.down = this.cursorKeys.down.isDown

    // Send updated local player input to server as payload for movement calculation
    this.room.send(0, this.playerInput)
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#000',
  pixelArt: true,
  scene: [GameScene],
}

new Phaser.Game(config)
