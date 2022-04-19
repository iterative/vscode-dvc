import React, { MouseEvent } from 'react'
import styles from './styles.module.scss'
import { AllIcons, Icon } from '../Icon'

interface ModalProps {
  onClose: () => void
}

export const Modal: React.FC<ModalProps> = ({ onClose, children }) => {
  return (
    <div className={styles.backdrop} onClick={onClose} role="none">
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>
          <Icon icon={AllIcons.CLOSE} width={30} height={30} />
        </button>
        <div role="none" onClick={(e: MouseEvent) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </div>
  )
}
