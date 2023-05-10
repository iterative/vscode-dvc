import { getOptions } from './util'
import { Logger } from '../../../common/logger'
import { delay } from '../../../util/time'

require('../../../vscode/mockModule')

const importModuleAfterMockingVsCode = () => {
  const { Cli } = require('../../../cli')
  const { esmModulesImported } = require('../../../process/execution')
  return { Cli, esmModulesImported }
}

const main = async () => {
  const { Cli, esmModulesImported } = importModuleAfterMockingVsCode()

  await esmModulesImported
  const cli = new Cli()

  const options = getOptions('background')
  const pid = await cli.createBackgroundProcess(options)

  Logger.log(pid)

  return delay(30000)
}

void main()
