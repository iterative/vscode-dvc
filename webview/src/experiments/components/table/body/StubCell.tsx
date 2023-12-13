import { flexRender } from '@tanstack/react-table'
import React from 'react'
import cx from 'classnames'
import { CellRowActions, CellRowActionsProps } from './CellRowActions'
import { RowExpansionButton } from './RowExpansionButton'
import { ExperimentStatusIndicator } from './ExperimentStatusIndicator'
import styles from '../styles.module.scss'
import { ErrorTooltip } from '../../../../shared/components/tooltip/ErrorTooltip'
import { CellProp } from '../../../util/interfaces'

export const StubCell: React.FC<
  CellProp & CellRowActionsProps & { changesIfWorkspace: boolean }
> = ({ cell, changesIfWorkspace, ...rowActionsProps }) => {
  const {
    row,
    getIsPlaceholder,
    getContext,
    column: {
      getSize,
      columnDef: { cell: columnCell }
    }
  } = cell
  const {
    original: { error, executorStatus, gitRemoteStatus, id, studioLinkType }
  } = row

  return (
    <td className={cx(styles.experimentsTd, styles.experimentCell)}>
      <div className={styles.innerCell} style={{ width: getSize() }}>
        <CellRowActions executorStatus={executorStatus} {...rowActionsProps} />
        <RowExpansionButton row={row} />
        <ExperimentStatusIndicator
          id={id}
          executorStatus={executorStatus}
          gitRemoteStatus={gitRemoteStatus}
          studioLinkType={studioLinkType}
        />

        {getIsPlaceholder() ? null : (
          <ErrorTooltip error={error}>
            <div
              className={cx(styles.experimentCellTextWrapper, {
                [styles.workspaceChangeText]: changesIfWorkspace,
                [styles.errorText]: error
              })}
              data-testid={`id___${id}`}
            >
              {flexRender(columnCell, getContext())}
            </div>
          </ErrorTooltip>
        )}
      </div>
    </td>
  )
}
