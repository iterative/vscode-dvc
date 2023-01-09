import { Logger } from '../../../common/logger'
import { delay } from '../../../util/time'

delay(2000).then(() => {
  Logger.log(process.pid.toString())
  delay(30000)
})
