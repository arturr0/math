let derivativeLevel = 1;
const DEFAULT_SCALES = {
    sin: { xMin: -2 * Math.PI, xMax: 2 * Math.PI, yMin: -3, yMax: 3 },
    cos: { xMin: -2 * Math.PI, xMax: 2 * Math.PI, yMin: -3, yMax: 3 },
    tan: { xMin: -2 * Math.PI, xMax: 2 * Math.PI, yMin: -5, yMax: 5 },
    pow: { xMin: -5, xMax: 5, yMin: -10, yMax: 10 },
    exp: { xMin: -5, xMax: 5, yMin: -1, yMax: 10 },
    custom: { xMin: -5, xMax: 5, yMin: -10, yMax: 10 }
};

let amplitude, frequency, phase, constant, funcType, Ax3, Bx2, Cx1, Dx0, Ae, eBx;
let isPlaying = true;
let animationProgress = 0;
let canvas;
let hoverX = null, hoverY = null;
let coordDisplay, derivDisplay, integralDisplay;
let plotWidth, plotHeight;
let xMin = -2 * Math.PI;
let xMax = 2 * Math.PI;
let yMin = -3;
let yMax = 3;
let aspectRatioFactor;
let showDerivativePlot = false;
let isSelectingArea = false;
let selectionStart = null, selectionEnd = null;
let selectedArea = null;
let isIntegralMode = false;
let customEquation = '';
let customFunc = null;
let equationError = null;
const customEquationInput = document.getElementById('customEquation');
customEquationInput.value = customEquation;
// Setup function
function setup() {
    // Create canvas
    document.getElementById('funcType').value = 'sin';

    const plotContainer = document.getElementById('plot-container');
    plotWidth = plotContainer.clientWidth;
    plotHeight = plotContainer.clientHeight;

    canvas = createCanvas(plotWidth, plotHeight);
    canvas.parent('plot');
    frameRate(20);
    pixelDensity(1);
    //noLoop();
    // Initialize parameters
    amplitude = parseFloat(document.getElementById('amplitude').value);
    frequency = parseFloat(document.getElementById('frequency').value);
    phase = parseFloat(document.getElementById('phase').value);
    constant = parseFloat(document.getElementById('constant').value);
    Ax3 = parseFloat(document.getElementById('Ax3').value);
    Bx2 = parseFloat(document.getElementById('Bx2').value);
    Cx1 = parseFloat(document.getElementById('Cx').value);
    Dx0 = parseFloat(document.getElementById('Dx0').value);
    Ae = parseFloat(document.getElementById('Ae').value);
    eBx = parseFloat(document.getElementById('eBx').value);
    funcType = document.getElementById('funcType').value;
    derivativeLevel = parseInt(document.getElementById('derivativeLevel').value);

    document.getElementById('derivativeLevel').addEventListener('input', function () {
        derivativeLevel = parseInt(this.value);
        const level = ["n=0", "n=1", "n=2", "n=3", "n=4"]
        document.getElementById('derivativeLevelValue').textContent = level[derivativeLevel];
        if (funcType != "custom") autoscaleAxes();
        else autoscaleAxesCustom()
    });

    // Set up custom equation input
    const customEquationInput = document.getElementById('customEquation');
    customEquationInput.value = customEquation;
    equationError = document.getElementById('equationError');

    // Compile initial custom equation
    compileCustomEquation();

    // Event listeners for custom equation
    document.getElementById('customEquation').addEventListener('input', function () {
        customEquation = this.value;
        compileCustomEquation();
    });

    // Keypad event listener
    document.querySelector('.calculator-keypad').addEventListener('click', function (e) {
        if (e.target.tagName === 'BUTTON') {
            const value = e.target.dataset.value;

            if (value === '⌫') {
                // Backspace
                customEquationInput.value = customEquationInput.value.slice(0, -1);
            } else if (value === 'C') {
                // Clear
                customEquationInput.value = '';
            }
            else if (value === '=') {
                // Clear
                // Update and compile
                customEquation = customEquationInput.value;
                compileCustomEquation();

                // Trigger input event
                customEquationInput.dispatchEvent(new Event('input'));
                redraw();
            } else {
                // Append value
                customEquationInput.value += value;
            }


        }
    });

    // Get display elements
    coordDisplay = document.getElementById('coordDisplay');
    derivDisplay = document.getElementById('derivDisplay');
    integralDisplay = document.getElementById('integralDisplay');
    const calculator = document.getElementById('custom');

    // Set up event listeners
    document.getElementById('amplitude').addEventListener('input', updateParams);
    document.getElementById('frequency').addEventListener('input', updateParams);
    document.getElementById('phase').addEventListener('input', updateParams);
    document.getElementById('constant').addEventListener('input', updateParams);

    document.getElementById('Ax3').addEventListener('input', updateParams);
    document.getElementById('Bx2').addEventListener('input', updateParams);
    document.getElementById('Cx').addEventListener('input', updateParams);
    document.getElementById('Dx0').addEventListener('input', updateParams);

    document.getElementById('Ae').addEventListener('input', updateParams);
    document.getElementById('eBx').addEventListener('input', updateParams);

    document.getElementById('xMin').addEventListener('input', updateScale);
    document.getElementById('xMax').addEventListener('input', updateScale);
    document.getElementById('yMin').addEventListener('input', updateScale);
    document.getElementById('yMax').addEventListener('input', updateScale);
    document.getElementById('resetScaleBtn').addEventListener('click', resetToDefaultScale);

    document.getElementById('funcType').addEventListener('change', function (event) {
        const selectedValue = event.target.value;

        resetToDefaultScale();
        // Reset UI elements
        const trig = document.getElementById('trigonomethry');
        const pow = document.getElementById('pow');
        const exp = document.getElementById('exp');
        const custom = document.getElementById('custom');
        const toggleCalculator = document.getElementById('toggleCalculator');

        trig.classList.remove('active');
        pow.classList.remove('active');
        exp.classList.remove('active');
        toggleCalculator.classList.remove('active');
        custom.classList.remove('visible');

        if (["sin", "cos", "tan"].includes(selectedValue)) {
            trig.classList.add('active');
            // Reset to default trig parameters
            document.getElementById('amplitude').value = 1;
            document.getElementById('frequency').value = 1;
            document.getElementById('phase').value = 0;
            document.getElementById('constant').value = 0;
        } else if (selectedValue === "pow") {
            pow.classList.add('active');
            // Reset to default polynomial parameters
            document.getElementById('Ax3').value = 0;
            document.getElementById('Bx2').value = 0;
            document.getElementById('Cx').value = 1;
            document.getElementById('Dx0').value = 0;
        } else if (selectedValue === "exp") {

            exp.classList.add('active');
            // Reset to default exp parameters
            document.getElementById('Ae').value = 1;
            document.getElementById('eBx').value = 1;
        } else if (selectedValue === "custom") {
            //noLoop();
            //redraw();
            custom.classList.add('visible');
            // Only clear if coming from another function type
            if (funcType !== 'custom') {
                customEquation = '';
                customEquationInput.value = '';
                equationError.textContent = '';
            }
            compileCustomEquation();
        }

        funcType = selectedValue;
        updateParams(); // This will update all parameters from the UI
        resetToDefaultScale();

    });


    // Set up event listeners for buttons
    document.getElementById('playBtn').addEventListener('click', () => isPlaying = true);
    document.getElementById('stopBtn').addEventListener('click', () => isPlaying = false);
    document.getElementById('resetBtn').addEventListener('click', resetAnimation);
    document.getElementById('derivativeBtn').addEventListener('click', toggleDerivativePlot);
    document.getElementById('integralBtn').addEventListener('click', activateIntegralMode);
    document.getElementById('clearIntegralBtn').addEventListener('click', clearIntegral);

    // Canvas mouse events
    canvas.mouseMoved(handleMouseMove);
    canvas.mouseOut(() => { hoverX = null; hoverY = null; });
    canvas.mousePressed(startSelection);
    canvas.mouseReleased(endSelection);

    // Set initial display values
    updateValueDisplays();

    // Set up text properties
    textSize(12);
    textAlign(CENTER, CENTER);

    // Calculate aspect ratio factor
    aspectRatioFactor = calculateAspectRatioFactor();

    // Set initial scale
    resetToDefaultScale();
}
document.getElementById('closeBtn').addEventListener('click', () => {
    document.getElementById('custom').classList.remove('visible');
    document.getElementById('toggleCalculator').classList.add('active');
});
document.getElementById('toggleCalculator').addEventListener('click', () => {
    document.getElementById('custom').classList.add('visible');
    document.getElementById('toggleCalculator').classList.remove('active');

});
function resetAllParameters() {
    // Reset all sliders to default values
    document.getElementById('amplitude').value = 1;
    document.getElementById('frequency').value = 1;
    document.getElementById('phase').value = 0;
    document.getElementById('constant').value = 0;

    document.getElementById('Ax3').value = 0;
    document.getElementById('Bx2').value = 0;
    document.getElementById('Cx').value = 1;
    document.getElementById('Dx0').value = 0;

    document.getElementById('Ae').value = 1;
    document.getElementById('eBx').value = 1;

    // Update the internal variables
    updateParams();

    // Clear custom function specific state
    if (funcType === 'custom') {
        customEquation = '';
        customEquationInput.value = '';
        equationError.textContent = '';
        customFunc = null;
    }

    // Reset other states
    animationProgress = xMin;
    functionCache.clear();
    lastFuncString = '';
}
// Compile custom equation
function compileCustomEquation() {
    // Skip compilation if last character is an operator
    const lastChar = customEquation.slice(-1);
    if (['+', '-', '*', '/', '^'].includes(lastChar)) {
        equationError.textContent = "Complete the expression";
        equationError.style.color = "#ffcc80"; // Warning color
        return;
    }

    try {
        customFunc = math.compile(customEquation);
        analyzeCustomEquation();
        equationError.textContent = "";
        reinitializeAfterCustomUpdate();
        if (funcType != "custom") autoscaleAxes();
        else autoscaleAxesCustom()
    } catch (error) {
        equationError.textContent = error.toString();
        equationError.style.color = "#ff6b6b"; // Error color
    }
}

