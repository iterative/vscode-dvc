import { Logger } from '../../../common/logger'
import { delay } from '../../../util/time'

void delay(2000).then(() => {
  Logger.log('this is some stdout')
  throw new Error('and this is some stderr')
})
