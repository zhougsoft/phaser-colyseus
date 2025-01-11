import { MOVEMENT_VELOCITY } from './constants'
import { InputPayload } from './types'

/**
 * A stateless, isomorphic function to compute player's movement based on their input.
 * This logic can be run identically on both client and server to maintain synchronization.
 */
export const computePlayerMovementDeltas = (inputPayload: InputPayload) => {
  let deltaX = 0
  let deltaY = 0

  // Horizontal movement
  if (inputPayload.left) {
    deltaX -= MOVEMENT_VELOCITY
  } else if (inputPayload.right) {
    deltaX += MOVEMENT_VELOCITY
  }

  // Vertical movement
  if (inputPayload.up) {
    deltaY -= MOVEMENT_VELOCITY
  } else if (inputPayload.down) {
    deltaY += MOVEMENT_VELOCITY
  }

  return { deltaX, deltaY }
}
