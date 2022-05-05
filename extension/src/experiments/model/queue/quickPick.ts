import { Param } from './collect'
import { quickPickManyValues } from '../../../vscode/quickPick'
import { getInput } from '../../../vscode/inputBox'
import { Flag } from '../../../cli/constants'
import { definedAndNonEmpty } from '../../../util/array'
import { getEnterValueTitle, Title } from '../../../vscode/title'

const pickParamsToModify = (params: Param[]): Thenable<Param[] | undefined> =>
  quickPickManyValues<Param>(
    params.map(param => ({
      description: `${param.value}`,
      label: param.path,
      picked: true,
      value: param
    })),
    { title: Title.SELECT_PARAM_TO_MODIFY }
  )

const pickNewParamValues = async (
  paramsToModify: Param[]
): Promise<string[] | undefined> => {
  const args: string[] = []
  for (const { path, value } of paramsToModify) {
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

export const pickAndModifyParams = async (
  params: Param[]
): Promise<string[] | undefined> => {
  const paramsToModify = await pickParamsToModify(params)

  if (!definedAndNonEmpty(paramsToModify)) {
    return
  }

  const args = await pickNewParamValues(paramsToModify)

  if (!args) {
    return
  }

  const paramPathsToModify = new Set(paramsToModify.map(param => param.path))
  const unchanged = params.filter(param => !paramPathsToModify.has(param.path))

  return addUnchanged(args, unchanged)
}
