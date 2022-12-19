import { Revision } from 'dvc/src/plots/webview/contract'
import React from 'react'
import cn from 'classnames'
import { VSCodeProgressRing } from '@vscode/webview-ui-toolkit/react'
import { truncate } from 'vega'
import styles from './styles.module.scss'
import { Icon } from '../../../shared/components/Icon'
import Tooltip from '../../../shared/components/tooltip/Tooltip'
import { CopyButton } from '../../../shared/components/copyButton/CopyButton'
import { Close } from '../../../shared/components/icons'

interface RibbonBlockProps {
  revision: Revision
  onClear: () => void
}

export enum CopyTooltip {
  NORMAL = 'Copy',
  COPIED = 'Copied'
}

export const RibbonBlock: React.FC<RibbonBlockProps> = ({
  revision,
  onClear
}) => {
  const exp = revision.group?.replace(/[[\]]/g, '') || revision.revision

  const tooltipContent = (
    <table className={styles.columnsTable}>
      <tbody>
        {revision.firstThreeColumns.map(({ path, value, type, fullValue }) => (
          <tr key={path}>
            <td className={cn(styles[`${type}Key`])}>
              {truncate(path, 45, 'left')}
            </td>
            <td>
              {value}
              {value === '-' || (
                <CopyButton value={fullValue} className={styles.copyButton} />
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  const mainContent = (
    <li
      className={styles.block}
      style={{ borderColor: revision.displayColor }}
      data-testid={`ribbon-${revision.id}`}
    >
      <div className={styles.label}>
        <div className={styles.title}>
          {exp}
          <CopyButton value={exp} className={styles.copyButton} />
        </div>
        {revision.group && (
          <div className={styles.subtitle}>{revision.revision}</div>
        )}
      </div>
      <div className={styles.iconPlaceholder}>
        {!revision.fetched && (
          <VSCodeProgressRing className={styles.fetching} />
        )}
      </div>
      <Tooltip content="Clear" placement="bottom" delay={500}>
        <button className={styles.clearButton} onClick={onClear}>
          <Icon icon={Close} width={12} height={12} />
        </button>
      </Tooltip>
    </li>
  )

  return revision.firstThreeColumns.length === 0 ? (
    mainContent
  ) : (
    <Tooltip placement="bottom-start" content={tooltipContent} interactive>
      {mainContent}
    </Tooltip>
  )
}
