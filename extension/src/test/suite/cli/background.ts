import { Logger } from '../../../common/logger'
import { delay } from '../../../util/time'

void delay(2000).then(() => {
  Logger.log(process.pid.toString())
  void delay(30000)
})
