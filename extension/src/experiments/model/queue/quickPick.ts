import { Param } from './collect'
import { quickPickManyValues } from '../../../vscode/quickPick'
import { getInput } from '../../../vscode/inputBox'
import { Flag } from '../../../cli/args'
import { definedAndNonEmpty } from '../../../util/array'

const pickParamsToVary = (params: Param[]): Thenable<Param[] | undefined> =>
  quickPickManyValues<Param>(
    params.map(param => ({
      description: `${param.value}`,
      label: param.path,
      picked: true,
      value: param
    })),
    { title: 'Select a param to vary' }
  )

const pickNewParamValues = async (
  paramsToVary: Param[]
): Promise<string[] | undefined> => {
  const args: string[] = []
  for (const { path, value } of paramsToVary) {
    const input = await getInput(`Enter a value for ${path}`, `${value}`)
    if (input === undefined) {
      return
    }
    args.push(Flag.SET_PARAM)
    args.push([path, input.trim()].join('='))
  }
  return args
}

const addUnchanged = (args: string[], unchanged: Param[]) => {
  unchanged.forEach(({ path, value }) => {
    args.push(Flag.SET_PARAM)
    args.push([path, value].join('='))
  })

  return args
}

export const pickParamsToQueue = async (
  params: Param[]
): Promise<string[] | undefined> => {
  const paramsToVary = await pickParamsToVary(params)

  if (!definedAndNonEmpty(paramsToVary)) {
    return
  }

  const args = await pickNewParamValues(paramsToVary)

  if (!args) {
    return
  }

  const paramPathsToVary = paramsToVary.map(param => param.path)
  const unchanged = params.filter(
    param => !paramPathsToVary.includes(param.path)
  )

  return addUnchanged(args, unchanged)
}
