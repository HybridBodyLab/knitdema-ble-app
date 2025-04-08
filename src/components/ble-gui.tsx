// src/components/ble-gui.tsx
import React, { useState, useCallback, useRef, useEffect } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Label } from "./ui/label"
import { ColoredSlider } from "./ui/slider-colored"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select"
import { ActivationModeSelector } from "./activation-mode-selector"

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
	const [remainingTime, setRemainingTime] = useState<string>(
		format(new Date(getCurrentSessionDuration() * 60 * 1000), "mm:ss"),
	)
	const [playAlert, setPlayAlert] = useState<boolean>(true)
	const [sessionDuration, setSessionDuration] = useState<string>(
		getCurrentSessionDuration().toString(),
	)

	const {
		connectionStatus,
		errorMessage,
		isConnected,
		isRunning,
		pwmLevels,
		activationMode,
		connectToBle,
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
	const notificationSound = new Audio(audio)

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
	}, [isRunning, startTime, playAlert])

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

	// disconnect from the board and set the start time to null
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
		if (playAlert) {
			await new Promise((resolve) => {
				notificationSound.play()
				notificationSound.onended = resolve
			})
		}
		window.alert(`Your session has ended!`)
		window.location.reload()
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
		await setPwmLevel(key, level)
	}

	return (
		<div className="flex min-h-screen flex-col items-center p-4 sm:p-8">
			<Card className="w-full max-w-3xl rounded-lg p-4 shadow-md sm:p-6">
				<div className="flex flex-col space-y-4">
					<div className="w-full">
						<Button
							onClick={isConnected ? handleDisconnect : connectToBle}
							variant={isConnected ? "destructive" : "default"}
							className="w-full sm:w-auto"
						>
							{isConnected ? "Disconnect" : "Connect"}
						</Button>
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
									<Label
										htmlFor="session-duration"
										className="whitespace-nowrap text-sm font-medium text-muted-foreground"
									>
										Session Duration:
									</Label>
									<Select
										value={sessionDuration}
										onValueChange={handleSessionDurationChange}
										disabled={isRunning}
									>
										<SelectTrigger id="session-duration" className="w-full">
											<SelectValue placeholder="Select duration" />
										</SelectTrigger>
										<SelectContent>
											{SESSION_DURATION_OPTIONS.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<label className="flex items-center space-x-2 text-foreground">
									<input
										type="checkbox"
										checked={playAlert}
										onChange={(e) => setPlayAlert(e.target.checked)}
										className="form-checkbox rounded accent-primary"
									/>
									<span>Play Sound Alert when session ends</span>
								</label>
							</div>

							{/* Activation Mode Selector */}
							<ActivationModeSelector
								value={activationMode}
								onChange={changeActivationMode}
								disabled={isRunning}
							/>

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

							{/* PWM Level Control UI */}
							<div className="mt-6 rounded-lg bg-muted/50 p-4">
								<h3 className="mb-4 text-lg font-medium">PWM Level Control</h3>
								<Tabs defaultValue="thumb" className="w-full">
									<TabsList className="grid w-full grid-cols-6">
										<TabsTrigger value="thumb">Thumb</TabsTrigger>
										<TabsTrigger value="index">Index</TabsTrigger>
										<TabsTrigger value="middle">Middle</TabsTrigger>
										<TabsTrigger value="ring">Ring</TabsTrigger>
										<TabsTrigger value="pinky">Pinky</TabsTrigger>
										<TabsTrigger value="palm">Palm</TabsTrigger>
									</TabsList>

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
										<TabsContent key={key} value={key} className="space-y-4">
											<div className="space-y-2">
												<div className="flex items-center justify-between">
													<Label htmlFor={`${key}-pwm-level`}>
														{key.charAt(0).toUpperCase() + key.slice(1)} PWM
														Level: {pwmLevels[key]}
													</Label>
													<span className="text-sm text-muted-foreground">
														(0-5)
													</span>
												</div>
												<ColoredSlider
													id={`${key}-pwm-level`}
													min={0}
													max={5}
													step={1}
													value={[pwmLevels[key]]}
													onValueChange={(value) =>
														handlePwmLevelChange(key, value)
													}
													level={pwmLevels[key]}
													className="w-full"
												/>
												<div className="flex justify-between text-xs text-muted-foreground">
													<span className="text-emerald-600 dark:text-emerald-500">
														Low
													</span>
													<span className="text-amber-600 dark:text-amber-500">
														Medium
													</span>
													<span className="text-rose-600 dark:text-rose-500">
														High
													</span>
												</div>
											</div>
										</TabsContent>
									))}
								</Tabs>
							</div>
						</div>
					)}
				</div>
				<div className="mt-6">
					<StatusPanel
						connectionStatus={connectionStatus}
						isRunning={isRunning}
						errorMessage={errorMessage}
					/>
				</div>
				<div
					className="relative mt-6"
					style={{ width: "100%", paddingBottom: "100%" }}
				>
					<img
						src={gloveImage}
						alt="Knitdema Glove"
						className="absolute left-0 top-0 h-full w-full object-contain"
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
		</div>
	)
}

export default BleGUI
