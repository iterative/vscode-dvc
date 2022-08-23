import { joinTruthyItems } from '../util/array'

export const getCommandString = ({
  args,
  executable
}: {
  args: string[]
  executable: string
}): string => {
  return `${joinTruthyItems([executable, ...args])}`
}
