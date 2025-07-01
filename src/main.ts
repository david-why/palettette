import { Palettette } from "./palettette"

let canvas: HTMLCanvasElement
let runButton: HTMLButtonElement
let uploadField: HTMLInputElement
let inputField: HTMLInputElement
let outputField: HTMLInputElement

let palettette: Palettette

let ctx: CanvasRenderingContext2D

function onResize() {
  const width = canvas.width
  const height = canvas.height

  const maxWidth = window.innerWidth * 0.8
  const maxHeight = window.innerHeight * 0.8

  if (width / height > maxWidth / maxHeight) {
    // width is limiting
    canvas.style.width = `${maxWidth}px`
    canvas.style.height = `${(maxWidth / width) * height}px`
  } else {
    // height is limiting
    canvas.style.width = `${(maxHeight / height) * width}px`
    canvas.style.height = `${maxHeight}px`
  }
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

function onRun() {
  palettette.input = inputField.value
  palettette.run()
}

function onTick() {
  palettette.step()
  outputField.value = palettette.output
}

function fixTransparent() {
  const data = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
  for (let i = 0; i < data.data.length / 4; i++) {
    if (data.data[i * 4 + 3] != 255) {
      if (
        data.data[i * 4] == 0 &&
        data.data[i * 4 + 1] == 0 &&
        data.data[i * 4 + 2] == 0
      ) {
        data.data.set([255, 255, 255, 255], i * 4)
      } else {
        data.data[i * 4 + 3] = 255
      }
    }
  }
  ctx.putImageData(data, 0, 0)
}

function handleFile(file: Blob) {
  const url = URL.createObjectURL(file)

  palettette.reset()
  runButton.disabled = true

  const image = new Image()
  image.addEventListener("load", () => {
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    fixTransparent()

    palettette = new Palettette(ctx)
    onResize()

    runButton.disabled = false
    URL.revokeObjectURL(url)
  })
  image.addEventListener("error", (event) => {
    alert(`Error loading image: ${event.message}`)

    runButton.disabled = false
    URL.revokeObjectURL(url)
  })
  image.src = url
}

function onUpload() {
  const files = uploadField.files
  if (!files || !files.length) return
  const file = files[0]
  handleFile(file)
}

function onDragging(event: DragEvent) {
  event.preventDefault()
}

function onDrop(event: DragEvent) {
  if (event.dataTransfer?.items.length) {
    const file = event.dataTransfer.items[0]
    if (file.kind == "file" && file.type.startsWith("image/")) {
      event.preventDefault()
      handleFile(file.getAsFile()!)
    }
  }
}

function init() {
  canvas = document.getElementById("palettette-canvas") as HTMLCanvasElement
  runButton = document.getElementById("run-button") as HTMLButtonElement
  uploadField = document.getElementById("upload-file") as HTMLInputElement
  inputField = document.getElementById("palettette-input") as HTMLInputElement
  outputField = document.getElementById("palettette-output") as HTMLInputElement

  canvas.width = 25
  canvas.height = 25
  ctx = canvas.getContext("2d", { willReadFrequently: true })!

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

  runButton.addEventListener("click", onRun)
  uploadField.addEventListener("input", onUpload)
  window.addEventListener("resize", onResize)
  document.addEventListener("dragenter", onDragging)
  document.addEventListener("dragover", onDragging)
  document.addEventListener("drop", onDrop)
  onResize()

  setInterval(onTick, 100)
}

document.addEventListener("DOMContentLoaded", init)
