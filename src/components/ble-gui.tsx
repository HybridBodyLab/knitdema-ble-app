import React, { useState, useCallback, useRef, useEffect } from "react"
import { CHARACTERISTIC_UUIDS, CharacteristicKeys } from "@/constants"
import { useBluetoothConnection } from "@/hooks/use-bluetooth-connection"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import StatusPanel from "./status-panel"
import SMATable from "./sma-table"
import { addSeconds, differenceInSeconds } from "date-fns"
import {
	TIME_FOR_AUTO_STOP,
	TIME_FOR_AUTO_STOP_IN_MINUTES,
} from "@/lib/constants"

const formatTimeDescription = (timeString: string): string => {
	const [minutes, seconds] = timeString.split(":").map(Number)

	if (minutes === 0) {
		return `${seconds} seconds`
	} else if (minutes === 1) {
		return `1 minute ${seconds} seconds`
	} else {
		return `${minutes} minutes ${seconds} seconds`
	}
}

const BleGUI: React.FC = () => {
	const [receivedData, setReceivedData] = useState<
		Record<CharacteristicKeys, string>
	>({
		led: "0",
		start: "0",
		thumb: "000000",
		index: "000000",
		middle: "000000",
		ring: "000000",
		pinky: "000000",
		palm: "0000000",
	})

	const [startTime, setStartTime] = useState<Date | null>(null)
	const [remainingTime, setRemainingTime] = useState<string>(TIME_FOR_AUTO_STOP)
	const [playAlert, setPlayAlert] = useState<boolean>(false);

	const {
		connectionStatus,
		errorMessage,
		isConnected,
		isRunning,
		connectToBle,
		disconnectBle,
		startBoard,
		stopBoard,
		readCharacteristic,
	} = useBluetoothConnection()

	const readingQueueRef = useRef<CharacteristicKeys[]>([])
	const isProcessingRef = useRef(false)
	const intervalIdRef = useRef<number | null>(null)
	const autoStopTimeoutRef = useRef<number | null>(null)
	const countdownIntervalRef = useRef<number | null>(null)
	const notificationSound = new Audio("https://github.com/AshwinRajarajan/dummy/raw/refs/heads/main/notification-tune.mp3")

	const readCharacteristics = useCallback(() => {
		const processQueue = async () => {
			if (
				isProcessingRef.current ||
				readingQueueRef.current.length === 0 ||
				!isRunning
			)
				return
			isProcessingRef.current = true
			while (readingQueueRef.current.length > 0 && isRunning) {
				const key = readingQueueRef.current.shift()
				if (key) {
					const value = await readCharacteristic(key)
					if (value) {
						setReceivedData((prev) => ({ ...prev, [key]: value }))
					}
					await new Promise((resolve) => setTimeout(resolve, 50))
				}
			}
			isProcessingRef.current = false
		}

		if (!isRunning) return
		Object.keys(CHARACTERISTIC_UUIDS).forEach((key) => {
			if (key !== "led" && key !== "start") {
				readingQueueRef.current.push(key as CharacteristicKeys)
			}
		})
		processQueue()
	}, [isRunning, readCharacteristic])

	// Update countdown time
	useEffect(() => {
		if (isRunning && startTime) {
			const updateCountdown = () => {
				const now = new Date()
				const stopTime = addSeconds(startTime, TIME_FOR_AUTO_STOP_IN_MINUTES * 60)
				const secondsRemaining = differenceInSeconds(stopTime, now)

				if (secondsRemaining <= 0) {
					setRemainingTime("00:00")
					return
				}

				const minutes = Math.floor(secondsRemaining / 60)
				const seconds = secondsRemaining % 60
				setRemainingTime(
					`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
				)
			}

			// Update immediately and then every second
			updateCountdown()
			countdownIntervalRef.current = window.setInterval(updateCountdown, 1000)
		} else {
			setRemainingTime(TIME_FOR_AUTO_STOP)
			if (countdownIntervalRef.current) {
				window.clearInterval(countdownIntervalRef.current)
			}
		}

		return () => {
			if (countdownIntervalRef.current) {
				window.clearInterval(countdownIntervalRef.current)
			}
		}
	}, [isRunning, startTime])

	// Auto-stop after 30 minutes
	useEffect(() => {
		if (isRunning && startTime) {
			const stopTime = addSeconds(startTime, TIME_FOR_AUTO_STOP_IN_MINUTES * 60)
			const timeUntilStop = stopTime.getTime() - new Date().getTime()

			if (autoStopTimeoutRef.current) {
				window.clearTimeout(autoStopTimeoutRef.current)
			}

			autoStopTimeoutRef.current = window.setTimeout(() => {
				handleStopBoard();
				createSessionEndAlert();
			}, timeUntilStop)
		}

		return () => {
			if (autoStopTimeoutRef.current) {
				window.clearTimeout(autoStopTimeoutRef.current)
			}
		}
	}, [isRunning, startTime, playAlert])

	useEffect(() => {
		if (isRunning) {
			intervalIdRef.current = window.setInterval(readCharacteristics, 100)
		} else {
			if (intervalIdRef.current !== null) {
				window.clearInterval(intervalIdRef.current)
				intervalIdRef.current = null
			}
			readingQueueRef.current = []
			isProcessingRef.current = false
		}

		return () => {
			if (intervalIdRef.current !== null) {
				window.clearInterval(intervalIdRef.current)
			}
		}
	}, [isRunning, readCharacteristics])

	const handleDisconnect = async () => {
		const finalReadings = await disconnectBle()
		if (finalReadings) {
			setReceivedData((prev) => ({ ...prev, ...finalReadings }))
		}
		setStartTime(null)
	}

	const handleStartBoard = async () => {
		await startBoard()
		setStartTime(new Date())
	}

	const handleStopBoard = async () => {
		const finalReadings = await stopBoard()
		if (finalReadings) {
			setReceivedData((prev) => ({ ...prev, ...finalReadings }))
		}
		setStartTime(null)
	}

	const createSessionEndAlert = async () => {
		if(playAlert) {
			await notificationSound.play()
		}
		window.alert(`Your ${formatTimeDescription(TIME_FOR_AUTO_STOP)} session has Ended!`);
	}

	const transformDataForSMATable = (
		data: Record<CharacteristicKeys, string>,
	) => {
		const smaData = []
		for (let i = 0; i < 7; i++) {
			smaData.push({
				number: `SMA${i + 1}`,
				index: i < 6 ? (data.index[i] === "1" ? "high" : "disabled") : "N/A",
				middle: i < 6 ? (data.middle[i] === "1" ? "high" : "disabled") : "N/A",
				ring: i < 6 ? (data.ring[i] === "1" ? "high" : "disabled") : "N/A",
				little: i < 6 ? (data.pinky[i] === "1" ? "high" : "disabled") : "N/A",
				thumb: i < 6 ? (data.thumb[i] === "1" ? "high" : "disabled") : "N/A",
				palm: data.palm[i] === "1" ? "high" : "disabled",
			})
		}
		return smaData
	}

	return (
		<div className="flex min-h-screen flex-col items-center p-4 sm:p-8">
			<Card className="w-full max-w-3xl rounded-lg p-4 text-white shadow-md sm:p-6">
				<div className="flex flex-col space-y-4">
					{/* Connection Button */}
					<div className="w-full">
						<Button
							onClick={isConnected ? handleDisconnect : connectToBle}
							className={`w-full rounded-md border border-gray-600 px-4 py-2 text-white sm:w-auto ${
								isConnected
									? "bg-red-600 hover:bg-red-700"
									: "bg-blue-600 hover:bg-blue-700"
							}`}
						>
							{isConnected ? "Disconnect" : "Connect"}
						</Button>
					</div>

					{/* Controls Section */}
					{isConnected && (
						<div className="flex flex-col space-y-4">
							{/* Control Buttons */}
							<div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row sm:space-x-4">
								<Button
									onClick={handleStartBoard}
									className="rounded-md border border-gray-600 bg-green-600 px-4 py-2 text-white hover:bg-green-700"
									disabled={isRunning}
								>
									Start Board
								</Button>
								<Button
									onClick={handleStopBoard}
									className="rounded-md border border-gray-600 bg-red-600 px-4 py-2 text-white hover:bg-red-700"
									disabled={!isRunning}
								>
									Stop Board
								</Button>
								<label className="flex items-center space-x-2 text-blue-500">
									<input
										type="checkbox"
										checked={playAlert}
										onChange={(e) => setPlayAlert(e.target.checked)}
										className="form-checkbox rounded text-blue-600 focus:ring-2 focus:ring-blue-400"
									/>
									<span>Play Sound Alert when session ends</span>
								</label>
							</div>

							{/* Timer Display */}
							{isRunning && (
								<div className="flex flex-col space-y-2 rounded-lg bg-gray-800/50 p-3 sm:space-y-1">
									<div className="flex items-center justify-center space-x-3 sm:justify-start">
										<span className="text-sm font-medium text-gray-300">
											Auto-stop in:
										</span>
										<span className="rounded-md bg-gray-900/50 px-3 py-1 font-mono text-xl font-bold">
											{remainingTime}
										</span>
									</div>
									<span className="text-center text-sm text-gray-400 sm:text-left">
										{formatTimeDescription(remainingTime) + ' remaining'}
									</span>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Status and Table */}
				<div className="mt-6">
					<StatusPanel
						connectionStatus={connectionStatus}
						isRunning={isRunning}
						errorMessage={errorMessage}
					/>
				</div>
				<div className="mt-6">
					<SMATable smaData={transformDataForSMATable(receivedData)} />
				</div>
			</Card>
		</div>
	)
}

export default BleGUI
