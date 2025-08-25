// src/components/ble-gui.tsx
import React, { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { CHARACTERISTIC_UUIDS, CharacteristicKeys } from "@/constants"
import { useBluetoothConnection } from "@/hooks/use-bluetooth-connection"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import StatusPanel from "./status-panel"
import { addMinutes, differenceInSeconds, format } from "date-fns"
import {
	linePositions,
	SESSION_DURATION_OPTIONS,
	getCurrentSessionDuration,
	setCurrentSessionDuration,
} from "@/lib/constants"
import gloveImage from "/src/assets/glove.png"
import audio from "/src/assets/notification.mp3"
import GlowingProgressLines from "@/components/glowing-progress-lines"
import ConnectionHistory from "./connection-history"
import { Label } from "./ui/label"
import ClinicianSettingsModal from "./clinician-settings-modal"

interface BleGUIProps {
	triggerModalOpen: number
}

const BleGUI: React.FC<BleGUIProps> = ({ triggerModalOpen }) => {
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
	const [remainingTime, setRemainingTime] = useState<string>(
		format(new Date(getCurrentSessionDuration() * 60 * 1000), "mm:ss"),
	)
	const [playAlert, setPlayAlert] = useState<boolean>(true)
	const [sessionDuration, setSessionDuration] = useState<string>(
		getCurrentSessionDuration().toString(),
	)
	const [showClinicianModal, setShowClinicianModal] = useState<boolean>(false)

	// Listen for external trigger to open modal
	React.useEffect(() => {
		if (triggerModalOpen > 0) {
			setShowClinicianModal(true)
		}
	}, [triggerModalOpen])

	const {
		connectionStatus,
		errorMessage,
		isConnected,
		isRunning,
		isMockMode,
		pwmLevels,
		activationMode,
		connectToBle,
		mockConnect,
		disconnectBle,
		startBoard,
		stopBoard,
		readCharacteristic,
		setPwmLevel,
		changeActivationMode,
	} = useBluetoothConnection()

	const readingQueueRef = useRef<CharacteristicKeys[]>([])
	const isProcessingRef = useRef(false)
	const intervalIdRef = useRef<number | null>(null)
	const notificationSound = useMemo(() => new Audio(audio), [])

	const formatRemainingTime = (seconds: number): string => {
		if (seconds <= 0) return "00:00"
		return format(new Date(seconds * 1000), "mm:ss")
	}

	const formatRemainingTimeDisplay = (seconds: number): string => {
		if (seconds <= 0) return "Time's up"

		const minutes = Math.floor(seconds / 60)
		const remainingSeconds = seconds % 60

		if (minutes === 0) {
			return `${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""} remaining`
		}

		if (remainingSeconds === 0) {
			return `${minutes} minute${minutes !== 1 ? "s" : ""} remaining`
		}

		return `${minutes} minute${minutes !== 1 ? "s" : ""} ${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""} remaining`
	}

	const readCharacteristics = useCallback(() => {
		const processQueue = async () => {
			if (
				isProcessingRef.current ||
				readingQueueRef.current.length === 0 ||
				!isRunning
			) {
				return
			}

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

	// Handle session duration change
	const handleSessionDurationChange = (value: string) => {
		setSessionDuration(value)
		// Update the session duration
		setCurrentSessionDuration(parseInt(value))
		// Update the remaining time display
		setRemainingTime(formatRemainingTime(parseInt(value) * 60))
	}

	//set calculate stop time
	useEffect(() => {
		if (!isRunning || !startTime) {
			setRemainingTime(formatRemainingTime(getCurrentSessionDuration() * 60))
			return () => {}
		}

		const stopTime = addMinutes(startTime, getCurrentSessionDuration())
		console.log("Session started at:", startTime)
		console.log("Expected stop time:", stopTime)

		const updateCountdown = () => {
			const remaining = differenceInSeconds(stopTime, new Date())
			setRemainingTime(formatRemainingTime(remaining))
		}

		updateCountdown()
		const intervalId = window.setInterval(updateCountdown, 1000)
		return () => window.clearInterval(intervalId)
	}, [isRunning, startTime])

	// disconnect from the board and set the start time to null
	const handleDisconnect = useCallback(async () => {
		const finalReadings = await disconnectBle()
		if (finalReadings) {
			setReceivedData((prev) => ({ ...prev, ...finalReadings }))
		}
		setStartTime(null)
	}, [disconnectBle])

	const createSessionEndAlert = useCallback(async () => {
		if (playAlert) {
			await new Promise((resolve) => {
				notificationSound.play()
				notificationSound.onended = resolve
			})
		}
		window.alert(`Your session has ended!`)
		window.location.reload()
	}, [playAlert, notificationSound])

	// when a new start time is set, set a timeout to disconnect and create an alert
	// run one time at the start of the session
	useEffect(() => {
		if (!isRunning || !startTime) return () => {}

		const checkStopTime = () => {
			const stopTime = addMinutes(startTime, getCurrentSessionDuration())
			if (new Date() >= stopTime) {
				handleDisconnect()
				createSessionEndAlert()
			}
		}

		const intervalId = setInterval(checkStopTime, 5000) // Check every 5 seconds

		return () => clearInterval(intervalId)
	}, [isRunning, startTime, playAlert, handleDisconnect, createSessionEndAlert])

	// read the characteristics (which SMA firing, etc.) every 100ms
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

	const transformDataForGlowingLines = (
		data: Record<CharacteristicKeys, string>,
	): Record<string, number[]> => {
		const result: Record<string, number[]> = {}
		const characteristics = [
			"palm",
			"thumb",
			"index",
			"middle",
			"ring",
			"pinky",
		]
		characteristics.forEach((char) => {
			if (char in data) {
				const value = data[char as keyof typeof data]
				// Find all occurrences of "1" in the string
				const activePositions: number[] = []
				for (let i = 0; i < value.length; i++) {
					if (value[i] === "1") {
						activePositions.push(i)
					}
				}
				// If no active positions, use -1 to indicate none active
				result[char] = activePositions.length > 0 ? activePositions : [-1]
			}
		})
		return result
	}

	// Handle PWM level changes
	const handlePwmLevelChange = async (
		key: CharacteristicKeys,
		value: number[],
	) => {
		// Slider returns an array of values, but we only have one slider per control
		const level = value[0]
		console.log(`Changing PWM level for ${key} to ${level}`)
		const result = await setPwmLevel(key, level)
		console.log(`PWM level change result:`, result)
	}

	return (
		<div className="flex min-h-screen flex-col items-center p-4 sm:p-8">
			<Card className="w-full max-w-3xl rounded-lg p-4 shadow-md sm:p-6">
				<div className="flex flex-col space-y-4">
					{/* Connection buttons and version info */}
					<div className="flex flex-col space-y-3">
						{!isConnected ? (
							<div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
								<Button
									onClick={connectToBle}
									variant="default"
									className="w-full sm:w-auto"
								>
									Connect
								</Button>
								<Button
									onClick={mockConnect}
									variant="outline"
									className="w-full border-dashed border-primary text-primary hover:bg-primary/10 sm:w-auto"
								>
									Mock Connect
								</Button>
							</div>
						) : (
							<div className="flex items-center justify-between">
								<Button
									onClick={handleDisconnect}
									variant="destructive"
									className="w-full sm:w-auto"
								>
									{isMockMode ? "Disconnect (Mock)" : "Disconnect"}
								</Button>
								<div className="text-sm text-muted-foreground">
									{isMockMode ? "Mock Mode" : "Hardware"} • v1.0.0
								</div>
							</div>
						)}
					</div>

					{isConnected && (
						<div className="flex flex-col space-y-4">
							<div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row sm:space-x-4">
								<Button
									onClick={handleStartBoard}
									variant="outline"
									className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
									disabled={isRunning}
								>
									Start Board
								</Button>
								<Button
									onClick={handleStopBoard}
									variant="outline"
									className="bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700"
									disabled={!isRunning}
								>
									Stop Board
								</Button>
							</div>

							<div className="flex flex-col space-y-4 rounded-lg bg-muted/50 p-3">
								<div className="flex items-center space-x-2">
									<Label className="whitespace-nowrap text-sm font-medium text-muted-foreground">
										Session Duration:
									</Label>
									<span className="text-sm font-medium">
										{SESSION_DURATION_OPTIONS.find(
											(opt) => opt.value === sessionDuration,
										)?.label || sessionDuration + " minutes"}
									</span>
								</div>

								<label className="flex items-center space-x-2 text-foreground">
									<input
										type="checkbox"
										checked={playAlert}
										onChange={(e) => setPlayAlert(e.target.checked)}
										className="rounded accent-primary"
									/>
									<span>Play Sound Alert when session ends</span>
								</label>
							</div>

							{/* Show Current Compression Pattern (Read-only) */}
							<div className="rounded-lg bg-muted/50 p-4">
								<div className="mb-2 flex items-center justify-between">
									<h3 className="text-lg font-medium">Compression Pattern</h3>
									<span className="text-xs text-muted-foreground">
										Clinician controlled
									</span>
								</div>
								<div className="text-sm font-medium">
									{activationMode === 0
										? "Single"
										: activationMode === 1
											? "Dual"
											: "Triple"}
								</div>
								<p className="mt-1 text-xs text-muted-foreground">
									{activationMode === 0
										? "Activates one SMA at a time"
										: activationMode === 1
											? "Activates two SMAs at a time"
											: "Activates three SMAs at a time"}
								</p>
							</div>

							{isRunning && (
								<div className="flex flex-col space-y-2 rounded-lg bg-muted/50 p-3 sm:space-y-1">
									<div className="flex items-center justify-center space-x-3 sm:justify-start">
										<span className="text-sm font-medium text-muted-foreground">
											Auto-stop in:
										</span>
										<span className="rounded-md bg-background/50 px-3 py-1 font-mono text-xl font-bold">
											{remainingTime}
										</span>
									</div>
									<span className="text-center text-sm text-rose-600 dark:text-rose-400 sm:text-left">
										{formatRemainingTimeDisplay(
											differenceInSeconds(
												addMinutes(startTime!, getCurrentSessionDuration()),
												new Date(),
											),
										)}
									</span>
								</div>
							)}

							{/* Show Current Compression Levels (Read-only) */}
							<div className="mt-6 rounded-lg bg-muted/50 p-4">
								<div className="mb-4 flex items-center justify-between">
									<h3 className="text-lg font-medium">Compression Levels</h3>
									<span className="text-xs text-muted-foreground">
										Clinician controlled
									</span>
								</div>
								<div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
									{(
										[
											"thumb",
											"index",
											"middle",
											"ring",
											"pinky",
											"palm",
										] as CharacteristicKeys[]
									).map((key) => (
										<div key={key} className="flex justify-between">
											<span className="capitalize text-muted-foreground">
												{key}:
											</span>
											<span className="font-medium">{pwmLevels[key]}/5</span>
										</div>
									))}
								</div>
							</div>
						</div>
					)}
				</div>
				<div className="mt-6">
					<StatusPanel
						connectionStatus={connectionStatus}
						isRunning={isRunning}
						errorMessage={errorMessage}
						isMockMode={isMockMode}
					/>
				</div>
				<div
					className="relative mt-6"
					style={{ width: "100%", paddingBottom: "100%" }}
				>
					<img
						src={gloveImage}
						alt="EdemaFlex Glove"
						className="absolute left-0 top-0 size-full object-contain"
					/>
					<GlowingProgressLines
						characteristics={transformDataForGlowingLines(receivedData)}
						positions={linePositions}
					/>
				</div>
				<span className="mt-4 flex items-center justify-center text-xl text-primary">
					Glove Compression Status
				</span>
				{/* To show the connection history */}
				<div className="mt-6">
					<ConnectionHistory isConnected={isConnected} isRunning={isRunning} />
				</div>
			</Card>

			{/* Clinician Settings Modal */}
			<ClinicianSettingsModal
				isOpen={showClinicianModal}
				onClose={() => setShowClinicianModal(false)}
				isConnected={isConnected}
				sessionDuration={sessionDuration}
				onSessionDurationChange={handleSessionDurationChange}
				isRunning={isRunning}
				activationMode={activationMode}
				onActivationModeChange={changeActivationMode}
				pwmLevels={pwmLevels}
				onPwmLevelChange={handlePwmLevelChange}
			/>
		</div>
	)
}

export default BleGUI
