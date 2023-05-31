import React from 'react'
import styles from './styles.module.scss'
import { Icon } from '../../../shared/components/Icon'
import { Extensions } from '../../../shared/components/icons'

export const ShowExtension: React.FC<{ id: string; name: string }> = ({
  id,
  name
}) => {
  const idQuery = `"@id:${id}"`

  return (
    <p>
      <Icon
        icon={Extensions}
        width={16}
        height={16}
        className={styles.infoIcon}
      />{' '}
      View the{' '}
      <a
        href={`command:workbench.extensions.search?${encodeURIComponent(
          idQuery
        )}`}
      >
        {name}
      </a>{' '}
      extension.
    </p>
  )
}