function updateScale() {
    xMin = parseFloat(document.getElementById('xMin').value);
    xMax = parseFloat(document.getElementById('xMax').value);
    yMin = parseFloat(document.getElementById('yMin').value);
    yMax = parseFloat(document.getElementById('yMax').value);

    // Clamp zero or negative ranges
    const MIN_RANGE = 1e-6;
    if (Math.abs(xMax - xMin) < MIN_RANGE) xMax = xMin + MIN_RANGE;
    if (Math.abs(yMax - yMin) < MIN_RANGE) yMax = yMin + MIN_RANGE;

    updateScaleControls();
    aspectRatioFactor = calculateAspectRatioFactor();
    renderingProgress = xMin;
}


function updateScaleControls() {
    // Update the slider positions and displayed values
    document.getElementById('xMin').value = xMin;
    document.getElementById('xMax').value = xMax;
    document.getElementById('yMin').value = yMin;
    document.getElementById('yMax').value = yMax;

    // Helper function to format numbers appropriately
    function formatValue(val) {
        return Math.abs(val) > 9999 ? val.toExponential(2) : val.toFixed(2);
    }

    document.getElementById('xMinValue').textContent = formatValue(xMin);
    document.getElementById('xMaxValue').textContent = formatValue(xMax);
    document.getElementById('yMinValue').textContent = formatValue(yMin);
    document.getElementById('yMaxValue').textContent = formatValue(yMax);
}
function reinitializeAfterCustomUpdate() {
    animationProgress = xMin; // Reset animation start
    updateParams();           // Pull in current sliders again
    if (funcType != "custom") autoscaleAxes();
    else autoscaleAxesCustom()        // Recalculate scale
    functionCache.clear();    // Prevent stale values
    lastFuncString = "";      // Force full function recalculation
}

