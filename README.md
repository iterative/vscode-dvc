# DVC Extension for Visual Studio Code

<!--- These will be broken until the repo is public --->
<!--- [![Continuous Integration](https://github.com/iterative/vscode-dvc/actions/workflows/continuous-integration.yml/badge.svg)](https://github.com/iterative/vscode-dvc/actions/workflows/continuous-integration.yml) --->
<!--- [![Cross-Platform Test](https://github.com/iterative/vscode-dvc/actions/workflows/cross-platform-test.yml/badge.svg)](https://github.com/iterative/vscode-dvc/actions/workflows/cross-platform-test.yml) --->
<!-- [![DVC CLI Output Test](https://github.com/iterative/vscode-dvc/actions/workflows/dvc-cli-output-test.yml/badge.svg)](https://github.com/iterative/vscode-dvc/actions/workflows/dvc-cli-output-test.yml) -->

[![Maintainability](https://api.codeclimate.com/v1/badges/fb243c31ea059c0038b2/maintainability)](https://codeclimate.com/repos/608b5886f52398018b00264c/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/fb243c31ea059c0038b2/test_coverage)](https://codeclimate.com/repos/608b5886f52398018b00264c/test_coverage)

Run, compare, visualize, and track machine learning experiments right in VS
Code. This extension uses open-source tool [DVC](https://dvc.org/) and does not
require additional services or databases. It enables other DVC features as well!

- **Experiment bookkeeping**: Activate a visual system to record training data,
  parameters, and metrics on top of [Git](https://git-scm.com/). Use it to
  navigate your experiments, compare their results, and find the best ML model.
- **Visualization**: Plot experiment data in a customizable View.
- **Live tracking**: Capture and see metrics changing in real time.
- **Reproducibility**: Reliably get back to any previous experiment. Run it
  again or use it as the base for new experiments.
- **Data Management**: Handle large datasets, files, and models effectively.

> **Note**: We are in public beta and welcome early adopter feedback!  
> Feel free to open [issues] or reach out to [DVC support].
>
> [issues]: https://github.com/iterative/vscode-dvc/issues
> [dvc support]: https://dvc.org/support

### Why use this extension?

- Enjoy the best developer experience with the first experiment tracking
  interface for an IDE.
- No external servers, databases, subscriptions, etc. Data stays fully under
  your control and your existing Git hosting is used to share and collaborate.
- Go beyond a simple metrics dashboard with complete ML experiments that include
  metrics, code, and data. Powered by [DVC experiment versioning].
- Implement [data versioning] on top of your favorite cloud storage, such as
  Amazon S3, Azure Blob Storage, Google Cloud Storage, NFS, etc.

[dvc experiment versioning]:
  https://dvc.org/doc/user-guide/experiment-management/experiments-overview
[data versioning]: https://dvc.org/doc/use-cases/versioning-data-and-model-files

## Quick start

1. [Install DVC](https://dvc.org/doc/install) on your system.
2. [Install the DVC Extension] in VS Code.
3. Follow the **Get Started** page that pops up!

> 💡 Feel free to try our [example DVC project] first! Opening it [with Github >
> Codespaces] will include this extension automatically.

[install the dvc extension]:
  https://code.visualstudio.com/docs/editor/extension-gallery
[example dvc project]: https://github.com/iterative/example-get-started
[with github codespaces]:
  https://docs.github.com/en/codespaces/getting-started/quickstart#creating-your-codespace

### Learn more about DVC (Data Version Control)

See the DVC documentation to Get Started with [Experiment Versioning] or [Data
Management]. For deeper learning, try our [free course]!

[experiment versioning]: https://dvc.org/doc/start/experiments
[data management]: https://dvc.org/doc/start/data-management
[free course]: https://learn.iterative.ai/

## UI components

This [extension] augments and adds several [Views], adds special [Editors] to VS
Code. It also exposes these and other DVC functions in the [Command Palette].

- Provides _Editors_ to manage [Experiments][exp-view] and display
  [Plots][plots-view] as _Tabs_ in the IDE.
- Adds a [DVC Tracked] panel to the _Explorer_ view. This shows a tree of the
  data that DVC is tracking, with real-time file/dir [states] and options to
  [synchronize] them (from/to remote storage).
- Adds a [DVC panel] to the _Source Control_ view to list the [workspace
  status]. You can [restore] or reset project versions (based on the current Git
  `HEAD` commit) as well as [manage new and existing data] from here.
- Adds a brand-new [DVC View] (<img
  src="https://user-images.githubusercontent.com/1477535/171570901-9012413c-f0bb-41d9-9a45-2653b4e3f1fe.png"
  alt="DVC logo" style="height: 1em;"/> icon in the Activity Bar) with panels to
  visualize and manage [DVC Experiments].
- Registers several [commands] in the _Command Palette_.
- Includes a [DVC channel] for the _Output_ panel (useful for
  [debugging](#debugging)).

[extension]: https://marketplace.visualstudio.com/items?itemName=Iterative.dvc
[views]: https://code.visualstudio.com/docs/getstarted/userinterface#_views
[editors]:
  https://code.visualstudio.com/docs/getstarted/userinterface#_open-editors
[command palette]:
  https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette
[exp-view]: extension/resources/walkthrough/experiments-table.md
[plots-view]: extension/resources/walkthrough/plots.md
[dvc tracked]: extension/resources/walkthrough/tracked-explorer.md
[dvc panel]: extension/resources/walkthrough/source-control-management.md
[dvc view]: extension/resources/walkthrough/view-container.md
[commands]: extension/resources/walkthrough/command-palette.md
[dvc output]: #

## Useful commands

Open the Command Palette (`F1` or ⇧⌃P on Windows/Linux or ⇧⌘P on macOS) and type
in one of the following commands:

| Command                    | Description                                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `DVC: Get Started`         | Open the extension's walkthrough. Which details all of the current features and provides links to extra learning resources. |
| `View: Show DVC`           | Open the extension's view container.                                                                                        |
| `DVC: Setup The Workspace` | Activate the extension's workspace setup wizard.                                                                            |
| `DVC: Show Experiments`    | Show an interactive version of DVC's `exp show` [command](https://dvc.org/doc/command-reference/exp/show).                  |
| `DVC: Show Plots`          | Show an interactive version of DVC's `plots diff` [command](https://dvc.org/doc/command-reference/plots/diff).              |

See the full list of VS Code [commands] available.

## Configuration

These are the [VS Code Settings] available for the Extension:

| **Option**                             | **Description**                                                                                                                                      |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dvc.dvcPath`                          | Path or shell command to the DVC binary. Required unless Microsoft's [Python extension] is installed and the `dvc` package found in its environment. |
| `dvc.pythonPath`                       | Path to the desired Python interpreter to use with DVC. Required when using a virtual environment.                                                   |
| `dvc.doNotShowWalkthroughAfterInstall` | Do not prompt to show the Get Started page after installing. Useful for pre-configured development environments                                      |
| `dvc.doNotRecommendRedHatExtension`    | Do not prompt to install the Red Hat YAML extension, which helps with DVC YAML schema validation (`dvc.yaml` and `.dvc` files).                      |
| `dvc.doNotShowCliUnavailable`          | Do not warn when the workspace contains a DVC project but the DVC binary is unavailable.                                                             |
| `dvc.doNotShowUnableToFilter`          | Do not warn before disabling auto-apply filters when these would result in too many experiments being selected.                                      |

> **Note** that the `Setup The Workspace` command helps you set up the basic
> ones at the [Workspace level] (saved to `.vscode/setting.json`).

[python extension]:
  https://marketplace.visualstudio.com/items?itemName=ms-python.python
[workspace level]:
  https://code.visualstudio.com/docs/getstarted/settings#_workspace-settings

## Debugging

### The DVC Extension

Please see the DVC [channel] in the IDE's _Output_ panel to see the underlying
DVC commands being run, as wel as their error output. Feel free to share this
with us via [DVC support].

[channel]:
  https://code.visualstudio.com/api/extension-capabilities/common-capabilities#output-channel

### Your DVC project

Due to the way DVC pipelines run scripts of any language from the command line,
users must debug pipeline scripts (e.g. `train.py`) standalone in whatever way
debuggers are run on the base language - this is standard for debugging DVC
pipelines, and most scripts are capable of running outside of DVC.

## Contributing

See development docs and contributing guidelines in
[CONTRIBUTING.md](CONTRIBUTING.md)

## Data and telemetry

The DVC Extension for Visual Studio Code collects usage data and sends it to
Azure to help improve our products and services. This extension respects the
`telemetry.enableTelemetry` setting which you can learn more about at
https://code.visualstudio.com/docs/supporting/faq#_how-to-disable-telemetry-reporting.
