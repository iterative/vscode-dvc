import { sortCollectedArray } from '../util/array'
import { quickPickManyValues, quickPickValue } from '../vscode/quickPick'
import { Title } from '../vscode/title'
import { Toast } from '../vscode/toast'

export enum PYTHON_EXTENSION_ACTION {
  CREATE_ENV = 1,
  SET_INTERPRETER = 2
}

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

export const pickPythonExtensionAction = (): Thenable<
  PYTHON_EXTENSION_ACTION | undefined
> => {
  const options = [
    {
      description: 'Create an environment',
      label: 'Create',
      value: PYTHON_EXTENSION_ACTION.CREATE_ENV
    },
    {
      description: 'Choose from already created environments',
      label: 'Select',
      value: PYTHON_EXTENSION_ACTION.SET_INTERPRETER
    }
  ]
  return quickPickValue<PYTHON_EXTENSION_ACTION>(options, {
    placeHolder: 'Select or Create a Python Environment',
    title: Title.UPDATE_PYTHON_ENVIRONMENT
  })
}
