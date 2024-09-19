import React, { useState, useCallback, useRef, useEffect } from "react"
import { CHARACTERISTIC_UUIDS, CharacteristicKeys } from "@/constants"
import { useBluetoothConnection } from "@/hooks/use-bluetooth-connection"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import StatusPanel from "./status-panel"
import SMATable from "./sma-table"

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
	}

	const handleStopBoard = async () => {
		const finalReadings = await stopBoard()
		if (finalReadings) {
			setReceivedData((prev) => ({ ...prev, ...finalReadings }))
		}
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
		<div className="flex min-h-screen flex-col items-center p-8">
			<Card className="w-full max-w-3xl rounded-lg p-6 text-white shadow-md">
				<div className="mb-6 flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
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
					{isConnected && (
						<div className="flex space-x-4">
							<Button
								onClick={startBoard}
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
						</div>
					)}
				</div>
				<StatusPanel
					connectionStatus={connectionStatus}
					isRunning={isRunning}
					errorMessage={errorMessage}
				/>
				<div className="mt-6">
					<SMATable smaData={transformDataForSMATable(receivedData)} />
				</div>
			</Card>
		</div>
	)
}

export default BleGUI
