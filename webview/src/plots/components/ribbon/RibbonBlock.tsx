import { Revision } from 'dvc/src/plots/webview/contract'
import React from 'react'
import styles from './styles.module.scss'
import { AllIcons, Icon } from '../../../shared/components/Icon'
import Tooltip from '../../../shared/components/tooltip/Tooltip'
import { CopyButton } from '../../../shared/components/copyButton/CopyButton'

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

  return (
    <li
      className={styles.block}
      style={{ borderColor: revision.displayColor }}
      data-testid={`ribbon-${revision.id}`}
    >
      <div className={styles.label}>
        <div className={styles.title}>
          <CopyButton value={exp} className={styles.copyButton} />
          {exp}
        </div>
        {revision.group && (
          <div className={styles.subtitle}>{revision.revision}</div>
        )}
      </div>
      <Tooltip content="Clear" placement="bottom" delay={500}>
        <button className={styles.clearButton} onClick={onClear}>
          <Icon icon={AllIcons.CLOSE} width={12} height={12} />
        </button>
      </Tooltip>
    </li>
  )
}
