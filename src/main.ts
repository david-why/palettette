import { Palettette } from "./palettette"

let canvas: HTMLCanvasElement
let runButton: HTMLButtonElement
let palettette: Palettette

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

function onTick() {
  console.log("isrunning:", palettette.isRunning)
  palettette.step()
}

function init() {
  canvas = document.getElementById("palettette-canvas") as HTMLCanvasElement
  runButton = document.getElementById("run-button") as HTMLButtonElement

  canvas.width = 25
  canvas.height = 25
  ctx = canvas.getContext("2d")!

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      setPixel(x, y, [255, 255, 255])
    }
  }
  setPixel(0, 0, [1, 3, 100])
  setPixel(1, 0, [1, 1, 72])
  setPixel(2, 0, [8, 255, 100])

  palettette = new Palettette(ctx, "")

  runButton.addEventListener("click", () => {
    palettette.run()
  })

  setInterval(onTick, 1000)
}

document.addEventListener("DOMContentLoaded", () => {
  init()
})
