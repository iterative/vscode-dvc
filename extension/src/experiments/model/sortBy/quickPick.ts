import { SortDefinition } from '.'
import { definedAndNonEmpty } from '../../../util/array'
import { quickPickManyValues, quickPickValue } from '../../../vscode/quickPick'
import { Title } from '../../../vscode/title'
import { Toast } from '../../../vscode/toast'
import { ColumnLike } from '../../columns/like'
import { pickFromColumnLikes } from '../../columns/quickPick'

export const pickSortToAdd = async (columns: ColumnLike[] | undefined) => {
  const picked = await pickFromColumnLikes(columns, {
    title: Title.SELECT_PARAM_OR_METRIC_SORT
  })
  if (picked === undefined) {
    return
  }
  const descending = await quickPickValue<boolean>(
    [
      { label: 'Ascending', value: false },
      { label: 'Descending', value: true }
    ],
    { title: Title.SELECT_SORT_DIRECTION }
  )
  if (descending === undefined) {
    return
  }
  return {
    descending,
    path: picked.path
  }
}

export const pickSortsToRemove = (
  sorts: SortDefinition[]
): Thenable<SortDefinition[] | undefined> => {
  if (!definedAndNonEmpty(sorts)) {
    return Toast.showError('There are no sorts to remove.')
  }

  return quickPickManyValues<SortDefinition>(
    sorts.map(sort => ({
      description: sort.descending ? 'descending' : 'ascending',
      label: sort.path,
      value: sort
    })),
    {
      title: Title.SELECT_SORTS_TO_REMOVE
    }
  )
}
