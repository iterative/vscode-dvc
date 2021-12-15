import { Param } from './collect'
import { quickPickManyValues } from '../../../vscode/quickPick'
import { getInput } from '../../../vscode/inputBox'
import { Flag } from '../../../cli/args'

export const pickParamsAndVary = async (params: Param[]) => {
  const paramsToVary = await quickPickManyValues<Param>(
    params.map(param => ({
      description: `${param.value}`,
      label: param.path,
      picked: true,
      value: param
    })),
    { title: 'Select a param to vary' }
  )

  if (!paramsToVary) {
    return
  }

  const acc: string[] = []
  for (const { path, value } of paramsToVary) {
    const input = await getInput(`Enter a value for ${path}`, `${value}`)
    if (input === undefined) {
      return
    }
    acc.push(Flag.SET_PARAM)
    acc.push([path, input.trim()].join('='))
  }

  return acc
}
