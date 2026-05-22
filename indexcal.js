// ============================================================
//  calc-script.js — CALCpro
// ============================================================

(function () {
  "use strict";

  // ── DOM ────────────────────────────────────────────────────
  var mainDisplay = document.getElementById("mainDisplay");
  var expression  = document.getElementById("expression");
  var btnClear    = document.getElementById("btnClear");
  var allBtns     = document.querySelectorAll(".btn");

  // ── State ──────────────────────────────────────────────────
  var currentVal    = "0";    // value shown on main display
  var prevVal       = "";     // stored previous value
  var operator      = null;   // current operator: + − × ÷
  var waitingForOp  = false;  // true right after operator was pressed
  var justEqualled  = false;  // true right after = was pressed

  // ── Render ─────────────────────────────────────────────────
  function updateDisplay(val) {
    // Shorten display if number is too long
    var formatted = formatNumber(val);
    mainDisplay.textContent = formatted;
    mainDisplay.classList.toggle("error", val === "Error");
  }

  function formatNumber(val) {
    if (val === "Error" || val === "Infinity" || val === "-Infinity") return "Error";

    // Already contains a decimal point — don't reformat mid-typing
    var parts = val.split(".");
    var intPart = parts[0];
    var decPart = parts.length > 1 ? "." + parts[1] : "";

    // Add thousand separators to integer part (for display only)
    var intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    var result = intFormatted + decPart;

    // Truncate if too long for display
    if (result.length > 14) {
      var num = parseFloat(val);
      result = num.toPrecision(10).replace(/\.?0+$/, "");
    }
    return result;
  }

  function setExpression(str) {
    expression.textContent = str || "\u00a0";
  }

  function flashDisplay() {
    mainDisplay.classList.remove("pop");
    void mainDisplay.offsetWidth;
    mainDisplay.classList.add("pop");
    setTimeout(function () { mainDisplay.classList.remove("pop"); }, 120);
  }

  // ── Highlight active operator button ───────────────────────
  function highlightOp(op) {
    allBtns.forEach(function (b) {
      if (b.dataset.action === "operator") b.classList.remove("active-op");
    });
    if (op) {
      allBtns.forEach(function (b) {
        if (b.dataset.action === "operator" && b.dataset.value === op) {
          b.classList.add("active-op");
        }
      });
    }
  }

  // ── Update AC / C label ────────────────────────────────────
  function updateClearBtn() {
    btnClear.textContent = (currentVal !== "0" || prevVal !== "") ? "C" : "AC";
  }

  // ── Actions ────────────────────────────────────────────────
  function inputNumber(digit) {
    if (justEqualled) {
      currentVal  = digit;
      prevVal     = "";
      operator    = null;
      justEqualled = false;
      setExpression("");
    } else if (waitingForOp) {
      currentVal   = digit;
      waitingForOp = false;
    } else {
      if (currentVal === "0" && digit !== ".") {
        currentVal = digit;
      } else {
        // Max 15 digits
        var plain = currentVal.replace("-", "");
        if (plain.length >= 15) return;
        currentVal = currentVal + digit;
      }
    }
    updateDisplay(currentVal);
    updateClearBtn();
  }

  function inputDecimal() {
    if (justEqualled) {
      currentVal   = "0.";
      justEqualled = false;
      setExpression("");
    } else if (waitingForOp) {
      currentVal   = "0.";
      waitingForOp = false;
    } else if (currentVal.indexOf(".") === -1) {
      currentVal += ".";
    }
    updateDisplay(currentVal);
  }

  function inputOperator(op) {
    justEqualled = false;

    // Chain operations: if there's already a pending operation,
    // calculate it first before setting the new operator
    if (prevVal !== "" && !waitingForOp) {
      calculate(false);
    }

    prevVal      = currentVal;
    operator     = op;
    waitingForOp = true;

    setExpression(formatNumber(prevVal) + " " + op);
    highlightOp(op);
    updateClearBtn();
  }

  function calculate(finalEq) {
    if (operator === null || prevVal === "") return;

    var a = parseFloat(prevVal);
    var b = parseFloat(currentVal);
    var result;

    if (finalEq) {
      setExpression(formatNumber(prevVal) + " " + operator + " " + formatNumber(currentVal) + " =");
    }

    switch (operator) {
      case "+": result = a + b; break;
      case "−": result = a - b; break;
      case "×": result = a * b; break;
      case "÷":
        if (b === 0) { result = "Error"; break; }
        result = a / b;
        break;
      default:  result = b;
    }

    if (result === "Error") {
      currentVal   = "Error";
      prevVal      = "";
      operator     = null;
      waitingForOp = false;
    } else {
      // Clean up floating point imprecision
      currentVal = parseFloat(result.toPrecision(12)).toString();
      if (finalEq) {
        justEqualled = true;
        prevVal      = "";
        operator     = null;
        waitingForOp = false;
      } else {
        prevVal = currentVal;
      }
    }

    highlightOp(null);
    flashDisplay();
    updateDisplay(currentVal);
    updateClearBtn();
  }

  function clearCalc() {
    if (currentVal !== "0" && !justEqualled) {
      // "C" — clear only current entry
      currentVal = "0";
      waitingForOp = false;
    } else {
      // "AC" — clear everything
      currentVal   = "0";
      prevVal      = "";
      operator     = null;
      waitingForOp = false;
      justEqualled = false;
      setExpression("");
      highlightOp(null);
    }
    updateDisplay(currentVal);
    updateClearBtn();
  }

  function toggleSign() {
    if (currentVal === "0" || currentVal === "Error") return;
    currentVal = (parseFloat(currentVal) * -1).toString();
    updateDisplay(currentVal);
  }

  function applyPercent() {
    if (currentVal === "Error") return;
    currentVal = (parseFloat(currentVal) / 100).toString();
    updateDisplay(currentVal);
  }

  function backspace() {
    if (currentVal === "Error" || justEqualled) return;
    if (currentVal.length <= 1 || (currentVal.length === 2 && currentVal[0] === "-")) {
      currentVal = "0";
    } else {
      currentVal = currentVal.slice(0, -1);
    }
    updateDisplay(currentVal);
    updateClearBtn();
  }

  // ── Button click handler ───────────────────────────────────
  allBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var action = btn.dataset.action;
      var value  = btn.dataset.value;

      switch (action) {
        case "number":   inputNumber(value);   break;
        case "decimal":  inputDecimal();        break;
        case "operator": inputOperator(value); break;
        case "equals":   calculate(true);      break;
        case "clear":    clearCalc();          break;
        case "sign":     toggleSign();         break;
        case "percent":  applyPercent();       break;
      }
    });
  });

  // ── Keyboard handler ───────────────────────────────────────
  document.addEventListener("keydown", function (e) {
    var k = e.key;

    if (k >= "0" && k <= "9")      { inputNumber(k);        animateKey(k); }
    else if (k === ".")            { inputDecimal();         animateKey("."); }
    else if (k === "+")            { inputOperator("+");     animateKey("+"); }
    else if (k === "-")            { inputOperator("−");     animateKey("−"); }
    else if (k === "*")            { inputOperator("×");     animateKey("×"); }
    else if (k === "/") {
      e.preventDefault();
      inputOperator("÷");
      animateKey("÷");
    }
    else if (k === "Enter" || k === "=") { calculate(true); animateKey("="); }
    else if (k === "Backspace")    { backspace(); }
    else if (k === "Escape")       { clearCalc(); }
    else if (k === "%")            { applyPercent(); }
  });

  // Visually "press" the matching button on keyboard input
  function animateKey(char) {
    allBtns.forEach(function (btn) {
      var a = btn.dataset.action;
      var v = btn.dataset.value;
      var match = false;

      if (a === "number"   && v === char) match = true;
      if (a === "operator" && v === char) match = true;
      if (a === "decimal"  && char === ".") match = true;
      if (a === "equals"   && char === "=") match = true;

      if (match) {
        btn.classList.add("key-press");
        setTimeout(function () { btn.classList.remove("key-press"); }, 120);
      }
    });
  }

  // ── Init ──────────────────────────────────────────────────
  updateDisplay("0");
  updateClearBtn();

})();