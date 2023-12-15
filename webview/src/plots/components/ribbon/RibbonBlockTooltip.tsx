import React, { ReactElement } from 'react'
import cx from 'classnames'
import { Revision } from 'dvc/src/plots/webview/contract'
import { formatNumber } from 'dvc/src/util/number'
import styles from './styles.module.scss'
import { Icon } from '../../../shared/components/Icon'
import Tooltip from '../../../shared/components/tooltip/Tooltip'
import { CopyButton } from '../../../shared/components/copyButton/CopyButton'
import { GitCommit, Info } from '../../../shared/components/icons'
import { ErrorTooltipContent } from '../../../shared/components/tooltip/ErrorTooltipContent'

export const RibbonBlockTooltip: React.FC<{
  revision: Revision
  children: ReactElement
}> = ({ revision, children }) => {
  const { summaryColumns, commit, errors } = revision

  const tooltipContent = (
    <div>
      {errors && (
        <div className={styles.addBottomBorder}>
          <ErrorTooltipContent error={errors.join('\n')} />
        </div>
      )}
      <table>
        <tbody>
          {summaryColumns.map(({ path, value, type }) => (
            <tr key={path}>
              <td className={cx(styles.tooltipColumn, styles[`${type}Key`])}>
                <span className={styles.tooltipPathWrapper}>{path}</span>
              </td>
              <td className={styles.tooltipColumn}>
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
      <p className={styles.tooltipTableDescription}>
        <Info className={styles.infoIcon} width={14} height={14} />
        Reflects the first three columns for both metrics and params in the
        experiments table.
      </p>
      {commit && (
        <p
          className={cx(
            styles.commitMessage,
            summaryColumns.length > 0 && styles.addTopBorder
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
