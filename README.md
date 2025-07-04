# Function Plotter with Derivatives and Integrals

An interactive function plotter that visualizes mathematical functions, their derivatives, and integrals with real-time controls.

![Chat App Preview](https://cdn.glitch.global/79283f6f-ef1e-4285-822b-eaefe68c462e/m.png?v=1751414877731)  

## Features

- Plot various function types: trigonometric, polynomial, exponential, and custom
- Real-time visualization of derivatives (up to 4th order)
- Integral calculation with area selection
- Interactive controls for function parameters
- Custom equation input with syntax checking
- Responsive design that adapts to screen size

## Supported Functions

- **Trigonometric**: sin, cos, tan with adjustable parameters
- **Polynomial**: Cubic functions (Ax³ + Bx² + Cx + D)
- **Exponential**: Ae^(Bx) functions
- **Custom**: User-defined equations using math.js syntax

## Controls

| Control | Description |
|---------|-------------|
| Function Type | Select between trigonometric, polynomial, exponential, or custom functions |
| Parameters | Adjust function parameters with sliders (amplitude, frequency, etc.) |
| Derivative | Toggle derivative plot and select derivative level (0th to 4th) |
| Integral | Activate integral mode and select area to calculate definite integral |
| Scale | Adjust plot scale manually or reset to default |

## Custom Equation Syntax

The custom function input supports mathematical expressions using:

- Basic operators: `+`, `-`, `*`, `/`, `^`
- Mathematical functions: `sin(x)`, `cos(x)`, `tan(x)`, `exp(x)`, `log(x)`, etc.
- Constants: `pi`, `e`
- Variables: `x` (independent variable)

Example: `2*sin(3*x) + x^2 - 4`

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/function-plotter.git
