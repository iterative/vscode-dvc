# VSCode DVC: Insider Preview

[![Continuous Integration](https://github.com/iterative/vscode-dvc/actions/workflows/build.yml/badge.svg)](https://github.com/iterative/vscode-dvc/actions/workflows/build.yml)
[![Maintainability](https://api.codeclimate.com/v1/badges/fb243c31ea059c0038b2/maintainability)](https://codeclimate.com/repos/608b5886f52398018b00264c/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/fb243c31ea059c0038b2/test_coverage)](https://codeclimate.com/repos/608b5886f52398018b00264c/test_coverage)

A Visual Studio Code Extension that aims to allow users of all technical
backgrounds to effectively use [DVC](https://dvc.org/), particularly the new
[Experiments](https://dvc.org/doc/start/experiments) feature.

This project is in a developmental state, and constantly evolving.

## Setup

### Installing the Extension

This repo is set up with a
[GitHub Action](https://github.com/iterative/vscode-dvc/actions) that uploads an
installable vsix build of the extension for every commit, complete with the Git
SHA appended to the extension version.

You can find the download link in the Artifacts list of any run of the
Continuous Integration workflow.

![Screenshot of artifacts menu](https://user-images.githubusercontent.com/9111807/118053924-64d0e000-b353-11eb-8d3d-7e202d741f54.png)

The easiest way to get to the build for any particular branch is to use the
GitHub Checks UI to get to the details of the "Continuous Integration" run: next
to any commit, its CI status will show up as an icon next to it. From there, you
can get to that commit's vsix in a few clicks through the Continuous Integration
check's details and to the summary of the Check run:

![Guide to get from Checks status to Artifacts](https://user-images.githubusercontent.com/9111807/118057990-19bacb00-b35b-11eb-9030-558e802668f1.png)

Once you have downloaded and extracted the `vsix` file, you can install it
following the
[official documentation](https://code.visualstudio.com/docs/editor/extension-marketplace#_install-from-a-vsix).

### Installing and Integrating With DVC CLI

As you probably already know there are quite a few options for installing DVC.
This extension can integrate with a few different setups. Use the workspace
setup wizard to set the required config options. This can be done via the
welcome view underneath the DVC Tracked view in the side bar's explorer view
container or "Setup The Workspace" in the command palette.

- Currently it is necessary to disable the CLI's analytics as they severely
  impact the overall performance of the extension. You can do this by running
  `dvc config core.analytics false --global` in your terminal. We will be
  looking into improving this experience shortly.

## How to Use

This extension, especially in this early state, makes extensive use of the
[Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette).
Every feature should be available from the Command Palette, and from there
additional GUI elements are added for convenience.

### Experiments

To open up the Experiments table view for a DVC repo, use the "Show Experiments"
command from the Command Palette.

To run experiments, use the "Run Experiment" command or use the UI elements
available when the table is visible.

There are experiments related views available in the DVC view container which
can be selected through the DVC icon in the activity bar.

![Experiment GUI Buttons](https://user-images.githubusercontent.com/9111807/118054967-40760300-b355-11eb-8ee6-38a344bdaced.png)

### SCM

The extension also provides a view in the SCM view container, next to the Git
view, to manage file actions like checkout, pull, push, and add.

![SCM view screenshot](https://user-images.githubusercontent.com/9111807/118057076-19b9cb80-b359-11eb-91bc-9c73a85a83a8.png)

## Contributing

See development docs and contributing guidelines in
[CONTRIBUTING.md](CONTRIBUTING.md)
