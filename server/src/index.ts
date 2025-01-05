import { listen } from '@colyseus/tools'
import { colyseusConfig, HOST_PORT } from './config'

listen(colyseusConfig, HOST_PORT)