function resetToDefaultScale() {
    customEquation = '';
    customEquationInput.value = '';
    if (funcType === 'custom') {
        // Analyze the custom equation first
        //analyzeCustomEquation();

        // Set default scale based on equation type
        if (customHasTrig) {
            xMin = -2 * Math.PI;
            xMax = 2 * Math.PI;
            yMin = -5;
            yMax = 5;
            // Set reasonable defaults for custom trig
            document.getElementById('amplitude').value = 1;
            document.getElementById('frequency').value = 1;
            document.getElementById('phase').value = 0;
            document.getElementById('constant').value = 0;
        } else if (customHasExp) {
            xMin = -3;
            xMax = 3;
            yMin = -1;
            yMax = 10;
            // Set reasonable defaults for custom exp
            document.getElementById('Ae').value = 1;
            document.getElementById('eBx').value = 1;
        } else if (customHasPoly) {
            xMin = -5;
            xMax = 5;
            yMin = -10;
            yMax = 10;
            // Set reasonable defaults for custom poly
            document.getElementById('Ax3').value = 0;
            document.getElementById('Bx2').value = 0;
            document.getElementById('Cx').value = 1;
            document.getElementById('Dx0').value = 0;
        } else {
            // Default for unknown functions
            xMin = -5;
            xMax = 5;
            yMin = -10;
            yMax = 10;
        }
    } else {
        // Use predefined scales for other function types
        const defaultScale = DEFAULT_SCALES[funcType] || DEFAULT_SCALES.sin;
        xMin = defaultScale.xMin;
        xMax = defaultScale.xMax;
        yMin = defaultScale.yMin;
        yMax = defaultScale.yMax;
    }

    updateParams(); // Ensure all parameters are updated
    updateScaleControls();
    aspectRatioFactor = calculateAspectRatioFactor();
    functionCache.clear(); // Clear any cached function values
}

// Modified parameter update (without autoscaling)
function updateParamsWithoutAutoscale() {
    amplitude = parseFloat(document.getElementById('amplitude').value);
    frequency = parseFloat(document.getElementById('frequency').value);
    phase = parseFloat(document.getElementById('phase').value);
    constant = parseFloat(document.getElementById('constant').value);

    Ax3 = parseFloat(document.getElementById('Ax3').value);
    Bx2 = parseFloat(document.getElementById('Bx2').value);
    Cx1 = parseFloat(document.getElementById('Cx').value);
    Dx0 = parseFloat(document.getElementById('Dx0').value);

    Ae = parseFloat(document.getElementById('Ae').value);
    eBx = parseFloat(document.getElementById('eBx').value);

    updateValueDisplays();
}

function calculateAspectRatioFactor() {
    return (height * (xMax - xMin)) / (width * (yMax - yMin));
}

// Toggle derivative plot
function toggleDerivativePlot() {
    showDerivativePlot = !showDerivativePlot;
    const btn = document.getElementById('derivativeBtn');
    if (showDerivativePlot) {
        btn.style.background = 'linear-gradient(to right, #FF416C, #FF4B2B)';
    } else {
        btn.style.background = 'linear-gradient(to right, #8A2BE2, #9370DB)';
    }
    // Autoscale when toggling derivative visibility
    if (funcType != "custom") autoscaleAxes();
    else autoscaleAxesCustom()
}

// Activate integral mode
function activateIntegralMode() {
    isIntegralMode = true;
    const btn = document.getElementById('integralBtn');
    btn.style.background = 'linear-gradient(to right, #ff6b6b, #ff8e8e)';
}

// Clear integral selection
function clearIntegral() {
    selectedArea = null;
    selectionStart = null;
    selectionEnd = null;
    isIntegralMode = false;
    integralDisplay.textContent = "0.0000";

    const btn = document.getElementById('integralBtn');
    btn.style.background = 'linear-gradient(to right, #ff416c, #ff4b2b)';
}

// Start area selection
function startSelection() {
    if (!isIntegralMode) return;

    const x = map(mouseX, 0, width, xMin, xMax);
    const y = map(mouseY, height, 0, yMin, yMax);

    selectionStart = { x, y, screenX: mouseX, screenY: mouseY };
    selectionEnd = null;
    isSelectingArea = true;
    selectedArea = null;
}

// End area selection
function endSelection() {
    if (!isIntegralMode || !isSelectingArea || !selectionEnd) return;

    isSelectingArea = false;

    // Ensure start and end are ordered
    const startX = Math.min(selectionStart.x, selectionEnd.x);
    const endX = Math.max(selectionStart.x, selectionEnd.x);

    selectedArea = {
        startX: startX,
        endX: endX,
        screenStartX: selectionStart.screenX,
        screenEndX: selectionEnd.screenX
    };

    // Calculate integral
    calculateIntegral();
}

// Calculate integral over selected area
function calculateIntegral() {
    if (!selectedArea) return;

    const { startX, endX } = selectedArea;
    const n = 1000; // Number of intervals
    const dx = (endX - startX) / n;
    let sum = 0;

    for (let i = 0; i < n; i++) {
        const x1 = startX + i * dx;
        const x2 = startX + (i + 1) * dx;
        const y1 = trigFunction(x1);
        const y2 = trigFunction(x2);

        if (isFinite(y1) && isFinite(y2)) {
            // Trapezoidal rule
            sum += (y1 + y2) * dx / 2;
        }
    }
    integralDisplay.textContent = sum.toFixed(4);
}

function getDerivativeAmplitude(level) {
    return Math.abs(amplitude) * Math.pow(frequency, level);
}


function autoscaleAxes() {
    const THRESHOLD = 1e6;
    let minY = Infinity;
    let maxY = -Infinity;
    let maxDerivativeMagnitude = 0;
    let effectiveFrequency = frequency;

    const period = 2 * Math.PI / Math.max(0.1, effectiveFrequency);
    const periodCount = Math.max(2, Math.min(8, 40 / effectiveFrequency));
    xMin = -periodCount * period;
    xMax = periodCount * period;


    let step = (xMax - xMin) / 1000;
    step = Math.min(step, 1 / (100 * Math.max(1, frequency)));

    for (let x = xMin; x <= xMax; x += step) {
        const y = trigFunction(x);
        if (isFinite(y) && Math.abs(y) < THRESHOLD) {
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }

        if (showDerivativePlot) {
            const dy = numericalDerivative(x, derivativeLevel);
            if (isFinite(dy)) {
                maxDerivativeMagnitude = Math.max(maxDerivativeMagnitude, Math.abs(dy));
            }
        }
    }

    if (!isFinite(minY) || !isFinite(maxY)) {
        minY = -5;
        maxY = 5;
    }

    const range = maxY - minY;
    const padding = Math.max(1, range * 0.2);
    yMin = minY - padding;
    yMax = maxY + padding;

    const dynamicAmplitude = Math.max(5, Math.abs(amplitude) * 1.5);
    yMin = -dynamicAmplitude;
    yMax = dynamicAmplitude;

    if (showDerivativePlot && maxDerivativeMagnitude > 0) {
        const derivativeRange = maxDerivativeMagnitude * 1.2;
        yMin = Math.min(yMin, -derivativeRange);
        yMax = Math.max(yMax, derivativeRange);
    }

    updateScaleControls();
    aspectRatioFactor = calculateAspectRatioFactor();
}

