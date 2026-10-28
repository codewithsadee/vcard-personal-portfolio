## Problem
Build a complete toolchain for the VC370, a simulated 13-opcode accumulator architecture. The system needed to translate symbolic assembly into 6-digit machine words, resolve labels and forward references, and execute the result across a 10,000-word memory space.

## Approach
- Implemented a two-pass assembler in C++17, building a symbol table on the first pass and resolving forward references on the second.
- Added the ORG, DC, DS, and END directives for program origin, constants, storage reservation, and program boundaries.
- Split the toolchain into seven components so instruction parsing, symbol handling, translation, emulation, and error reporting remained independently maintainable.
- Added assemble-time and runtime validation for illegal opcodes, undefined and multiply-defined labels, reserved-word collisions, memory-bound violations, and division by zero.

## Results
- Translated symbolic programs into machine code and executed them in the emulator.
- Produced clear diagnostics for invalid source programs and runtime failures.
- Kept the architecture modular enough to extend instructions and debug each stage of the toolchain independently.
