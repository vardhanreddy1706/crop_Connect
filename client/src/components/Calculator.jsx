import React, { useState, useEffect, useCallback } from "react";
import {
	Calculator,
	X,
	Delete,
	RotateCcw,
	Percent,
	Square,
	Divide,
	Minus,
	Plus,
	X as Multiply,
	Equal,
} from "lucide-react";

export default function CalculatorComponent() {
	const [isOpen, setIsOpen] = useState(false);
	const [display, setDisplay] = useState("0");
	const [previousValue, setPreviousValue] = useState(null);
	const [operation, setOperation] = useState(null);
	const [waitingForOperand, setWaitingForOperand] = useState(false);
	const [history, setHistory] = useState([]);

	const inputNumber = useCallback(
		(num) => {
			if (waitingForOperand) {
				setDisplay(String(num));
				setWaitingForOperand(false);
			} else {
				setDisplay(display === "0" ? String(num) : display + num);
			}
		},
		[display, waitingForOperand]
	);

	const inputOperation = useCallback(
		(nextOperation) => {
			const inputValue = parseFloat(display);

			if (previousValue === null) {
				setPreviousValue(inputValue);
			} else if (operation) {
				const currentValue = previousValue || 0;
				const newValue = calculate(currentValue, inputValue, operation);

				setDisplay(String(newValue));
				setPreviousValue(newValue);
			}

			setWaitingForOperand(true);
			setOperation(nextOperation);
		},
		[display, previousValue, operation]
	);

	const calculate = (firstValue, secondValue, operation) => {
		switch (operation) {
			case "+":
				return firstValue + secondValue;
			case "-":
				return firstValue - secondValue;
			case "*":
				return firstValue * secondValue;
			case "/":
				return secondValue !== 0 ? firstValue / secondValue : "Error";
			case "%":
				return firstValue % secondValue;
			case "=":
				return secondValue;
			default:
				return secondValue;
		}
	};

	const performCalculation = useCallback(() => {
		const inputValue = parseFloat(display);

		if (previousValue !== null && operation) {
			const newValue = calculate(previousValue, inputValue, operation);
			const calculation = `${previousValue} ${operation} ${inputValue} = ${newValue}`;
			setHistory((prev) => [calculation, ...prev.slice(0, 4)]); // Keep last 5 calculations
			setDisplay(String(newValue));
			setPreviousValue(null);
			setOperation(null);
			setWaitingForOperand(true);
		}
	}, [display, previousValue, operation]);

	const clear = useCallback(() => {
		setDisplay("0");
		setPreviousValue(null);
		setOperation(null);
		setWaitingForOperand(false);
	}, []);

	const deleteLast = useCallback(() => {
		if (display.length > 1) {
			setDisplay(display.slice(0, -1));
		} else {
			setDisplay("0");
		}
	}, [display]);

	const inputDot = useCallback(() => {
		if (waitingForOperand) {
			setDisplay("0.");
			setWaitingForOperand(false);
		} else if (display.indexOf(".") === -1) {
			setDisplay(display + ".");
		}
	}, [display, waitingForOperand]);

	const calculatePercentage = useCallback(() => {
		const currentValue = parseFloat(display);
		setDisplay(String(currentValue / 100));
	}, [display]);

	const calculateSquareRoot = useCallback(() => {
		const currentValue = parseFloat(display);
		if (currentValue >= 0) {
			setDisplay(String(Math.sqrt(currentValue)));
		} else {
			setDisplay("Error");
		}
	}, [display]);

	const calculateSquare = useCallback(() => {
		const currentValue = parseFloat(display);
		setDisplay(String(currentValue * currentValue));
	}, [display]);

	// const toggleSign = useCallback(() => {
	// 	const currentValue = parseFloat(display);
	// 	setDisplay(String(-currentValue));
	// }, [display]);

	// Keyboard support
	useEffect(() => {
		const handleKeyPress = (event) => {
			if (!isOpen) return;

			const key = event.key;

			if (key >= "0" && key <= "9") {
				inputNumber(key);
			} else if (key === ".") {
				inputDot();
			} else if (key === "+") {
				inputOperation("+");
			} else if (key === "-") {
				inputOperation("-");
			} else if (key === "*") {
				inputOperation("*");
			} else if (key === "/") {
				inputOperation("/");
			} else if (key === "%") {
				calculatePercentage();
			} else if (key === "Enter" || key === "=") {
				event.preventDefault();
				performCalculation();
			} else if (key === "Backspace") {
				deleteLast();
			} else if (key === "Escape") {
				clear();
			} else if (key === "s" || key === "S") {
				calculateSquareRoot();
			} else if (key === "q" || key === "Q") {
				calculateSquare();
			}
		};

		document.addEventListener("keydown", handleKeyPress);
		return () => document.removeEventListener("keydown", handleKeyPress);
	}, [
		isOpen,
		inputNumber,
		inputDot,
		inputOperation,
		calculatePercentage,
		performCalculation,
		deleteLast,
		clear,
		calculateSquareRoot,
		calculateSquare,
	]);

	return (
		<>
			{/* Calculator Window (responsive: full-screen on mobile, fixed-size on desktop) */}
			<div
				className={`fixed z-50 bg-white shadow-2xl flex flex-col transition-all duration-300 transform ${
					isOpen
						? "opacity-100 translate-x-0"
						: "opacity-0 pointer-events-none translate-x-4"
				} w-80 h-[600px] bottom-6 left-6 rounded-2xl max-sm:w-full max-sm:h-full max-sm:top-0 max-sm:left-0 max-sm:rounded-none`}
			>
				{/* Header */}
				<div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-t-2xl flex justify-between items-center shadow-md">
					<div className="flex items-center gap-3">
						<div className="bg-white bg-opacity-20 p-2 rounded-full">
							<Calculator size={20} />
						</div>
						<div>
							<h3 className="font-bold text-base">Smart Calculator</h3>
							<p className="text-xs text-green-100">Real-time calculations</p>
						</div>
					</div>
					<button
						onClick={() => setIsOpen(false)}
						className="hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
					>
						<X size={18} />
					</button>
				</div>

				{/* History */}
				{history.length > 0 && (
					<div className="px-4 py-2 bg-gray-50 border-b">
						<div className="text-xs text-gray-600 mb-1">Recent:</div>
						<div className="text-sm text-gray-800 font-mono">{history[0]}</div>
					</div>
				)}

				{/* Display */}
				<div className="p-4 bg-gray-50">
					<div className="bg-white rounded-lg p-4 shadow-inner border-2 border-gray-100">
						<div className="text-right text-3xl font-mono text-gray-800 overflow-hidden break-all min-h-[48px] flex items-center justify-end">
							{display}
						</div>
					</div>
				</div>

				{/* Buttons */}
				<div className="flex-1 p-4 grid grid-cols-4 gap-2">
					{/* Row 1: Clear, Delete, %, √ */}
					<button
						onClick={clear}
						className="bg-red-500 hover:bg-red-600 text-white rounded-lg p-3 font-semibold transition-all transform hover:scale-105 active:scale-95"
					>
						<RotateCcw size={16} className="mx-auto" />
					</button>
					<button
						onClick={deleteLast}
						className="bg-gray-500 hover:bg-gray-600 text-white rounded-lg p-3 font-semibold transition-all transform hover:scale-105 active:scale-95"
					>
						<Delete size={16} className="mx-auto" />
					</button>
					<button
						onClick={calculatePercentage}
						className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-3 font-semibold transition-all transform hover:scale-105 active:scale-95"
					>
						<Percent size={16} className="mx-auto" />
					</button>
					<button
						onClick={calculateSquareRoot}
						className="bg-purple-500 hover:bg-purple-600 text-white rounded-lg p-3 font-semibold transition-all transform hover:scale-105 active:scale-95"
					>
						√
					</button>

					{/* Row 2: 7, 8, 9, / */}
					{[7, 8, 9].map((num) => (
						<button
							key={num}
							onClick={() => inputNumber(num)}
							className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg p-3 font-semibold transition-all transform hover:scale-105 active:scale-95 shadow-sm"
						>
							{num}
						</button>
					))}
					<button
						onClick={() => inputOperation("/")}
						className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg p-3 font-semibold transition-all transform hover:scale-105 active:scale-95"
					>
						<Divide size={16} className="mx-auto" />
					</button>

					{/* Row 3: 4, 5, 6, * */}
					{[4, 5, 6].map((num) => (
						<button
							key={num}
							onClick={() => inputNumber(num)}
							className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg p-3 font-semibold transition-all transform hover:scale-105 active:scale-95 shadow-sm"
						>
							{num}
						</button>
					))}
					<button
						onClick={() => inputOperation("*")}
						className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg p-3 font-semibold transition-all transform hover:scale-105 active:scale-95"
					>
						<Multiply size={16} className="mx-auto" />
					</button>

					{/* Row 4: 1, 2, 3, - */}
					{[1, 2, 3].map((num) => (
						<button
							key={num}
							onClick={() => inputNumber(num)}
							className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg p-3 font-semibold transition-all transform hover:scale-105 active:scale-95 shadow-sm"
						>
							{num}
						</button>
					))}
					<button
						onClick={() => inputOperation("-")}
						className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg p-3 font-semibold transition-all transform hover:scale-105 active:scale-95"
					>
						<Minus size={16} className="mx-auto" />
					</button>

					{/* Row 5: 0, ., +, = */}
					<button
						onClick={() => inputNumber(0)}
						className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg p-3 font-semibold transition-all transform hover:scale-105 active:scale-95 shadow-sm"
					>
						0
					</button>
					<button
						onClick={inputDot}
						className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg p-3 font-semibold transition-all transform hover:scale-105 active:scale-95 shadow-sm"
					>
						.
					</button>
					<button
						onClick={() => inputOperation("+")}
						className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg p-3 font-semibold transition-all transform hover:scale-105 active:scale-95"
					>
						<Plus size={16} className="mx-auto" />
					</button>
					<button
						onClick={performCalculation}
						className="bg-green-500 hover:bg-green-600 text-white rounded-lg p-3 font-semibold transition-all transform hover:scale-105 active:scale-95 row-span-1"
					>
						<Equal size={16} className="mx-auto" />
					</button>
				</div>

				{/* Keyboard shortcuts hint */}
				<div className="px-4 pb-3 text-xs text-gray-500 text-center">
					Use keyboard: 0-9, +, -, *, /, %, Enter, Backspace, Esc
				</div>
			</div>

			{/* Toggle Button pinned to bottom-left */}
			{!isOpen && (
				<button
					aria-label="Open calculator"
					onClick={() => setIsOpen(true)}
					className="fixed z-50 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white p-4 rounded-full shadow-2xl hover:shadow-xl transition-all transform hover:scale-110 animate-pulse"
					style={{ bottom: 24, left: 24 }}
				>
					<Calculator size={28} />
				</button>
			)}
		</>
	);
}