// Enhanced critical point detection
function findCriticalPoints() {
    const points = [];
    const step = (xMax - xMin) / 100;
    const derivatives = [];

    // First pass: find candidate points
    for (let x = xMin; x <= xMax; x += step) {
        try {
            const y = trigFunction(x);
            if (!isFinite(y)) continue;

            // Calculate derivative
            const deriv = numericalDerivative(x, 1);
            if (!isFinite(deriv)) continue;

            derivatives.push({ x, deriv });
        } catch (e) {
            // Ignore evaluation errors
        }
    }

    // Detect sign changes indicating critical points
    for (let i = 1; i < derivatives.length; i++) {
        const prev = derivatives[i - 1].deriv;
        const curr = derivatives[i].deriv;

        if (Math.sign(prev) !== Math.sign(curr) ||
            (Math.abs(prev) < 0.1 && Math.abs(curr) < 0.1)) {
            const x = (derivatives[i - 1].x + derivatives[i].x) / 2;
            points.push({ x, y: trigFunction(x) });
        }
    }

    return points;
}

function autoscaleAxesCustom() {
    const THRESHOLD = 1e12;  // Lowered threshold to ignore extreme spikes in autoscale
    const DEFAULT_X_MIN = -10;
    const DEFAULT_X_MAX = 10;
    const MIN_PERIODS_TO_SHOW = 3;

    analyzeCustomEquation();

    if (customTrigFreq && customTrigFreq > 0) {
        const period = (2 * Math.PI) / customTrigFreq;
        const totalRange = period * MIN_PERIODS_TO_SHOW;
        xMin = -totalRange / 2;
        xMax = totalRange / 2;
    } else {
        xMin = DEFAULT_X_MIN;
        xMax = DEFAULT_X_MAX;
    }

    let minY = Infinity, maxY = -Infinity;
    let minDeriv = Infinity, maxDeriv = -Infinity;

    const steps = 1500;
    const step = (xMax - xMin) / steps;

    for (let i = 0; i <= steps; i++) {
        const x = xMin + i * step;
        const y = trigFunction(x);

        if (isFinite(y) && Math.abs(y) < THRESHOLD && !isNearAsymptote(x, step)) {
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }

        const THRESHOLD_FUNC = 1e3;
        const THRESHOLDS = [
            1e3,      // function itself
            1e4,      // 1st derivative
            1e6,      // 2nd derivative
            1e8,      // 3rd derivative
            1e10      // 4th derivative
        ];

        // In autoscaleAxesCustom:
        if (showDerivativePlot) {
            const dy = numericalDerivative(x, derivativeLevel);
            const threshold = THRESHOLDS[derivativeLevel];
            if (isFinite(dy) && !isNearAsymptote(x, step)) {
                minDeriv = Math.min(minDeriv, dy);
                maxDeriv = Math.max(maxDeriv, dy);
            }

        }

    }

    if (!isFinite(minY) || !isFinite(maxY)) {
        minY = -5;
        maxY = 5;
    }

    let yMinFinal = minY;
    let yMaxFinal = maxY;

    if (showDerivativePlot && isFinite(minDeriv) && isFinite(maxDeriv)) {
        yMinFinal = Math.min(yMinFinal, minDeriv);
        yMaxFinal = Math.max(yMaxFinal, maxDeriv);
    }

    const range = yMaxFinal - yMinFinal;
    const padding = Math.max(1, range * 0.2);
    if (range === 0) {  // For constant functions
        yMin = minY - 1;
        yMax = maxY + 1;
    } else {
        yMin = yMinFinal - padding;
        yMax = yMaxFinal + padding;
    }
    // yMin = yMinFinal - padding;
    // yMax = yMaxFinal + padding;

    updateScaleControls();
    aspectRatioFactor = calculateAspectRatioFactor();
}


