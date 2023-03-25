import { Revision } from 'dvc/src/plots/webview/contract'
import React from 'react'
import { VSCodeProgressRing } from '@vscode/webview-ui-toolkit/react'
import styles from './styles.module.scss'
import { RibbonBlockTooltip } from './RibbonBlockTooltip'
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
  const {
    firstThreeColumns = [],
    commit,
    fetched,
    group,
    id,
    revision: rev,
    displayColor
  } = revision
  const exp = group?.replace(/[[\]]/g, '') || rev

  const mainContent = (
    <li
      className={styles.block}
      style={{ borderColor: displayColor }}
      data-testid={`ribbon-${id || 'no-id'}`}
    >
      <div className={styles.label}>
        <div className={styles.title}>
          {exp}
          <CopyButton value={exp} className={styles.copyButton} />
        </div>
        {group && <div className={styles.subtitle}>{rev}</div>}
      </div>
      <div className={styles.iconPlaceholder}>
        {!fetched && <VSCodeProgressRing className={styles.fetching} />}
      </div>
      <Tooltip content="Clear" placement="bottom" delay={500}>
        <button className={styles.clearButton} onClick={onClear}>
          <Icon icon={Close} width={12} height={12} />
        </button>
      </Tooltip>
    </li>
  )

  return firstThreeColumns.length === 0 && !commit ? (
    mainContent
  ) : (
    <RibbonBlockTooltip revision={revision}>{mainContent}</RibbonBlockTooltip>
  )
}
