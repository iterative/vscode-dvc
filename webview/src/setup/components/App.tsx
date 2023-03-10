import {
  DEFAULT_SECTION_COLLAPSED,
  Section,
  SetupData
} from 'dvc/src/setup/webview/contract'
import { MessageToWebview } from 'dvc/src/webview/contract'
import React, { useCallback, useState } from 'react'
import { SetupExperiments } from './Experiments'
import { SectionContainer } from '../../shared/components/sectionContainer/SectionContainer'
import { useVsCodeMessaging } from '../../shared/hooks/useVsCodeMessaging'

export const App: React.FC = () => {
  const [cliCompatible, setCliCompatible] = useState<boolean | undefined>(
    undefined
  )
  const [projectInitialized, setProjectInitialized] = useState<boolean>(false)
  const [needsGitInitialized, setNeedsGitInitialized] = useState<
    boolean | undefined
  >(false)
  const [canGitInitialize, setCanGitInitialized] = useState<
    boolean | undefined
  >(false)
  const [needsGitCommit, setNeedsGitCommit] = useState<boolean>(false)
  const [pythonBinPath, setPythonBinPath] = useState<string | undefined>(
    undefined
  )
  const [isPythonExtensionInstalled, setIsPythonExtensionInstalled] =
    useState<boolean>(false)
  const [hasData, setHasData] = useState<boolean | undefined>(false)
  const [sectionCollapsed, setSectionCollapsed] = useState<
    typeof DEFAULT_SECTION_COLLAPSED
  >(DEFAULT_SECTION_COLLAPSED)

  useVsCodeMessaging(
    useCallback(
      ({ data }: { data: MessageToWebview<SetupData> }) => {
        setCanGitInitialized(data.data.canGitInitialize)
        setCliCompatible(data.data.cliCompatible)
        setHasData(data.data.hasData)
        setIsPythonExtensionInstalled(data.data.isPythonExtensionInstalled)
        setNeedsGitInitialized(data.data.needsGitInitialized)
        setNeedsGitCommit(data.data.needsGitCommit)
        setProjectInitialized(data.data.projectInitialized)
        setPythonBinPath(data.data.pythonBinPath)
      },
      [
        setCanGitInitialized,
        setCliCompatible,
        setHasData,
        setIsPythonExtensionInstalled,
        setNeedsGitInitialized,
        setNeedsGitCommit,
        setProjectInitialized,
        setPythonBinPath
      ]
    )
  )

  return (
    <SectionContainer
      sectionCollapsed={sectionCollapsed[Section.EXPERIMENTS]}
      sectionKey={Section.EXPERIMENTS}
      title={'Experiments'}
      onToggleSection={() =>
        setSectionCollapsed({
          ...sectionCollapsed,
          [Section.EXPERIMENTS]: !sectionCollapsed[Section.EXPERIMENTS]
        })
      }
    >
      <SetupExperiments
        canGitInitialize={canGitInitialize}
        cliCompatible={cliCompatible}
        hasData={hasData}
        isPythonExtensionInstalled={isPythonExtensionInstalled}
        needsGitInitialized={needsGitInitialized}
        needsGitCommit={needsGitCommit}
        projectInitialized={projectInitialized}
        pythonBinPath={pythonBinPath}
      />
    </SectionContainer>
  )
}