// ... (all previous code remains the same until trigFunction) ...
function analyzeCustomEquation() {
    const lower = customEquation.toLowerCase();
    customHasTrig = /(sin|cos|tan)\(/.test(lower);
    customHasExp = /exp/.test(lower) || /\^/.test(lower);
    customHasPoly = /x\s*\^\s*\d/.test(lower) ||
        (/x/.test(lower) && !customHasTrig && !customHasExp);

    // Coefficient extraction
    const coeffMatches = [...customEquation.matchAll(/([-+]?\d*\.?\d+)\s*\*/g)];
    customCoeffs = coeffMatches.map(m => parseFloat(m[1]));
    if (customCoeffs.length === 0) customCoeffs = [1];

    customMaxCoeff = Math.max(...customCoeffs.map(Math.abs));
    if (!isFinite(customMaxCoeff)) customMaxCoeff = 1;

    // Trig frequency extraction
    const trigFreqMatches = [...customEquation.matchAll(/(sin|cos|tan)\(\s*([\d.+\-*/\s]*)x/g)];
    customTrigFreq = trigFreqMatches.reduce((max, m) => {
        try {
            const val = math.evaluate(m[2] || "1");
            return Math.max(max, Math.abs(val));
        } catch {
            return max;
        }
    }, 1);


    // Exp growth rate extraction
    const expMatches = [...customEquation.matchAll(/exp\(\s*([\d.]+)?\s*\*\s*x/g)];
    customExpRate = expMatches.length > 0
        ? Math.max(...expMatches.map(m => parseFloat(m[1] || "1")))
        : 1;
}

const functionCache = new Map();
let lastFuncString = '';
//let redrawTimeout;
let isProcessing = false;
//let renderingProgress = xMin;
const RENDERING_CHUNK = 150; // Adjust based on performance

function trigFunction(x) {
    // Clear cache if function changed
    const currentFuncString = funcType === 'custom' ? customEquation :
        `${funcType}-${amplitude}-${frequency}-${phase}-${constant}`;
    if (currentFuncString !== lastFuncString) {
        functionCache.clear();
        lastFuncString = currentFuncString;
    }

    // Check cache
    const cacheKey = x.toFixed(10);
    if (functionCache.has(cacheKey)) {
        return functionCache.get(cacheKey);
    }

    // Calculate value
    let y;
    if (funcType === 'custom' && customFunc) {
        try {
            // Add bounds checking for very large/small values
            const arg = frequency * (x - phase);
            //if (Math.abs(arg) > 1e6) return NaN; // Prevent overflow

            y = amplitude * customFunc.evaluate({ x: x }) + constant;
            //if (!isFinite(y)) y = NaN;
        } catch {
            y = NaN;
        }
    } else {
        // Built-in functions
        const arg = frequency * (x - phase);
        switch (funcType) {
            case 'sin':
                return amplitude * Math.sin(arg) + constant;
            case 'cos':
                return amplitude * Math.cos(arg) + constant;
            case 'tan':
                const tanArg = arg % Math.PI;
                if (Math.abs(tanArg - Math.PI / 2) < 0.1 || Math.abs(tanArg + Math.PI / 2) < 0.1) {
                    return NaN;
                }
                return amplitude * Math.tan(arg) + constant;
            case 'pow':
                return Ax3 * Math.pow(x, 3) + Bx2 * Math.pow(x, 2) + Cx1 * x + Dx0;
            case 'exp':
                return Ae * Math.exp(eBx * x);
            default:
                return amplitude * Math.sin(arg) + constant;
        }
    }

    // Cache result
    functionCache.set(cacheKey, y);
    return y;
}


// ... (all previous code remains the same) ...
// Window resize handler
function windowResized() {
    const plotContainer = document.getElementById('plot-container');
    plotWidth = plotContainer.clientWidth;
    plotHeight = plotContainer.clientHeight;
    resizeCanvas(plotWidth, plotHeight);
    aspectRatioFactor = calculateAspectRatioFactor();
}

// Update parameters from UI
function updateParams() {
    amplitude = parseFloat(document.getElementById('amplitude').value);
    frequency = parseFloat(document.getElementById('frequency').value);
    phase = parseFloat(document.getElementById('phase').value);
    constant = parseFloat(document.getElementById('constant').value);

    Ax3 = parseFloat(document.getElementById('Ax3').value);
    Bx2 = parseFloat(document.getElementById('Bx2').value);
    Cx1 = parseFloat(document.getElementById('Cx').value);
    Dx0 = parseFloat(document.getElementById('Dx0').value);

    Ae = parseFloat(document.getElementById('Ae').value);
    eBx = parseFloat(document.getElementById('eBx').value);

    funcType = document.getElementById('funcType').value;

    updateParamsWithoutAutoscale();
    if (funcType != "custom") autoscaleAxes();
    else autoscaleAxesCustom()
}

// Update value displays
function updateValueDisplays() {
    document.getElementById('amplitudeValue').textContent = amplitude.toFixed(1);
    document.getElementById('frequencyValue').textContent = frequency.toFixed(1);
    document.getElementById('phaseValue').textContent = phase.toFixed(2);
    document.getElementById('constantValue').textContent = constant.toFixed(1);

    document.getElementById('Avalue').textContent = Ax3.toFixed(1);
    document.getElementById('Bvalue').textContent = Bx2.toFixed(1);
    document.getElementById('Cvalue').textContent = Cx1.toFixed(2);
    document.getElementById('Dvalue').textContent = Dx0.toFixed(1);

    document.getElementById('AeValue').textContent = Ae.toFixed(1);
    document.getElementById('BeValue').textContent = eBx.toFixed(1);
}

// Reset animation
function resetAnimation() {
    animationProgress = 0;
    isPlaying = true;
}

// Handle mouse movement
function handleMouseMove() {
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        hoverX = map(mouseX, 0, width, xMin, xMax);
        hoverY = map(mouseY, height, 0, yMin, yMax);

        // Update selection during drag
        if (isSelectingArea) {
            const x = map(mouseX, 0, width, xMin, xMax);
            const y = map(mouseY, height, 0, yMin, yMax);
            selectionEnd = { x, y, screenX: mouseX, screenY: mouseY };
        }
    }
}

// Map value from one range to another
function map(value, start1, stop1, start2, stop2) {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}

// Modify the derivative function to support multiple levels
function derivative(x, level = 1) {
    if (funcType !== 'pow' || level === 0) {
        return trigFunction(x);
    }

    // Symbolic differentiation for polynomials
    if (level === 1) {
        return 3 * Ax3 * x * x + 2 * Bx2 * x + Cx1;
    }
    if (level === 2) {
        return 6 * Ax3 * x + 2 * Bx2;
    }
    if (level === 3) {
        return 6 * Ax3;
    }
    return 0; // Higher derivatives are zero for cubic polynomials
}

function drawDerivativePlot() {
    noFill();
    stroke(180, 100, 220);
    strokeWeight(3);
    let lastValid = false;
    let lastYValue = null;
    for (let x = xMin; x <= xMax; x += 0.05) {
        const y = getDerivativeAt(x, derivativeLevel);
        const isValid = !isNaN(y) && isFinite(y) && Math.abs(y) < 1e6;
        if (isValid) {
            if (lastValid) {
                // Break line on large jumps to avoid vertical/horizontal lines
                if (lastYValue !== null && Math.abs(y - lastYValue) > (yMax - yMin) * 0.5) {
                    endShape();
                    beginShape();
                }
            } else {
                beginShape();
            }
            vertex(toScreenX(x), toScreenY(y));
            lastValid = true;
            lastYValue = y;
        } else if (lastValid) {
            endShape();
            lastValid = false;
            lastYValue = null;
        } else {
            lastYValue = null;
        }
    }
    if (lastValid) {
        endShape();
    }
    // Add label with level information
    fill(180, 100, 220);
    noStroke();
    textSize(14);
    textAlign(RIGHT, TOP);
    const levels = ["0th", "1st", "2nd", "3rd", "4th"];
    text(`${levels[derivativeLevel]} Derivative`, width - 20, 20);
}
function getDerivativeAt(x, level = derivativeLevel) {
    const baseFrequency = (funcType === "custom" && customHasTrig)
        ? (customTrigFreq || 1)
        : (["sin", "cos", "tan"].includes(funcType) ? frequency : 1);
    // Prevent derivative near asymptotes
    const hCheck = 1 / (1000 * Math.max(1, baseFrequency));
    if (isNearAsymptote(x, hCheck)) return NaN;
    return numericalDerivative(x, level);
}

function isNearAsymptote(x, h) {
    const points = [x - h, x, x + h];
    for (const xi of points) {
        const val = trigFunction(xi);
        if (!isFinite(val) || Math.abs(val) > 1e5) return true;
    }
    return false;
}


function numericalDerivative(x, level = 1) {
    if (level === 0) return trigFunction(x);
    // Adapt step size h to frequency and derivative order
    let baseFrequency = 1;
    if (funcType === "custom" && customHasTrig) {
        baseFrequency = customTrigFreq || 1;
    } else if (["sin", "cos", "tan"].includes(funcType)) {
        baseFrequency = frequency;
    }
    let baseH = 1 / (10000 * baseFrequency);  // Use a larger constant in denominator
    let h = baseH * Math.pow(1.2, level - 1);
    if (h < 1e-10) h = 1e-10;  // Smaller minimal step

    const f = trigFunction;
    try {
        if (level === 1) {
            const y1 = f(x - h);
            const y2 = f(x + h);
            if (!isFinite(y1) || !isFinite(y2)) return NaN;
            const result = (y2 - y1) / (2 * h);
            return isFinite(result) ? result : NaN;
        }
        if (level === 2) {
            const y0 = f(x);
            const y1 = f(x - h);
            const y2 = f(x + h);
            if (!isFinite(y0) || !isFinite(y1) || !isFinite(y2)) return NaN;
            const result = (y1 - 2 * y0 + y2) / (h * h);
            if (!isFinite(result) || Math.abs(result) > 1e5) return NaN;
            return result;
        }
        if (level === 3 || level === 4) {
            // Use 7-point stencil for 3rd and 4th derivative
            const offsets = [-3, -2, -1, 0, 1, 2, 3].map(i => f(x + i * h));
            if (offsets.some(v => !isFinite(v))) return NaN;
            let result;
            if (level === 3) {
                result = (-offsets[0] + 8 * offsets[1] - 13 * offsets[2] + 13 * offsets[4] - 8 * offsets[5] + offsets[6]) / (8 * Math.pow(h, 3));
            } else {
                result = (-offsets[0] + 12 * offsets[1] - 39 * offsets[2] + 56 * offsets[3] - 39 * offsets[4] + 12 * offsets[5] - offsets[6]) / (6 * Math.pow(h, 4));
            }
            return isFinite(result) ? result : NaN;
        }
        return 0;
    } catch {
        return NaN;
    }
}


// Convert plot coordinates to screen coordinates
function toScreenX(x) {
    return map(x, xMin, xMax, 0, width);
}

function toScreenY(y) {
    return map(y, yMin, yMax, height, 0);
}

function drawGrid() {
    // Grid style
    stroke(80, 120, 150, 100);
    strokeWeight(1);

    // Calculate optimal grid spacing
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;

    // Calculate nice increments with power-of-10 scaling for extreme values
    const xIncrement = calculateNiceIncrement(xRange, width);
    const yIncrement = calculateNiceIncrement(yRange, height);

    // Determine if we need scientific notation
    const useScientificX = Math.abs(xMax) > 1e4 || Math.abs(xMin) > 1e4 ||
        (Math.abs(xMax) < 1e-3 && Math.abs(xMax) > 0) ||
        (Math.abs(xMin) < 1e-3 && Math.abs(xMin) > 0);
    const useScientificY = Math.abs(yMax) > 1e4 || Math.abs(yMin) > 1e4 ||
        (Math.abs(yMax) < 1e-3 && Math.abs(yMax) > 0) ||
        (Math.abs(yMin) < 1e-3 && Math.abs(yMin) > 0);

    // Calculate decimal precision with special handling for very small/large numbers
    const xDecimals = useScientificX ? 1 : xIncrement < 0.1 ? 2 : xIncrement < 1 ? 1 : 0;
    const yDecimals = useScientificY ? 1 : yIncrement < 0.1 ? 2 : yIncrement < 1 ? 1 : 0;

    // Calculate starting points aligned to nice intervals
    const xStart = Math.ceil(xMin / xIncrement) * xIncrement;
    const yStart = Math.ceil(yMin / yIncrement) * yIncrement;

    // Draw vertical grid lines
    for (let x = xStart; x <= xMax; x += xIncrement) {
        // Skip values too close to zero to avoid overlapping with axis
        if (Math.abs(x) < xIncrement / 10) continue;

        const screenX = toScreenX(x);
        line(screenX, 0, screenX, height);

        // Format label based on magnitude
        let label;
        if (useScientificX) {
            label = x.toExponential(xDecimals);
            // Remove unnecessary + and leading 0 in exponent
            label = label.replace(/e\+?(-?)0*/, 'e$1');
        } else {
            label = x.toFixed(xDecimals);
        }

        // Label
        noStroke();
        fill(180, 220, 255, 200);
        textSize(12);
        textAlign(CENTER, TOP);
        text(label, screenX, height - 20);
    }

    // Draw horizontal grid lines
    for (let y = yStart; y <= yMax; y += yIncrement) {
        // Skip values too close to zero
        if (Math.abs(y) < yIncrement / 10) continue;

        const screenY = toScreenY(y);
        line(0, screenY, width, screenY);

        // Format label based on magnitude
        let label;
        if (useScientificY) {
            label = y.toExponential(yDecimals);
            label = label.replace(/e\+?(-?)0*/, 'e$1');
        } else {
            label = y.toFixed(yDecimals);
        }

        // Label
        noStroke();
        fill(180, 220, 255, 200);
        textSize(12);
        textAlign(RIGHT, CENTER);
        text(label, 40, screenY);
    }

    // Draw axes
    stroke(200, 230, 255, 200);
    strokeWeight(2);

    // X-axis
    if (yMin <= 0 && yMax >= 0) {
        const xAxisY = toScreenY(0);
        line(0, xAxisY, width, xAxisY);

        // Label
        noStroke();
        fill(180, 220, 255, 200);
        textSize(12);
        textAlign(CENTER, TOP);
        text("0", toScreenX(0), xAxisY + 5);
    }

    // Y-axis
    if (xMin <= 0 && xMax >= 0) {
        const yAxisX = toScreenX(0);
        line(yAxisX, 0, yAxisX, height);

        // Label
        noStroke();
        fill(180, 220, 255, 200);
        textSize(12);
        textAlign(RIGHT, CENTER);
        text("0", yAxisX - 5, toScreenY(0));
    }

    // Draw scale labels with scientific notation if needed
    fill(180, 220, 255, 200);
    textSize(14);
    textAlign(RIGHT, TOP);
    text("Y" + (useScientificY ? " (×10ⁿ)" : ""), 30, 10);
    textAlign(LEFT, BOTTOM);
    text("X" + (useScientificX ? " (×10ⁿ)" : ""), width - 30, height - 10);
}

// Helper function to calculate nice grid increments
function calculateNiceIncrement(range, pixels) {
    // Estimate desired number of grid lines (5-10 across the screen)
    const targetLines = Math.max(5, Math.min(10, pixels / 80));
    let roughIncrement = range / targetLines;

    // Round to nearest nice increment (1, 2, 5, 10 patterns)
    const power = Math.pow(10, Math.floor(Math.log10(roughIncrement)));
    const fraction = roughIncrement / power;

    let niceIncrement = power;
    if (fraction <= 1.5) {
        niceIncrement = power;
    } else if (fraction <= 3) {
        niceIncrement = 2 * power;
    } else if (fraction <= 7) {
        niceIncrement = 5 * power;
    } else {
        niceIncrement = 10 * power;
    }

    // For very large or small numbers, adjust to keep reasonable precision
    if (niceIncrement > 1e6 || (niceIncrement < 1e-6 && niceIncrement > 0)) {
        niceIncrement = Math.round(niceIncrement * 1e6) / 1e6;
    }

    return niceIncrement;
}

// Helper function to calculate nice grid increments
function calculateNiceIncrement(range, pixels) {
    // Target about 8-12 grid lines
    const targetLines = Math.max(3, Math.min(15, pixels / 50));
    const rawIncrement = range / targetLines;

    // Calculate magnitude (power of 10)
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawIncrement)));
    let normalized = rawIncrement / magnitude;

    // Round to nearest nice value (1, 2, 5, or 10)
    if (normalized < 1.5) {
        normalized = 1;
    } else if (normalized < 3) {
        normalized = 2;
    } else if (normalized < 7) {
        normalized = 5;
    } else {
        normalized = 10;
    }

    return normalized * magnitude;
}
//let renderingProgress = 0;
//const RENDERING_CHUNK = 1000; // Number of points to render per frame
// Draw the function with proper handling of out-of-bounds points
let renderingProgress = xMin;  // Initialize outside drawFunction

