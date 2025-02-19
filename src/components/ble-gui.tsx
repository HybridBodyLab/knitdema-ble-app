// src/components/ble-gui.tsx

import React, { useState, useCallback, useRef, useEffect } from "react"
import { CHARACTERISTIC_UUIDS, CharacteristicKeys } from "@/constants"
import { useBluetoothConnection } from "@/hooks/use-bluetooth-connection"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import StatusPanel from "./status-panel"
import { addMinutes, differenceInSeconds, format } from "date-fns"
import { SESSION_DURATION_MINUTES } from "@/lib/constants"
import gloveImage from "/src/assets/glove.png"
import audio from "/src/assets/notification.mp3"
import GlowingProgressLines, {
	LinePosition,
} from "@/components/glowing-progress-lines"
import ConnectionHistory from "./connection-history"

const linePositions: Record<string, LinePosition[]> = {
	thumb: [
		{
			start: { top: "173px", left: "11px" },
			end: { top: "173px", left: "63px" },
			rotation: 285,
		},
		{
			start: { top: "175px", left: "25px" },
			end: { top: "175px", left: "74px" },
			rotation: 285,
		},
		{
			start: { top: "180px", left: "39px" },
			end: { top: "180px", left: "88px" },
			rotation: 285,
		},
		{
			start: { top: "185px", left: "53px" },
			end: { top: "185px", left: "102px" },
			rotation: 285,
		},
		{
			start: { top: "190px", left: "67px" },
			end: { top: "190px", left: "116px" },
			rotation: 285,
		},
		{
			start: { top: "195px", left: "81px" },
			end: { top: "195px", left: "130px" },
			rotation: 285,
		},
	],
	index: [
		{
			start: { top: "20px", left: "145px" },
			end: { top: "20px", left: "190px" },
		},
		{
			start: { top: "35px", left: "145px" },
			end: { top: "35px", left: "190px" },
		},
		{
			start: { top: "50px", left: "145px" },
			end: { top: "50px", left: "190px" },
		},
		{
			start: { top: "65px", left: "145px" },
			end: { top: "65px", left: "190px" },
		},
		{
			start: { top: "80px", left: "145px" },
			end: { top: "80px", left: "190px" },
		},
		{
			start: { top: "95px", left: "145px" },
			end: { top: "95px", left: "190px" },
		},
	],
	middle: [
		{
			start: { top: "28px", left: "206px" },
			end: { top: "28px", left: "248px" },
		},
		{
			start: { top: "43px", left: "202px" },
			end: { top: "43px", left: "247px" },
		},
		{
			start: { top: "58px", left: "199px" },
			end: { top: "58px", left: "243px" },
		},
		{
			start: { top: "73px", left: "197px" },
			end: { top: "73px", left: "241px" },
		},
		{
			start: { top: "88px", left: "194px" },
			end: { top: "88px", left: "237px" },
		},
		{
			start: { top: "103px", left: "191px" },
			end: { top: "103px", left: "234px" },
		},
	],
	ring: [
		{
			start: { top: "46px", left: "254px" },
			end: { top: "46px", left: "295px" },
		},
		{
			start: { top: "60px", left: "250px" },
			end: { top: "60px", left: "292px" },
		},
		{
			start: { top: "74px", left: "246px" },
			end: { top: "74px", left: "289px" },
		},
		{
			start: { top: "88px", left: "242px" },
			end: { top: "88px", left: "284px" },
		},
		{
			start: { top: "98px", left: "240px" },
			end: { top: "98px", left: "282px" },
		},
		{
			start: { top: "108px", left: "236px" },
			end: { top: "108px", left: "278px" },
		},
	],
	pinky: [
		{
			start: { top: "65px", left: "304px" },
			end: { top: "65px", left: "345px" },
		},
		{
			start: { top: "78px", left: "300px" },
			end: { top: "78px", left: "341px" },
		},
		{
			start: { top: "91px", left: "294px" },
			end: { top: "91px", left: "335px" },
		},
		{
			start: { top: "104px", left: "290px" },
			end: { top: "104px", left: "329px" },
		},
		{
			start: { top: "114px", left: "286px" },
			end: { top: "114px", left: "325px" },
		},
		{
			start: { top: "124px", left: "284px" },
			end: { top: "124px", left: "323px" },
		},
	],
	palm: [
		{
			start: { top: "135px", left: "141px" },
			end: { top: "135px", left: "310px" },
			rotation: 15,
		},
		{
			start: { top: "146px", left: "135px" },
			end: { top: "146px", left: "310px" },
			rotation: 15,
		},
		{
			start: { top: "146px", left: "135px" },
			end: { top: "146px", left: "315px" },
			rotation: 22,
		},
		{
			start: { top: "155px", left: "132px" },
			end: { top: "155px", left: "315px" },
			rotation: 25,
		},
		{
			start: { top: "160px", left: "115px" },
			end: { top: "160px", left: "318px" },
			rotation: 26,
		},
		{
			start: { top: "173px", left: "115px" },
			end: { top: "170px", left: "318px" },
			rotation: 28,
		},
		{
			start: { top: "290px", left: "125px" },
			end: { top: "170px", left: "295px" },
			rotation: 356,
		},
	],
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
	const [remainingTime, setRemainingTime] = useState<string>(
		format(new Date(SESSION_DURATION_MINUTES * 60 * 1000), "mm:ss"),
	)
	const [playAlert, setPlayAlert] = useState<boolean>(true)

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

	useEffect(() => {
		if (!isRunning || !startTime) {
			setRemainingTime(formatRemainingTime(SESSION_DURATION_MINUTES * 60))
			return () => {}
		}

		const stopTime = startTime.getTime() + SESSION_DURATION_MINUTES * 60 * 1000

		const updateCountdown = () => {
			const remaining = Math.max(0, Math.floor((stopTime - Date.now()) / 1000))
			setRemainingTime(formatRemainingTime(remaining))
		}

		updateCountdown()
		const intervalId = window.setInterval(updateCountdown, 1000)
		return () => window.clearInterval(intervalId)
	}, [isRunning, startTime])

	useEffect(() => {
		if (!isRunning || !startTime) return () => {}

		const stopTime = startTime.getTime() + SESSION_DURATION_MINUTES * 60 * 1000
		const timeUntilStop = stopTime - Date.now()

		const timeoutId = window.setTimeout(
			async () => {
				await handleDisconnect()
				await createSessionEndAlert()
			},
			Math.max(0, timeUntilStop),
		)

		return () => window.clearTimeout(timeoutId)
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
	): Record<string, number> => {
		const result: Record<string, number> = {}
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
				result[char] = data[char as keyof typeof data].indexOf("1")
			}
		})
		return result
	}

	return (
		<div className="flex min-h-screen flex-col items-center p-4 sm:p-8">
			<Card className="w-full max-w-3xl rounded-lg p-4 text-white shadow-md sm:p-6">
				<div className="flex flex-col space-y-4">
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

					{isConnected && (
						<div className="flex flex-col space-y-4">
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
									<span className="text-center text-sm text-red-800 sm:text-left">
										{formatRemainingTimeDisplay(
											differenceInSeconds(
												addMinutes(startTime!, SESSION_DURATION_MINUTES),
												new Date(),
											),
										)}
									</span>
								</div>
							)}
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
				<span className="flex items-center justify-center text-xl text-blue-600">
					Glove Compression Status
				</span>
				{/* To show the connection history */}
				<div className="flex items-center justify-center text-xl text-blue-600">
					<ConnectionHistory isConnected={isConnected} isRunning={isRunning} />
				</div>
			</Card>
		</div>
	)
}

export default BleGUI
