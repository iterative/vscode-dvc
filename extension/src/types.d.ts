declare namespace NodeJS {
  declare interface ProcessEnv {
    HOT_RELOAD?: 'true'
    USE_DEV_UI?: 'true'
  }
}

declare interface DvcTrackedItem {
  uri: vscode.Uri
  type: vscode.FileType
  rel: string
}
