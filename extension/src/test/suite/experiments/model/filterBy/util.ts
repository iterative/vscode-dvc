import { stub } from 'sinon'
import { commands, QuickPickItem, window } from 'vscode'
import columnsFixture from '../../../../fixtures/expShow/columns'
import { FilterDefinition } from '../../../../../experiments/model/filterBy'
import { experimentsUpdatedEvent } from '../../../util'
import { Experiments } from '../../../../../experiments'
import { RegisteredCommands } from '../../../../../commands/external'
import { addStarredToColumns } from '../../../../../experiments/columns/like'

export const mockQuickInputFilter = (
  fixtureFilter: FilterDefinition,
  mockShowQuickPick = stub(window, 'showQuickPick'),
  mockShowInputBox = stub(window, 'showInputBox')
) => {
  const column = addStarredToColumns(columnsFixture)?.find(
    column => column.path === fixtureFilter.path
  )
  mockShowQuickPick
    .onFirstCall()
    .resolves({ value: column } as unknown as QuickPickItem)
  mockShowQuickPick.onSecondCall().resolves({
    value: fixtureFilter.operator
  } as unknown as QuickPickItem)
  mockShowInputBox.onFirstCall().resolves(fixtureFilter.value as string)
}

export const addFilterViaQuickInput = (
  experiments: Experiments,
  fixtureFilter: FilterDefinition,
  mockShowQuickPick = stub(window, 'showQuickPick'),
  mockShowInputBox = stub(window, 'showInputBox')
) => {
  mockShowQuickPick.resetHistory()
  mockShowInputBox.resetHistory()

  mockQuickInputFilter(fixtureFilter, mockShowQuickPick, mockShowInputBox)

  const tableFilterAdded = experimentsUpdatedEvent(experiments)

  commands.executeCommand(RegisteredCommands.EXPERIMENT_FILTER_ADD)

  return tableFilterAdded
}
