import { join } from 'path'
import { pickFocusedProjects } from './quickPick'
import { quickPickManyValues } from '../vscode/quickPick'
import { Toast } from '../vscode/toast'
import { Title } from '../vscode/title'

jest.mock('../vscode/quickPick')

const mockedQuickPickManyValues = jest.mocked(quickPickManyValues)

const mockedToast = jest.mocked(Toast)
const mockedShowError = jest.fn()
mockedToast.showError = mockedShowError

beforeEach(() => {
  jest.resetAllMocks()
})

describe('pickFocusedProjects', () => {
  const mockedRoots = [join('root', 'a'), join('root', 'b'), join('root', 'c')]

  it('should return undefined and not show a toast message if the user cancels the dialog', async () => {
    mockedQuickPickManyValues.mockResolvedValueOnce(undefined)
    const focusedProjects = await pickFocusedProjects(mockedRoots, mockedRoots)
    expect(mockedShowError).not.toHaveBeenCalled()
    expect(focusedProjects).toBeUndefined()
  })

  it('should return undefined and show a toast message if the user selects no projects', async () => {
    mockedQuickPickManyValues.mockResolvedValueOnce([])
    const focusedProjects = await pickFocusedProjects(mockedRoots, mockedRoots)
    expect(mockedShowError).toHaveBeenCalledTimes(1)
    expect(focusedProjects).toBeUndefined()
  })

  it('should return the selected roots', async () => {
    const selectedRoots = mockedRoots.slice(0, 2)
    mockedQuickPickManyValues.mockResolvedValueOnce(selectedRoots)
    const focusedProjects = await pickFocusedProjects(mockedRoots, mockedRoots)
    expect(mockedShowError).not.toHaveBeenCalled()
    expect(focusedProjects).toStrictEqual(selectedRoots)
  })

  it('should mark the currently selected roots as picked', async () => {
    const selectedRoots = mockedRoots.slice(0, 2)
    mockedQuickPickManyValues.mockResolvedValueOnce(selectedRoots)
    await pickFocusedProjects(mockedRoots, selectedRoots)
    expect(mockedQuickPickManyValues).toHaveBeenCalledWith(
      [
        { label: mockedRoots[0], picked: true, value: mockedRoots[0] },
        { label: mockedRoots[1], picked: true, value: mockedRoots[1] },
        { label: mockedRoots[2], picked: false, value: mockedRoots[2] }
      ],
      { title: Title.SELECT_FOCUSED_PROJECTS }
    )
  })
})
