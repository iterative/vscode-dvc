import React from 'react'
import { STUDIO_URL, SetupSection } from 'dvc/src/setup/webview/contract'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import styles from './styles.module.scss'

const sectionDescriptionTestIds = {
  // "Custom"
  [PlotsSection.CUSTOM_PLOTS]: 'tooltip-custom-plots',
  // "Images"
  [PlotsSection.COMPARISON_TABLE]: 'tooltip-comparison-plots',
  // "Data Series"
  [PlotsSection.TEMPLATE_PLOTS]: 'tooltip-template-plots',
  // Setup DVC
  [SetupSection.DVC]: 'tooltip-setup-dvc',
  // Setup Get Started
  [SetupSection.GET_STARTED]: 'tooltip-setup-get-started',
  // Setup Experiments
  [SetupSection.EXPERIMENTS]: 'tooltip-setup-experiments',
  // Setup Remote
  [SetupSection.REMOTES]: 'tooltip-setup-remote',
  // Setup Studio
  [SetupSection.STUDIO]: 'tooltip-setup-studio'
}

export const SectionDescriptionMainText = {
  // "Custom"
  [PlotsSection.CUSTOM_PLOTS]: (
    <>
      Generated custom linear plots comparing chosen metrics and params in all
      experiments in the table.
    </>
  ),
  // "Images"
  [PlotsSection.COMPARISON_TABLE]: (
    <>
      Images (e.g. any <code>.jpg</code>, <code>.svg</code>, or
      <code>.png</code> file) rendered side by side across experiments. They
      should be registered as{' '}
      <a href="https://dvc.org/doc/user-guide/experiment-management/visualizing-plots">
        plots
      </a>
      .
    </>
  ),
  // "Data Series"
  [PlotsSection.TEMPLATE_PLOTS]: (
    <>
      Any <code>JSON</code>, <code>YAML</code>, <code>CSV</code>, or{' '}
      <code>TSV</code> file(s) with data points, visualized using{' '}
      <a href="https://dvc.org/doc/user-guide/experiment-management/visualizing-plots#plot-templates-data-series-only">
        plot templates
      </a>
      . Either predefined (e.g. confusion matrix, linear) or{' '}
      <a href="https://dvc.org/doc/command-reference/plots/templates#custom-templates">
        custom Vega-lite templates
      </a>
      .
    </>
  ),
  // Setup Get Started
  [SetupSection.GET_STARTED]: <>Get started with the extension</>,
  // Setup DVC
  [SetupSection.DVC]: <>Configure the extension to start working with DVC.</>,
  // Setup Experiments
  [SetupSection.EXPERIMENTS]: (
    <>
      Configure the extension to start tracking and visualizing{' '}
      <a href="https://dvc.org/doc/start/experiment-management/experiments">
        experiments
      </a>
      .
    </>
  ),
  // Setup Remote
  [SetupSection.REMOTES]: (
    <>
      Configure DVC to work with{' '}
      <a href="https://dvc.org/doc/user-guide/data-management/remote-storage">
        remote data storage
      </a>
      .
    </>
  ),
  // Setup Studio
  [SetupSection.STUDIO]: (
    <>
      {"Configure the extension's connection to "}
      <a href={STUDIO_URL}>Studio</a>.<br />
      Studio provides a collaboration platform for Machine Learning and is free
      for small teams and individual contributors.
    </>
  )
} as const

export const SectionDescription: React.FC<{
  sectionKey: SetupSection | PlotsSection
  overrideSectionDescription?: JSX.Element
}> = ({ sectionKey, overrideSectionDescription }) => (
  <span data-testid={sectionDescriptionTestIds[sectionKey]}>
    {overrideSectionDescription ? (
      <span className={styles.infoTooltipeEphasizedText}>
        {overrideSectionDescription}
      </span>
    ) : (
      (SectionDescriptionMainText[sectionKey] as JSX.Element)
    )}
  </span>
)
