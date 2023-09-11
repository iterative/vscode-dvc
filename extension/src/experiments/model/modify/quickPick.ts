import { Param } from './collect'
import { quickPickManyValues } from '../../../vscode/quickPick'
import { getInput } from '../../../vscode/inputBox'
import { Flag } from '../../../cli/dvc/constants'
import { definedAndNonEmpty } from '../../../util/array'
import { getEnterValueTitle, Title } from '../../../vscode/title'
import { Value } from '../../../cli/dvc/contract'

const standardizeValue = (value: Value): string => {
  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}

const pickParamsToModify = (params: Param[]): Thenable<Param[] | undefined> =>
  quickPickManyValues<Param>(
    params.map(param => ({
      description: standardizeValue(param.value),
      label: param.path,
      picked: false,
      value: param
    })),
    { title: Title.SELECT_PARAM_TO_MODIFY }
  )

const pickNewParamValues = async (
  paramsToModify: Param[],
  inputPrompt: string | undefined
): Promise<string[] | undefined> => {
  const args: string[] = []
  for (const { path, value } of paramsToModify) {
    const input = await getInput(
      getEnterValueTitle(path),
      standardizeValue(value),
      inputPrompt
    )
    if (input === undefined) {
      return
    }
    args.push(Flag.SET_PARAM, [path, standardizeValue(input.trim())].join('='))
  }
  return args
}

export const pickAndModifyParams = async (
  params: Param[],
  inputPrompt: string | undefined
): Promise<string[] | undefined> => {
  const paramsToModify = await pickParamsToModify(params)

  if (!definedAndNonEmpty(paramsToModify)) {
    return
  }

  return pickNewParamValues(paramsToModify, inputPrompt)
}
