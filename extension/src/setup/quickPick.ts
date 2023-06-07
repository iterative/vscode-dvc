import { createPythonEnv, selectPythonInterpreter } from '../extensions/python'
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

export const pickPythonExtensionAction = async (): Promise<unknown> => {
  const options = [
    {
      description: 'Create an environment',
      label: 'Create',
      value: 0
    },
    {
      description: 'Choose from already created environments',
      label: 'Select',
      value: 1
    }
  ]
  const value = await quickPickValue<number>(options, {
    placeHolder: 'Select or Create a Python Environment',
    title: Title.UPDATE_PYTHON_ENVIRONMENT
  })

  return value === 0 ? createPythonEnv() : selectPythonInterpreter()
}
