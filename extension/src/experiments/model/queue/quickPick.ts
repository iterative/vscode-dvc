import { Param } from './collect'
import { quickPickManyValues } from '../../../vscode/quickPick'
import { getInput } from '../../../vscode/inputBox'
import { Flag } from '../../../cli/args'
import { definedAndNonEmpty } from '../../../util/array'
import { getEnterValueTitle, Title } from '../../../vscode/title'

const pickParamsToVary = (params: Param[]): Thenable<Param[] | undefined> =>
  quickPickManyValues<Param>(
    params.map(param => ({
      description: `${param.value}`,
      label: param.path,
      picked: true,
      value: param
    })),
    { title: Title.SELECT_PARAM_TO_VARY }
  )

const pickNewParamValues = async (
  paramsToVary: Param[]
): Promise<string[] | undefined> => {
  const args: string[] = []
  for (const { path, value } of paramsToVary) {
    const input = await getInput(getEnterValueTitle(path), `${value}`)
    if (input === undefined) {
      return
    }
    args.push(Flag.SET_PARAM, [path, input.trim()].join('='))
  }
  return args
}

const addUnchanged = (args: string[], unchanged: Param[]) => {
  for (const { path, value } of unchanged) {
    args.push(Flag.SET_PARAM, [path, value].join('='))
  }

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

  const paramPathsToVary = new Set(paramsToVary.map(param => param.path))
  const unchanged = params.filter(param => !paramPathsToVary.has(param.path))

  return addUnchanged(args, unchanged)
}
