interface Vector2D {
  x: number
  y: number
}

interface TryData {
  location: Vector2D
  varIndex: number
}

interface FunctionData {
  location: Vector2D
  varIndex: number
}

export class PalettetteRuntimeError extends Error {
  constructor(public code: number) {
    super(`Uncaught Palettette error ${code}`)
  }
}

// This is responsible for running the simulation.
// A new instance should be created for a new image.
export class Palettette {
  private width: number
  private height: number
  private initialData: ImageData

  private location: Vector2D = { x: 0, y: 0 }
  private direction: Vector2D = { x: 1, y: 0 }
  private vars: Uint8Array = new Uint8Array(256)
  private functions: (null | FunctionData)[] = Array.from(
    { length: 256 },
    () => null,
  )
  private try: TryData | null = null
  public inputIndex: number = 0
  public output: string = ""
  public isRunning: boolean = false

  constructor(
    public ctx: CanvasRenderingContext2D,
    public input: string,
  ) {
    this.width = ctx.canvas.width
    this.height = ctx.canvas.height
    this.initialData = ctx.getImageData(0, 0, this.width, this.height)
  }

  reset() {
    this.ctx.putImageData(this.initialData, 0, 0)
    this.location = { x: 0, y: 0 }
    this.direction = { x: 1, y: 0 }
    this.vars.fill(0)
    this.functions.fill(null)
    this.try = null
    this.inputIndex = 0
    this.output = ""
    this.isRunning = false
  }

  run() {
    this.reset()
    this.isRunning = true
  }

  private getPixel(advance: number = 0) {
    let { x, y } = this.location
    x = (x + (this.width + this.direction.x) * advance) % this.width
    y = (y + (this.height + this.direction.y) * advance) % this.height
    const index = y * this.width + x
    return this.initialData.data.slice(index * 4, index * 4 + 3)
  }

  private throwError(code: number) {
    if (this.try) {
      this.location = this.try.location
      this.vars[this.try.varIndex] = code
      this.try = null
    } else {
      throw new PalettetteRuntimeError(code)
    }
  }

  private drawAnimated() {
    const imageData = new ImageData(
      new Uint8ClampedArray(this.initialData.data),
      this.width,
      this.height,
    )
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const multiplier =
          this.location.x == x && this.location.y == y ? 2 : 0.7
        imageData.data[(y * this.width + x) * 4 + 0] *= multiplier
        imageData.data[(y * this.width + x) * 4 + 1] *= multiplier
        imageData.data[(y * this.width + x) * 4 + 2] *= multiplier
      }
    }
    this.ctx.putImageData(imageData, 0, 0)
  }

  step({ animate }: { animate: boolean } = { animate: true }) {
    if (!this.isRunning) {
      return
    }
    const [r, g, b] = this.getPixel()
    console.log("[Palettette] Running instruction: ", [r, g, b])
    if (animate) {
      this.drawAnimated()
    }
    if (r == 0) {
      // Halt
      this.isRunning = false
    } else if (r == 1) {
      // Set variable
      if (g < 1 || g > 3) {
        this.throwError(0)
      }
      const next = this.getPixel(1)
      this.vars[b] = next[g - 1]
    } else if (r == 2) {
      // Calculate
      const channel = g & 3
      const operator = g & 252
      if (channel < 1 || channel > 3 || operator < 1 || operator > 4) {
        this.throwError(0)
      }
      const next = this.getPixel(1)
      const rhs = next[channel - 1]
      if (operator == 4 && rhs == 0) {
        this.throwError(1)
      }
      if (operator == 1) {
        this.vars[b] = this.vars[b] + rhs
      } else if (operator == 2) {
        this.vars[b] = this.vars[b] - rhs
      } else if (operator == 3) {
        this.vars[b] = this.vars[b] * rhs
      } else {
        this.vars[b] = Math.floor(this.vars[b] / rhs)
      }
    } else if (r == 3) {
      // Function
      this.functions[b] = { location: this.location, varIndex: g }
    } else if (r == 4) {
      // Try
      this.try = { location: this.location, varIndex: b }
    } else if (r == 5) {
      // Branch
      if (this.vars[g] == this.vars[b]) {
        this.direction = { x: -this.direction.y, y: this.direction.x }
      }
    } else if (r == 6) {
      // Throw
      this.throwError(this.vars[g])
    } else if (r == 7) {
      // Input
      if (this.inputIndex >= this.input.length) {
        this.throwError(2)
      } else {
        this.vars[b] = this.input.charCodeAt(this.inputIndex++)
      }
    } else if (r == 8) {
      // Output
      const char = this.vars[b]
      if (char < 33 || char > 126) {
        this.throwError(3)
      } else {
        this.output += String.fromCharCode(char)
      }
    } else if (r == 9) {
      // Call
      const func = this.functions[b]
      if (!func) {
        this.throwError(4)
      } else {
        this.vars[func.varIndex] = this.vars[g]
        this.location = func.location
      }
    } else if (r == 255) {
      // NOP
    } else {
      this.throwError(5)
    }
    this.location.x =
      (this.location.x + this.direction.x + this.width) % this.width
    this.location.y =
      (this.location.y + this.direction.y + this.height) % this.height
  }
}
