let canvas: HTMLCanvasElement
let ctx: CanvasRenderingContext2D

function getPixel(x: number, y: number): Uint8ClampedArray {
  return ctx.getImageData(x, y, 1, 1).data.slice(0, 3)
}

function setPixel(
  x: number,
  y: number,
  pixel: [number, number, number] | Uint8ClampedArray,
) {
  const data = ctx.createImageData(1, 1)
  data.data.set(pixel)
  data.data[3] = 255
  ctx.putImageData(data, x, y)
}

function init() {
  canvas = document.getElementById("palettette-canvas") as HTMLCanvasElement
  canvas.width = 100
  canvas.height = 75
  ctx = canvas.getContext("2d")!
  setPixel(0, 0, [255, 0, 0])
}

document.addEventListener("DOMContentLoaded", () => {
  init()
})
