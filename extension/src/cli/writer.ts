import { Command } from './args'
import { ExecutionOptions, runCliProcess } from './execution'

export const checkout = async (options: ExecutionOptions): Promise<string> =>
  runCliProcess(options, Command.CHECKOUT)
