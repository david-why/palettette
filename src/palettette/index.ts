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

const Errors = {
  invalidParameter: 252,
  divideByZero: 92,
  inputStreamEmpty: 108,
  outputNonASCII: 155,
  functionUndefined: 22,
  invalidInstruction: 50,
  noFunctionCalled: 66,
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
  private callStack: Vector2D[] = []
  public inputIndex: number = 0
  public output: string = ""
  public isRunning: boolean = false

  constructor(
    public ctx: CanvasRenderingContext2D,
    public input: string = "",
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
    this.callStack.length = 0
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
    if (!this.isRunning) {
      this.ctx.putImageData(this.initialData, 0, 0)
      return
    }
    const imageData = new ImageData(
      new Uint8ClampedArray(this.initialData.data),
      this.width,
      this.height,
    )
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const multiplier =
          this.location.x == x && this.location.y == y ? 1 : 0.7
        imageData.data[(y * this.width + x) * 4 + 0] *= multiplier
        imageData.data[(y * this.width + x) * 4 + 1] *= multiplier
        imageData.data[(y * this.width + x) * 4 + 2] *= multiplier
      }
    }
    this.ctx.putImageData(imageData, 0, 0)
  }

  private mapChannelToIndex(channel: number) {
    switch (channel) {
      case 123:
        return 1
      case 222:
        return 2
      case 169:
        return 3
      default:
        this.throwError(Errors.invalidParameter)
    }
  }

  step({ animate }: { animate: boolean } = { animate: true }) {
    if (!this.isRunning) {
      this.drawAnimated()
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
    } else if (r == 28) {
      // Set variable
      const next = this.getPixel(1)
      const index = this.mapChannelToIndex(g)
      if (index) {
        this.vars[b] = next[index - 1]
      }
    } else if (r == 59) {
      // Calculate
      const channel = g & 3
      const operator = g >> 5
      if (channel < 1 || operator < 1 || operator > 4) {
        this.throwError(Errors.invalidParameter)
      }
      if (channel) {
        const next = this.getPixel(1)
        const rhs = next[channel - 1]
        if (operator == 4 && rhs == 0) {
          this.throwError(Errors.divideByZero)
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
      }
    } else if (r == 72) {
      // Function
      this.functions[b] = { location: { ...this.location }, varIndex: g }
    } else if (r == 105) {
      // Try
      this.try = { location: { ...this.location }, varIndex: b }
    } else if (r == 122) {
      // Return
      if (this.callStack.length) {
        this.location = this.callStack.pop()!
      } else {
        this.throwError(Errors.noFunctionCalled)
      }
    } else if (r == 134) {
      // Branch
      if (this.vars[g] == this.vars[b]) {
        this.direction = { x: -this.direction.y, y: this.direction.x }
      }
    } else if (r == 173) {
      // Throw
      this.throwError(this.vars[g])
    } else if (r == 192) {
      // Input
      if (this.inputIndex >= this.input.length) {
        this.throwError(Errors.inputStreamEmpty)
      } else {
        this.vars[b] = this.input.charCodeAt(this.inputIndex++)
      }
    } else if (r == 210) {
      // Output
      const char = this.vars[b]
      if (char < 32 || char > 126) {
        this.throwError(Errors.outputNonASCII)
      } else {
        this.output += String.fromCharCode(char)
      }
    } else if (r == 242) {
      // Call
      const func = this.functions[b]
      if (!func) {
        this.throwError(Errors.functionUndefined)
      } else {
        this.vars[func.varIndex] = this.vars[g]
        this.callStack.push(this.location)
        this.location = { ...func.location }
      }
    } else if (r == 255) {
      // NOP
    } else {
      this.throwError(Errors.invalidInstruction)
    }
    this.location.x =
      (this.location.x + this.direction.x + this.width) % this.width
    this.location.y =
      (this.location.y + this.direction.y + this.height) % this.height
  }
}
