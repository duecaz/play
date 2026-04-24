/* Canvas drawing helpers for the TextCorrection template. */

const STROKE_COLOR  = 'rgba(74,144,226,0.85)'
const RESULT_COLOR  = 'rgba(74,144,226,0.65)'
const ZONE_COLOR    = 'rgba(74,144,226,0.55)'
const ERASER_COLOR  = 'rgba(255,80,80,0.8)'

export function drawZoneBorders(ctx, zones) {
  if (!ctx || !zones.length) return
  ctx.save()
  ctx.strokeStyle = ZONE_COLOR
  ctx.lineWidth   = 1.5
  ctx.setLineDash([4, 3])
  zones.forEach(z => ctx.strokeRect(z.x, z.y, z.w, z.h))
  ctx.setLineDash([])
  ctx.restore()
}

export function redrawResults(ctx, canvas, strokes, checkW, checkH) {
  if (!ctx) return
  const scaleX = checkW > 0 ? canvas.width  / checkW : 1
  const scaleY = checkH > 0 ? canvas.height / checkH : 1
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  strokes.forEach(stroke => {
    if (stroke.length < 2) return
    ctx.beginPath()
    ctx.moveTo(stroke[0].x * scaleX, stroke[0].y * scaleY)
    for (let i = 1; i < stroke.length; i++) {
      ctx.lineTo(stroke[i].x * scaleX, stroke[i].y * scaleY)
    }
    ctx.strokeStyle = RESULT_COLOR
    ctx.lineWidth   = 2
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.stroke()
  })
}

/* Filter strokes that pass through the erase circle, redraw the rest, and
   return the new strokes array. Pass radius=0 to just redraw without erasing
   (used to remove the eraser indicator after penup). */
export function erase(ctx, canvas, strokes, cx, cy, radius = 30, debugZones = false, zones = []) {
  const r2       = radius * radius
  const filtered = strokes.filter(
    stroke => !stroke.some(pt => (pt.x - cx) ** 2 + (pt.y - cy) ** 2 <= r2)
  )
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  if (debugZones) drawZoneBorders(ctx, zones)
  filtered.forEach(stroke => {
    if (stroke.length < 2) return
    ctx.beginPath()
    ctx.moveTo(stroke[0].x, stroke[0].y)
    for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y)
    ctx.strokeStyle = STROKE_COLOR
    ctx.lineWidth   = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctx.stroke()
  })
  return filtered
}

export function drawEraserIndicator(ctx, cx, cy, radius = 30) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.strokeStyle = ERASER_COLOR
  ctx.lineWidth   = 2
  ctx.setLineDash([5, 4])
  ctx.stroke()
  ctx.restore()
}
