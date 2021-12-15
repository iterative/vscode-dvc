import { Param } from './collect'
import { quickPickManyValues } from '../../../vscode/quickPick'
import { getInput } from '../../../vscode/inputBox'
import { Flag } from '../../../cli/args'
import { definedAndNonEmpty } from '../../../util/array'

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

  if (!definedAndNonEmpty(paramsToVary)) {
    return
  }

  const paramPathsToVary = paramsToVary.map(param => param.path)
  const unchanged = params.filter(
    param => !paramPathsToVary.includes(param.path)
  )

  const args: string[] = []
  for (const { path, value } of paramsToVary) {
    const input = await getInput(`Enter a value for ${path}`, `${value}`)
    if (input === undefined) {
      return
    }
    args.push(Flag.SET_PARAM)
    args.push([path, input.trim()].join('='))
  }

  unchanged.forEach(({ path, value }) => {
    args.push(Flag.SET_PARAM)
    args.push([path, value].join('='))
  })

  return args
}