function drawFunction() {
    noFill();
    stroke(50, 220, 150);
    strokeWeight(3);

    const visibleRange = xMax - xMin;
    const worldStep = visibleRange / (width * 10); // 10 samples per pixel

    const asymptoteSet = new Set();

    let lastX = null;
    let lastY = null;
    let lastValid = false;

    beginShape();
    for (let x = xMin; x <= xMax; x += worldStep) {
        const y = trigFunction(x);
        const isValid = isFinite(y) && !isNearAsymptote(x, worldStep);

        if (isValid) {
            const screenX = toScreenX(x);
            const screenY = toScreenY(y);

            if (lastValid) {
                const screenDeltaY = Math.abs(screenY - toScreenY(lastY));
                const yDelta = Math.abs(y - lastY);

                // Break line on large vertical jump (avoid vertical lines)
                if (screenDeltaY > height * 0.2 || yDelta > 1e3) {
                    endShape();

                    const asymptoteX = refineAsymptote(lastX, x, 20);
                    addUniqueAsymptote(asymptoteX, asymptoteSet);

                    stroke(50, 220, 150);
                    strokeWeight(3);
                    beginShape();
                }
            }

            vertex(screenX, screenY);
            lastValid = true;
            lastX = x;
            lastY = y;
        } else if (lastValid) {
            endShape();

            const asymptoteX = refineAsymptote(lastX, x, 20);
            addUniqueAsymptote(asymptoteX, asymptoteSet);

            stroke(50, 220, 150);
            strokeWeight(3);
            beginShape();
            lastValid = false;
        } else {
            lastValid = false;
        }

        lastX = x;
        lastY = y;
    }
    endShape();
}
function refineAsymptote(x1, x2, maxDepth) {
    for (let i = 0; i < maxDepth; i++) {
        const mid = (x1 + x2) / 2;
        const y = trigFunction(mid);

        if (!isFinite(y)) x2 = mid;
        else x1 = mid;
    }
    return (x1 + x2) / 2;
}
function addUniqueAsymptote(x, set, precision = 6) {
    const key = x.toFixed(precision); // normalize for Set
    if (!set.has(key)) {
        set.add(key);
        //drawAsymptote(x);
    }
}
function drawAsymptote(x) {
    stroke(200, 50, 50, 150);
    strokeWeight(1);
    const sx = toScreenX(x);
    line(sx, 0, sx, height);
}

