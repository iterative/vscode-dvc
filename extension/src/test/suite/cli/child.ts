import { getOptions } from './util'
import { Logger } from '../../../common/logger'
import { delay } from '../../../util/time'

require('../../../vscode/mockModule')

const importModuleAfterMockingVsCode = () => {
  const { Cli } = require('../../../cli')
  return { Cli }
}

const main = async () => {
  const { Cli } = importModuleAfterMockingVsCode()

  const cli = new Cli()

  const options = getOptions('background')
  const pid = await cli.createBackgroundProcess(options)

  Logger.log(pid)

  return delay(30000)
}

void main()
