import React, { useState, useCallback, useRef, useEffect } from "react"
import { CHARACTERISTIC_UUIDS, CharacteristicKeys } from "@/constants"
import { useBluetoothConnection } from "@/hooks/use-bluetooth-connection"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import DataDisplay from "./data-display"
import StatusPanel from "./status-panel"

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

	return (
		<div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-blue-100 to-blue-200 p-8">
			<h1 className="shadow-text mb-8 text-4xl font-bold text-blue-800">
				BLE Control Panel
			</h1>

			<Card className="w-full max-w-3xl">
				<div className="mb-6 flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
					<Button
						onClick={isConnected ? disconnectBle : connectToBle}
						className={`w-full sm:w-auto ${
							isConnected
								? "bg-red-500 hover:bg-red-600"
								: "bg-blue-500 hover:bg-blue-600"
						}`}
					>
						{isConnected ? "Disconnect" : "Connect"}
					</Button>
					{isConnected && (
						<div className="flex space-x-4">
							<Button
								onClick={startBoard}
								className="bg-green-500 hover:bg-green-600"
								disabled={isRunning}
							>
								Start Board
							</Button>
							<Button
								onClick={stopBoard}
								className="bg-yellow-500 hover:bg-yellow-600"
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

				<DataDisplay receivedData={receivedData} />
			</Card>
		</div>
	)
}

export default BleGUI
