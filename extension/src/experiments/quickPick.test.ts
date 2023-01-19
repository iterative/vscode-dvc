import { pickGarbageCollectionFlags } from './quickPick'
import { quickPickManyValues } from '../vscode/quickPick'
import { Title } from '../vscode/title'

jest.mock('../vscode/quickPick')
jest.mock('../vscode/toast')

const mockedQuickPickManyValues = jest.mocked(quickPickManyValues)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('pickGarbageCollectionFlags', () => {
  it('should invoke a QuickPick with the correct options', async () => {
    await pickGarbageCollectionFlags()
    expect(mockedQuickPickManyValues).toHaveBeenCalledWith(
      [
        {
          detail: 'Preserve experiments derived from the current workspace',
          label: 'Workspace',
          picked: true,
          value: '--workspace'
        },
        {
          detail: 'Preserve experiments derived from all Git branches',
          label: 'All Branches',
          value: '--all-branches'
        },
        {
          detail: 'Preserve experiments derived from all Git tags',
          label: 'All Tags',
          value: '--all-tags'
        },
        {
          detail: 'Preserve experiments derived from all Git commits',
          label: 'All Commits',
          value: '--all-commits'
        },
        {
          detail: 'Preserve all queued experiments',
          label: 'Queued Experiments',
          value: '--queued'
        }
      ],
      {
        placeHolder: 'Select which experiments to preserve',
        title: Title.GARBAGE_COLLECT_EXPERIMENTS
      }
    )
  })
})
