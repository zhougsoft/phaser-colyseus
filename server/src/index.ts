import { listen } from '@colyseus/tools'
import { colyseusConfig, PORT } from './config'

listen(colyseusConfig, PORT)
