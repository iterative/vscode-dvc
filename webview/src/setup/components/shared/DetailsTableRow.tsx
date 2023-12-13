import React from 'react'
import styles from './styles.module.scss'

export type DetailsTableRowActions = { text: string; onClick: () => void }[]

type DetailsTableRowProps = {
  title: string
  text: string
  actions?: DetailsTableRowActions
}

export const DetailsTableRow: React.FC<DetailsTableRowProps> = ({
  title,
  text,
  actions
}) => {
  return (
    <tr>
      <td className={styles.detailsTableKey}>{title}:</td>
      <td className={styles.detailsTableValue}>
        {text}
        {actions && (
          <span>
            {actions.map(({ text, onClick }, index) => (
              <span key={index}>
                {index > 0 && <span className={styles.separator} />}
                <button className={styles.buttonAsLink} onClick={onClick}>
                  {text}
                </button>
              </span>
            ))}
          </span>
        )}
      </td>
    </tr>
  )
}
