// Center-crop an uploaded photo to a small square JPEG so it stays light in the save file.
// (trainer avatar on the dashboard and in onboarding)
const AVATAR_PX = 192

export function shrinkPhoto(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const w = img.naturalWidth,
        h = img.naturalHeight,
        side = Math.min(w, h)
      if (!side) {
        reject(new Error('That image looks empty.'))
        return
      }
      const px = Math.min(AVATAR_PX, side)
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = px
      const ctx = canvas.getContext('2d')
      // JPEG has no transparency, so see-through parts get the frame's color
      ctx.fillStyle =
        getComputedStyle(document.documentElement).getPropertyValue('--lav-lite').trim() ||
        '#cabfee'
      ctx.fillRect(0, 0, px, px)
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, px, px)
      resolve(canvas.toDataURL('image/jpeg', 0.86))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Couldn’t open that image — try a JPG, PNG or WebP.'))
    }
    img.src = url
  })
}
