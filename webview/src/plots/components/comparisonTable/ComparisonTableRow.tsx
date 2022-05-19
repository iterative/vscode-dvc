import { ComparisonPlot } from 'dvc/src/plots/webview/contract'
import React, { useState } from 'react'
import cx from 'classnames'
import styles from './styles.module.scss'
import { AllIcons, Icon } from '../../../shared/components/Icon'

export interface ComparisonTableRowProps {
  path: string
  plots: ComparisonPlot[]
  nbColumns: number
  pinnedColumn: string
}

export const ComparisonTableRow: React.FC<ComparisonTableRowProps> = ({
  path,
  plots,
  nbColumns,
  pinnedColumn
}) => {
  const [isShown, setIsShown] = useState(true)

  const toggleIsShownState = () => setIsShown(!isShown)

  return (
    <tbody>
      <tr>
        <td className={cx({ [styles.pinnedColumnCell]: pinnedColumn })}>
          <button className={styles.rowToggler} onClick={toggleIsShownState}>
            <Icon
              icon={isShown ? AllIcons.CHEVRON_DOWN : AllIcons.CHEVRON_RIGHT}
            />
            {path}
          </button>
        </td>
        {nbColumns > 1 && <td colSpan={nbColumns - 1}></td>}
      </tr>
      <tr>
        {plots.map((plot: ComparisonPlot | undefined) => {
          const isPinned = pinnedColumn === plot?.revision
          const missing = !plot?.url

          return (
            <td
              key={path + plot?.revision || 'missing'}
              className={cx({
                [styles.pinnedColumnCell]: isPinned,
                [styles.missing]: missing
              })}
            >
              <div
                className={cx(styles.cell, { [styles.cellHidden]: !isShown })}
              >
                {missing ? (
                  <p>No plot to display.</p>
                ) : (
                  <img
                    src={plot.url}
                    alt={`Plot of ${path} (${plot.revision})`}
                  />
                )}
              </div>
            </td>
          )
        })}
      </tr>
    </tbody>
  )
}
