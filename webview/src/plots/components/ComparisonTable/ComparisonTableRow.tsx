import { StaticPlot } from 'dvc/src/plots/webview/contract'
import React, { useState } from 'react'
import cx from 'classnames'
import styles from './styles.module.scss'
import { AllIcons, Icon } from '../../../shared/components/icon/Icon'
import { StaticPlotComponent } from '../StaticPlot'

export interface ComparisonTableRowProps {
  path: string
  plots: StaticPlot[]
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
        <td colSpan={nbColumns - 1}></td>
      </tr>
      <tr>
        {plots.map((plot: StaticPlot) => {
          const revision = plot.revisions?.[0]
          const isPinned = pinnedColumn === revision
          return (
            <td
              key={path + plot.revisions?.[0]}
              className={cx({ [styles.pinnedColumnCell]: isPinned })}
            >
              <div
                className={cx(styles.cell, { [styles.cellHidden]: !isShown })}
              >
                <StaticPlotComponent plot={plot} path={path} />
              </div>
            </td>
          )
        })}
      </tr>
    </tbody>
  )
}
