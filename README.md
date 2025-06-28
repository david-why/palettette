# Palettette: Image-based esolang

Fun with colors

## Language description

This is an [esoteric programming language](https://esolangs.org/wiki/Esoteric_programming_language) in which you program by making images. Each image is a single program in Palettette.

The interpreter has 256 variables with indices 0 to 255, all of which one byte and initialized to 0. Execution starts at location `(0, 0)` (i.e., the top left corner of the image), and the interpreter moves one pixel in the current direction (initially right) each time it finishes with one instruction. If one end of the image is reached, the interpreter wraps around onto the same row/column.

The pixels are treated as separate RGB values from 0 to 255. The R value determines the instruction to execute. The G and B values designate inputs and/or outputs, as detailed below.

The interpreter supports functions. There can be a maximum of 256 functions, indexed from 0 to 255. To call a function means to change the current location to the location where Function is called. Functions all have exactly one parameter, which is a variable; they can write to that variable to return a value.

There is an input stream, which can be read one character at a time. There is also an output stream which can be written.

## Error handling

Some instructions may throw errors. If they do, it is explicitly stated.

When an error is thrown, if a Try instruction has been executed and not yet used, the error code is stored in the variable designated by the Try instruction, and execution will continue from that location. Otherwise, execution stops, and an error is displayed.

## Instructions

The number below represents the value in the R channel. The "next pixel" refers to the pixel that will be executed next.

### 0. Halt

Stops the execution of the program.

Parameters: N/A

### 1. Set variable

Store a given channel of the next pixel into a variable.

Parameters:
- G: The channel selection (1 for R, 2 for G, 3 for B).
- B: The variable index (0 to 255).

Throws:
- `0` if the parameter G is out of range.

### 2. Calculate

Performs a calculation on a variable, using a channel of the next pixel. The variable is mutated; the pixel is unchanged.

Parameters:
- Low 2 bits of G: The channel of the next pixel to use (1 for R, 2 for G, 3 for B).
- High 6 bits of G: The operator to perform (1 for plus, 2 for minus, 3 for multiply, 4 for divide).
- B: The variable index (0 to 255).

Throws:
- `0` if the parameter G is invalid.
- `1` if a divide-by-zero error occurred.

### 3. Function

Defines a function with the given index.

Parameters:
- G: The variable index for the parameter / output (0 to 255).
- B: The function index (0 to 255).

### 4. Try

Starts a try block that catches the next error thrown.

Parameters:
- G: Unused.
- B: The variable to store the thrown error code (0 to 255).

### 5. Branch

Turns right if the two given variables are the same.

Parameters:
- G: The first variable index (0 to 255).
- B: The second variable index (0 to 255).

### 6. Throw

Throws an error.

Parameters:
- G: The variable containing the error code to throw (0 to 255).
- B: Unused.

### 7. Input

Reads one character from the input stream.

Parameters:
- G: Unused.
- B: The variable index to store the character (0 to 255).

Throws:
- `2` if the input stream is exhausted.

### 8. Output

Writes one character to the output stream.

Parameters:
- G: Unused.
- B: The variable index to write (0 to 255).

Throws:
- `3` if the character is not an ASCII printable character (i.e. control character, non-ASCII, etc.).

### 9. Call

Calls a defined function.

Parameters:
- G: The variable index to pass as a parameter / receive output (0 to 255).
- B: The function index to call (0 to 255).

Throws:
- `4` if the function is not defined.

### 10-254. Invalid

Throws:
- `5`

### 255. NOP

Do nothing.

Parameters: N/A
