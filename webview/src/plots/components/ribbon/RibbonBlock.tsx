import { Revision } from 'dvc/src/plots/webview/contract'
import cx from 'classnames'
import React from 'react'
import styles from './styles.module.scss'
import { RibbonBlockIcon } from './RibbonBlockIcon'
import { RibbonBlockTooltip } from './RibbonBlockTooltip'
import { LoadingIcon } from './LoadingIcon'
import { Icon } from '../../../shared/components/Icon'
import Tooltip from '../../../shared/components/tooltip/Tooltip'
import { CopyButton } from '../../../shared/components/copyButton/CopyButton'
import { Close } from '../../../shared/components/icons'

interface RibbonBlockProps {
  revision: Revision
  onClear: () => void
}

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
    summaryColumns,
    id,
    label
  } = revision
  const hasError = fetched && !!errors

  const mainContent = (
    <li
      className={styles.block}
      style={{ borderColor: displayColor }}
      data-testid={`ribbon-${id}`}
    >
      <RibbonBlockIcon hasError={hasError} />
      <div className={styles.label}>
        {description ? (
          <>
            <div className={styles.subtitle}>{label}</div>
            <div
              className={cx(styles.title, hasError && styles.errorIndicator)}
            >
              {description}
              <CopyButton
                value={description.replace(/[[\]]/g, '')}
                className={styles.copyButton}
              />
            </div>
          </>
        ) : (
          <div className={cx(styles.title, hasError && styles.errorIndicator)}>
            {label}
            <CopyButton value={label} className={styles.copyButton} />
          </div>
        )}
      </div>
      <LoadingIcon fetched={fetched} />
      <Tooltip content="Clear" placement="bottom" delay={500}>
        <button className={styles.clearButton} onClick={onClear}>
          <Icon icon={Close} width={12} height={12} />
        </button>
      </Tooltip>
    </li>
  )

  return summaryColumns.length === 0 && !commit ? (
    mainContent
  ) : (
    <RibbonBlockTooltip revision={revision}>{mainContent}</RibbonBlockTooltip>
  )
}
