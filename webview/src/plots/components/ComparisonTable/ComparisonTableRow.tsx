import { StaticPlot } from 'dvc/src/plots/webview/contract'
import React, { useState } from 'react'
import cx from 'classnames'
import styles from './styles.module.scss'
import { AllIcons, Icon } from '../../../shared/components/icon/Icon'
import { StaticPlotComponent } from '../StaticPlot'

interface ComparisonTableProps {
  path: string
  plots: StaticPlot[]
  nbColumns: number
}

export const ComparisonTableRow: React.FC<ComparisonTableProps> = ({
  path,
  plots,
  nbColumns
}) => {
  const [isShown, setIsShown] = useState(true)

  const toggleIsShownState = () => setIsShown(!isShown)

  return (
    <tbody>
      <tr>
        <td colSpan={nbColumns}>
          <button className={styles.rowToggler} onClick={toggleIsShownState}>
            <Icon
              icon={isShown ? AllIcons.CHEVRON_DOWN : AllIcons.CHEVRON_RIGHT}
              color={'#fff'}
            />
            {path}
          </button>
        </td>
      </tr>
      <tr>
        {plots.map((plot: StaticPlot) => (
          <td key={path + plot.revisions?.[0]} data-something={plot.revisions}>
            <div className={cx(styles.cell, { [styles.cellHidden]: !isShown })}>
              <StaticPlotComponent plot={plot} path={path} />
            </div>
          </td>
        ))}
      </tr>
    </tbody>
  )
}
