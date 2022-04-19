import React from 'react'
import styles from './styles.module.scss'
import { AllIcons, Icon } from '../Icon'

interface ModalProps {
  onClose: () => void
}

export const Modal: React.FC<ModalProps> = ({ onClose, children }) => {
  return (
    <button className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal}>
        <button onClick={onClose}>
          <Icon icon={AllIcons.CLOSE} />
        </button>
        <div className="content">{children}</div>
      </div>
    </button>
  )
}
