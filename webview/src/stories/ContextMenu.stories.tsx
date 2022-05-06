import { Meta, Story } from '@storybook/react/types-6-0'
import React from 'react'
import '../shared/style.scss'
import './test-vscode-styles.scss'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { Theme } from '../shared/components/theme/Theme'
import {
  ContextMenu,
  ContextMenuProps
} from '../shared/components/contextMenu/ContextMenu'
import { AllIcons, Icon } from '../shared/components/Icon'
import { MessagesMenu } from '../shared/components/messagesMenu/MessagesMenu'

export default {
  args: {},
  component: ContextMenu,
  title: 'Context Menu'
} as Meta

const Template: Story<ContextMenuProps> = () => {
  return (
    <Theme>
      <ContextMenu
        content={
          <MessagesMenu
            options={[
              {
                id: 'apply-to-workspace',
                label: 'Apply to Workspace',
                message: {
                  payload: 'column-id',
                  type: MessageFromWebviewType.APPLY_EXPERIMENT_TO_WORKSPACE
                }
              }
            ]}
          />
        }
      >
        <div>
          <Icon width={15} icon={AllIcons.LINES} />
        </div>
      </ContextMenu>
    </Theme>
  )
}

export const WithOptions = Template.bind({})
