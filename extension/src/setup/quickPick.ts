import { sortCollectedArray } from '../util/array'
import { quickPickManyValues, quickPickValue } from '../vscode/quickPick'
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

export const pickPythonExtensionAction = () => {
  const options = [
    {
      description: 'Create an environment',
      label: 'Create',
      value: 1
    },
    {
      description: 'Choose from already created environments',
      label: 'Select',
      value: 2
    }
  ]
  return quickPickValue<number>(options, {
    placeHolder: 'Select or Create a Python Environment',
    title: Title.UPDATE_PYTHON_ENVIRONMENT
  })
}
