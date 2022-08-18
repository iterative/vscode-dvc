export const createWindowTextSelection = (node: Node | null, offset = 0) => {
  window.getSelection = () => {
    return {
      addRange: jest.fn,
      anchorNode: null,
      anchorOffset: 1,
      collapse: jest.fn,
      collapseToEnd: jest.fn,
      collapseToStart: jest.fn,
      containsNode: () => false,
      deleteFromDocument: jest.fn,
      focusNode: node || null,
      empty: jest.fn,
      focusOffset: 1 + offset,
      extend: jest.fn,
      isCollapsed: false,
      getRangeAt: () => new Range(),
      rangeCount: 1,
      removeAllRanges: jest.fn,
      type: 'text',
      removeRange: jest.fn,
      selectAllChildren: jest.fn,
      setBaseAndExtent: jest.fn,
      setPosition: jest.fn
    }
  }
}

export const clearSelection = () => createWindowTextSelection(null)
