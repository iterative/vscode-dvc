import React, { ReactElement } from 'react'
import cn from 'classnames'
import { Revision } from 'dvc/src/plots/webview/contract'
import { formatNumber } from 'dvc/src/util/number'
import styles from './styles.module.scss'
import { Icon } from '../../../shared/components/Icon'
import Tooltip from '../../../shared/components/tooltip/Tooltip'
import { CopyButton } from '../../../shared/components/copyButton/CopyButton'
import { GitCommit } from '../../../shared/components/icons'

export const RibbonBlockTooltip: React.FC<{
  revision: Revision
  children: ReactElement
}> = ({ revision, children }) => {
  const { firstThreeColumns, commit } = revision

  const tooltipContent = (
    <div>
      <table className={styles.columnsTable}>
        <tbody>
          {firstThreeColumns.map(({ path, value, type }) => (
            <tr key={path}>
              <td className={cn(styles[`${type}Key`])}>
                <span className={styles.tooltipPathWrapper}>{path}</span>
              </td>
              <td>
                {typeof value === 'number' ? formatNumber(value) : value}
                {value === '-' || (
                  <CopyButton
                    value={value.toString()}
                    className={styles.copyButton}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {commit && (
        <p
          className={cn(
            styles.commitMessage,
            firstThreeColumns.length > 0 && styles.addBorder
          )}
        >
          <Icon width={14} height={14} icon={GitCommit} />
          {commit}
        </p>
      )}
    </div>
  )

  return (
    <Tooltip
      placement="bottom-start"
      content={tooltipContent}
      maxWidth="none"
      interactive
    >
      {children}
    </Tooltip>
  )
}
