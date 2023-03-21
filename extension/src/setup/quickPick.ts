import { sortCollectedArray } from '../util/array'
import { quickPickManyValues } from '../vscode/quickPick'
import { Title } from '../vscode/title'
import { Toast } from '../vscode/toast'

export const pickFocusedProjects = async (
  projects: string[],
  currentProjects: string[]
): Promise<string[] | undefined> => {
  const values = await quickPickManyValues(
    projects.map(path => ({
      label: path,
      picked: currentProjects.includes(path),
      value: path
    })),
    { title: Title.SELECT_FOCUSED_PROJECTS }
  )
  if (!values) {
    return
  }

  if (values.length === 0) {
    void Toast.showError('Cannot select 0 projects.')
    return
  }

  return sortCollectedArray(values)
}
