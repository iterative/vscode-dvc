import { ParamWithIsString } from './collect'
import { quickPickManyValues } from '../../../vscode/quickPick'
import { getInput } from '../../../vscode/inputBox'
import { Flag } from '../../../cli/dvc/constants'
import { definedAndNonEmpty } from '../../../util/array'
import { getEnterValueTitle, Title } from '../../../vscode/title'
import { Value } from '../../../cli/dvc/contract'

const standardizeValue = (value: Value, isString: boolean): string => {
  if (isString && typeof value === 'string') {
    return `'${value}'`
  }
  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}

const pickParamsToModify = (
  params: ParamWithIsString[]
): Thenable<ParamWithIsString[] | undefined> =>
  quickPickManyValues<ParamWithIsString>(
    params.map(param => ({
      description: standardizeValue(param.value, false),
      label: param.path,
      picked: false,
      value: param
    })),
    { title: Title.SELECT_PARAM_TO_MODIFY }
  )

const pickNewParamValues = async (
  paramsToModify: ParamWithIsString[]
): Promise<string[] | undefined> => {
  const args: string[] = []
  for (const { path, value, isString } of paramsToModify) {
    const input = await getInput(
      getEnterValueTitle(path),
      standardizeValue(value, false)
    )
    if (input === undefined) {
      return
    }
    args.push(
      Flag.SET_PARAM,
      [path, standardizeValue(input.trim(), isString)].join('=')
    )
  }
  return args
}

const addUnchanged = (args: string[], unchanged: ParamWithIsString[]) => {
  for (const { path, value, isString } of unchanged) {
    args.push(
      Flag.SET_PARAM,
      [path, standardizeValue(value, isString)].join('=')
    )
  }

  return args
}

export const pickAndModifyParams = async (
  params: ParamWithIsString[]
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
