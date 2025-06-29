import { Palettette } from "./palettette"

let canvas: HTMLCanvasElement
let runButton: HTMLButtonElement
let uploadField: HTMLInputElement
let inputField: HTMLInputElement
let outputField: HTMLInputElement

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
  palettette.step()
  outputField.value = palettette.output
}

function init() {
  canvas = document.getElementById("palettette-canvas") as HTMLCanvasElement
  runButton = document.getElementById("run-button") as HTMLButtonElement
  uploadField = document.getElementById("upload-file") as HTMLInputElement
  inputField = document.getElementById("palettette-input") as HTMLInputElement
  outputField = document.getElementById("palettette-output") as HTMLInputElement

  canvas.width = 25
  canvas.height = 25
  ctx = canvas.getContext("2d")!

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      setPixel(x, y, [255, 255, 255])
    }
  }
  setPixel(0, 0, [28, 169, 100])
  setPixel(1, 0, [28, 123, 72])
  setPixel(2, 0, [210, 255, 100])
  setPixel(3, 0, [0, 0, 0])

  palettette = new Palettette(ctx)

  runButton.addEventListener("click", () => {
    palettette.input = inputField.value
    palettette.run()
  })

  uploadField.addEventListener("input", () => {
    const files = uploadField.files
    if (!files || !files.length) return
    const file = files[0]
    const url = URL.createObjectURL(file)

    palettette.reset()
    runButton.disabled = true

    const image = new Image()
    image.addEventListener("load", () => {
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

      palettette = new Palettette(ctx)

      runButton.disabled = false
    })
    image.addEventListener("error", (event) => {
      alert(`Error loading image: ${event.message}`)

      runButton.disabled = false
    })
    image.src = url
  })

  setInterval(onTick, 100)
}

document.addEventListener("DOMContentLoaded", () => {
  init()
})
