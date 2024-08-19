export default function getTopWindow() {
  // intercept the exception if we have cross-origin iframe
  try {
    if (window.top.location.href !== undefined) {
      return window.top;
    }
  } catch (e) {
    // provide fallback
  }
  return window;
}
