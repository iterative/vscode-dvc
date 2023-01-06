import { Logger } from '../../../common/logger'
import { delay } from '../../../util/time'

delay(1000).then(() => {
  Logger.log(process.pid.toString())
  delay(10000000)
})
