import {
	CHARACTERISTIC_UUIDS,
	CharacteristicKeys,
	SERVICE_UUID,
} from "@/constants"
import { useState, useCallback, useRef } from "react"

export const useBluetoothConnection = () => {
	const [connectionStatus, setConnectionStatus] = useState("Disconnected")
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [isConnected, setIsConnected] = useState(false)
	const [isRunning, setIsRunning] = useState(false)
	const characteristicsRef = useRef<Record<
		CharacteristicKeys,
		BluetoothRemoteGATTCharacteristic
	> | null>(null)
	const deviceRef = useRef<BluetoothDevice | null>(null)

	const connectToBle = async () => {
		try {
			setConnectionStatus("Requesting Bluetooth Device...")
			const device = await navigator.bluetooth.requestDevice({
				filters: [{ services: [SERVICE_UUID] }],
			})
			deviceRef.current = device

			setConnectionStatus("Connecting to GATT Server...")
			const server = await device.gatt?.connect()

			if (!server) {
				throw new Error("Failed to connect to GATT server")
			}

			setConnectionStatus("Getting Service...")
			const service = await server.getPrimaryService(SERVICE_UUID)

			setConnectionStatus("Getting Characteristics...")
			const characteristicPromises = Object.entries(CHARACTERISTIC_UUIDS).map(
				async ([key, uuid]) => {
					const characteristic = await service.getCharacteristic(uuid)
					return [key, characteristic] as [
						CharacteristicKeys,
						BluetoothRemoteGATTCharacteristic,
					]
				},
			)

			const characteristics = Object.fromEntries(
				await Promise.all(characteristicPromises),
			) as Record<CharacteristicKeys, BluetoothRemoteGATTCharacteristic>
			characteristicsRef.current = characteristics

			setIsConnected(true)
			setErrorMessage(null)
			setConnectionStatus("Connected. Click 'Start' to begin.")
		} catch (error) {
			setErrorMessage(`Error - ${(error as Error).message}`)
			setConnectionStatus("Connection failed")
		}
	}

	const disconnectBle = async () => {
		if (deviceRef.current && deviceRef.current.gatt?.connected) {
			await deviceRef.current.gatt.disconnect()
		}
		setIsConnected(false)
		setIsRunning(false)
		setConnectionStatus("Disconnected")
		characteristicsRef.current = null
		deviceRef.current = null
	}

	const startBoard = useCallback(async () => {
		if (!characteristicsRef.current) {
			setErrorMessage("Not connected to the board")
			return
		}
		try {
			const encoder = new TextEncoder()
			const value = encoder.encode("1")
			await characteristicsRef.current.start.writeValue(value)
			setIsRunning(true)
			setConnectionStatus("Board started")
		} catch (error) {
			setErrorMessage(`Error starting board - ${(error as Error).message}`)
		}
	}, [])

	const stopBoard = useCallback(async () => {
		if (!characteristicsRef.current) {
			setErrorMessage("Not connected to the board")
			return
		}
		try {
			const encoder = new TextEncoder()
			const value = encoder.encode("0")
			await characteristicsRef.current.start.writeValue(value)
			setIsRunning(false)
			setConnectionStatus("Board stopped")
		} catch (error) {
			setErrorMessage(`Error stopping board - ${(error as Error).message}`)
		}
	}, [])

	const readCharacteristic = async (key: CharacteristicKeys) => {
		if (!characteristicsRef.current || !isRunning) {
			return null
		}
		const characteristic = characteristicsRef.current[key]
		try {
			const value = await characteristic.readValue()
			const decoder = new TextDecoder("utf-8")
			return decoder.decode(value)
		} catch (error) {
			setErrorMessage(`Error reading ${key}: ${(error as Error).message}`)
			return null
		}
	}

	return {
		connectionStatus,
		errorMessage,
		isConnected,
		isRunning,
		connectToBle,
		disconnectBle,
		startBoard,
		stopBoard,
		readCharacteristic,
	}
}