// --- PATCHED SECTIONS: drawTangentLine & drawAnimation ---

// Updated drawTangentLine with adaptive delta and slope validation
function drawTangentLine(x, y, color) {
    const freq = funcType === "custom" ? customTrigFreq || 1 : frequency;
    const delta = 1 / (100 * Math.max(1, freq));

    const xPrev = x - delta;
    const xNext = x + delta;

    const yPrev = trigFunction(xPrev);
    const yNext = trigFunction(xNext);

    if (isNaN(yPrev) || isNaN(yNext) ||
        yPrev < yMin || yPrev > yMax ||
        yNext < yMin || yNext > yMax) {
        return;
    }

    const screenX = toScreenX(x);
    const screenY = toScreenY(y);
    const screenXPrev = toScreenX(xPrev);
    const screenYPrev = toScreenY(yPrev);
    const screenXNext = toScreenX(xNext);
    const screenYNext = toScreenY(yNext);

    const dx = screenXNext - screenXPrev;
    const dy = screenYNext - screenYPrev;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0 || Math.abs(dy / dx) > 1e4) return; // skip if nearly vertical or invalid

    const dirX = dx / length;
    const dirY = dy / length;
    const extend = 50;

    const startX = screenX - dirX * extend;
    const startY = screenY - dirY * extend;
    const endX = screenX + dirX * extend;
    const endY = screenY + dirY * extend;

    stroke(color);
    strokeWeight(2);
    line(startX, startY, endX, endY);

    fill(color);
    noStroke();
    triangle(
        endX, endY,
        endX - dirX * 8 - dirY * 3, endY - dirY * 8 + dirX * 3,
        endX - dirX * 8 + dirY * 3, endY - dirY * 8 - dirX * 3
    );

    return { screenX, screenY };
}

