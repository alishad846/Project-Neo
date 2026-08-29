export default defineBackground(() => {
  // Open the Neo side panel when the toolbar icon is clicked (Chrome MV3).
  const c = (globalThis as { chrome?: any }).chrome;
  c?.sidePanel
    ?.setPanelBehavior?.({ openPanelOnActionClick: true })
    ?.catch?.(() => {});
});
