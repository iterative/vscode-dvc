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

const RevisionIcon: React.FC<{ fetched: boolean; errors?: string[] }> = ({
  fetched,
  errors
}) => (
  <div className={styles.iconPlaceholder}>
    {fetched && errors && '!'}
    {!fetched && <VSCodeProgressRing className={styles.fetching} />}
  </div>
)

export const RibbonBlock: React.FC<RibbonBlockProps> = ({
  revision,
  onClear
}) => {
  const {
    commit,
    description,
    displayColor,
    errors,
    fetched,
    firstThreeColumns,
    id,
    label
  } = revision

  const mainContent = (
    <li
      className={styles.block}
      style={{ borderColor: displayColor }}
      data-testid={`ribbon-${id}`}
    >
      <div className={styles.label}>
        {description ? (
          <>
            <div className={styles.subtitle}>{label}</div>
            <div className={styles.title}>
              {description}
              <CopyButton
                value={description.replace(/[[\]]/g, '')}
                className={styles.copyButton}
              />
            </div>
          </>
        ) : (
          <div className={styles.title}>
            {label}
            <CopyButton value={label} className={styles.copyButton} />
          </div>
        )}
      </div>
      <div className={styles.iconPlaceholder}>
        <RevisionIcon errors={errors} fetched={fetched} />
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
