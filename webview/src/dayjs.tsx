import * as dayjs from 'dayjs'
import * as relativeTime from 'dayjs/plugin/relativeTime'
import * as isToday from 'dayjs/plugin/isToday'
dayjs.extend(relativeTime)
dayjs.extend(isToday)
export default dayjs
