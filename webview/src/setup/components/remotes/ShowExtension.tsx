import React from 'react'
import styles from './styles.module.scss'
import { Icon } from '../../../shared/components/Icon'
import { Extensions } from '../../../shared/components/icons'

export const ShowExtension: React.FC<{
  capabilities: string
  id: string
  name: string
}> = ({ capabilities, id, name }) => {
  const idQuery = `"@id:${id}"`

  return (
    <p>
      <Icon
        icon={Extensions}
        width={16}
        height={16}
        className={styles.infoIcon}
      />{' '}
      The{' '}
      <a
        href={`command:workbench.extensions.search?${encodeURIComponent(
          idQuery
        )}`}
      >
        {name}
      </a>{' '}
      extension can be used to <span>{capabilities}</span>.
    </p>
  )
}