// Updated drawAnimation with clamped range and adaptive step
function drawAnimation() {
    if (!isPlaying) return;

    const freq = funcType === "custom" ? customTrigFreq || 1 : frequency;
    const delta = 1 / (50 * Math.max(1, freq));

    if (animationProgress < xMin || animationProgress > xMax) {
        animationProgress = xMin;
    } else {
        animationProgress += delta;
    }

    const x = animationProgress;
    const y = trigFunction(x);
    if (isNaN(y)) return;

    const point = drawTangentLine(x, y, color(80, 180, 255));
    if (!point) return;

    fill(255, 80, 80);
    noStroke();
    ellipse(point.screenX, point.screenY, 12, 12);
}


// Draw hover effect
function drawHoverEffect() {
    if (hoverX === null || hoverY === null) return;

    const y = trigFunction(hoverX);
    if (isNaN(y)) return;

    // Draw tangent line using nearest points method
    const point = drawTangentLine(hoverX, y, color(255, 150, 50, 200));
    if (!point) return;

    // Draw point
    fill(255, 215, 0);
    noStroke();
    ellipse(point.screenX, point.screenY, 10, 10);

    // Draw coordinate lines
    stroke(255, 215, 0, 150);
    strokeWeight(1);

    // Vertical line to x-axis
    if (yMin <= 0 && yMax >= 0) {
        line(point.screenX, point.screenY, point.screenX, toScreenY(0));
    }

    // Horizontal line to y-axis
    if (xMin <= 0 && xMax >= 0) {
        line(point.screenX, point.screenY, toScreenX(0), point.screenY);
    }

    // Update info panel
    coordDisplay.textContent = `x: ${hoverX.toFixed(2)}, y: ${y.toFixed(2)}`;
    derivDisplay.textContent = numericalDerivative(hoverX, 1).toFixed(2);
}

// Draw area selection
function drawAreaSelection() {
    if (isSelectingArea && selectionStart && selectionEnd) {
        // Draw selection rectangle
        noFill();
        stroke(255, 215, 0, 200);
        strokeWeight(2);
        rectMode(CORNERS);
        rect(selectionStart.screenX, selectionStart.screenY,
            selectionEnd.screenX, selectionEnd.screenY);
    }

    if (selectedArea) {
        // Draw filled area under the curve
        fill(255, 165, 0, 80);
        noStroke();

        beginShape();
        vertex(toScreenX(selectedArea.startX), toScreenY(0));

        for (let x = selectedArea.startX; x <= selectedArea.endX; x += 0.05) {
            const y = trigFunction(x);
            if (!isNaN(y) && y >= yMin && y <= yMax) {
                vertex(toScreenX(x), toScreenY(y));
            }
        }

        vertex(toScreenX(selectedArea.endX), toScreenY(0));
        endShape(CLOSE);

        // Draw vertical lines at boundaries
        stroke(255, 165, 0, 200);
        strokeWeight(2);
        line(toScreenX(selectedArea.startX), toScreenY(yMin),
            toScreenX(selectedArea.startX), toScreenY(yMax));
        line(toScreenX(selectedArea.endX), toScreenY(yMin),
            toScreenX(selectedArea.endX), toScreenY(yMax));
    }
}
let redrawTimeout;
function throttleRedraw() {
    clearTimeout(redrawTimeout);
    redrawTimeout = setTimeout(() => {
        if (funcType === 'custom') redraw();
    }, 200); // Only redraw 100ms after last slider change
}
document.getElementById("derivativeLevel").addEventListener('input', () => { if (funcType == 'custom') redraw() });
document.getElementById("xMin").addEventListener('input', () => {

    if (funcType == 'custom') {
        functionCache.clear();
        updateScale();
        throttleRedraw();
    }
});
document.getElementById("xMax").addEventListener('input', () => {

    if (funcType == 'custom') {
        functionCache.clear();
        updateScale();
        throttleRedraw();
    }
});
document.getElementById("yMin").addEventListener('input', () => {

    if (funcType == 'custom') {
        functionCache.clear();
        updateScale();
        throttleRedraw();
    }
});
document.getElementById("yMax").addEventListener('input', () => {

    if (funcType == 'custom') {
        functionCache.clear();
        updateScale();
        throttleRedraw();
    }
});
// document.getElementById("xMax").addEventListener('input', () => { if (funcType == 'custom') redraw() });
// document.getElementById("yMin").addEventListener('input', () => { if (funcType == 'custom') redraw() });
// document.getElementById("yMax").addEventListener('input', () => { if (funcType == 'custom') redraw() });
// Main draw function
function draw() {
    console.log("draw");
    clear();
    background(15, 25, 35, 220);

    // Draw grid
    drawGrid();
    // if (funcType == "custom") noLoop();
    // else loop();
    // Draw function
    drawFunction();

    // Draw derivative plot if enabled
    // In the draw function where derivatives are plotted:
    if (showDerivativePlot) {
        noFill();
        stroke(180, 100, 220);
        strokeWeight(3);

        // Use more points for higher derivatives
        let step = (xMax - xMin) / (width * (derivativeLevel >= 3 ? 4 : 2));

        beginShape();
        for (let x = xMin; x <= xMax; x += step) {
            if (isNearAsymptote(x, step)) {
                endShape();
                continue;
            }

            const y = numericalDerivative(x, derivativeLevel);
            if (!isNaN(y) && isFinite(y)) {
                vertex(toScreenX(x), toScreenY(y));
            } else {
                endShape();
                beginShape();
            }
        }

        endShape();

        // Label
        fill(180, 100, 220);
        noStroke();
        textSize(14);
        textAlign(RIGHT, TOP);
        const levels = ["0th", "1st", "2nd", "3rd", "4th"];
        text(`${levels[derivativeLevel]} Derivative`, width - 20, 20);
    }

    // Draw area selection
    if (isIntegralMode) {
        drawAreaSelection();
    }

    // Draw animation
    drawAnimation();

    // Draw hover effect
    drawHoverEffect();
}

// Initialize the sketch
new p5();