/* =====================================================================
   Where the app's screen sits in a window of a given size, how big it is
   laid out, and how much it is scaled.

   The screen is a window of its own, inset from the browser window by a
   margin that shows the blue backdrop around it (a little on a phone,
   more on a big monitor). Inside that, a desktop-sized space gets the
   1280-wide layout, scaled so it fills the space: it never has less than
   its full width to work with, and never more than MAX_WIDTH, so on a
   wide monitor the backdrop takes the extra width at the sides instead
   of the layout stretching. Scaling down further would leave the text
   unreadable, so a narrower space gets real pixels instead, and the
   layout reflows to suit (the `@container screen` rules in theme.css).
===================================================================== */

const DESIGN_WIDTH = 1280
const DESIGN_HEIGHT = 800
const MIN_SCALE = 0.8
// The narrowest space the desktop layout still fits. theme.css's narrow
// layout starts just below this.
const MIN_DESKTOP_WIDTH = DESIGN_WIDTH * MIN_SCALE
// The widest the desktop layout gets: at 800 tall, a little wider than the
// design's 16:10, which with the margin looks like the old fixed-size screen.
const MAX_WIDTH = 1360

// The backdrop showing around the screen, in px on each side.
export function screenMargin(windowWidth, windowHeight) {
  return Math.round(Math.min(32, Math.max(8, Math.min(windowWidth, windowHeight) * 0.03)))
}

export function screenSize(windowWidth, windowHeight) {
  const margin = screenMargin(windowWidth, windowHeight)
  const space = { width: windowWidth - 2 * margin, height: windowHeight - 2 * margin }
  if (space.width < MIN_DESKTOP_WIDTH) return { ...space, scale: 1, left: margin, top: margin }
  const fit = Math.min(space.width / DESIGN_WIDTH, space.height / DESIGN_HEIGHT)
  const scale = Math.max(fit, MIN_SCALE)
  const width = Math.min(space.width / scale, MAX_WIDTH)
  // centred: whatever the layout doesn't use goes to the backdrop at the sides
  const left = Math.max(margin, (windowWidth - width * scale) / 2)
  return { width, height: space.height / scale, scale, left, top: margin }
}
