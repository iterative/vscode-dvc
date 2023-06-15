import React from 'react'
import styles from './styles.module.scss'
import { Icon } from '../../../shared/components/Icon'
import { Extensions } from '../../../shared/components/icons'
import { ExtensionLink } from '../shared/ExtensionLink'

export const ShowExtension: React.FC<{
  capabilities: string
  id: string
  name: string
}> = ({ capabilities, id, name }) => {
  return (
    <p>
      <Icon
        icon={Extensions}
        width={16}
        height={16}
        className={styles.infoIcon}
      />{' '}
      The <ExtensionLink extensionId={id}>{name}</ExtensionLink> extension can
      be used to <span>{capabilities}</span>.
    </p>
  )
}
