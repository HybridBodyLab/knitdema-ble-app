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

	// Add active PWM levels state to track current levels
	const [pwmLevels, setPwmLevels] = useState<Record<string, number>>({
		thumb: 0,
		index: 0,
		middle: 0,
		ring: 0,
		pinky: 0,
		palm: 0,
	})

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

	const readCharacteristic = async (key: CharacteristicKeys) => {
		if (!characteristicsRef.current) {
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

	const readAllCharacteristics = useCallback(async () => {
		if (!characteristicsRef.current) {
			setErrorMessage("Not connected to the board")
			return null
		}
		const results: Partial<Record<CharacteristicKeys, string>> = {}
		for (const key of Object.keys(
			CHARACTERISTIC_UUIDS,
		) as CharacteristicKeys[]) {
			if (key !== "led" && key !== "start") {
				const value = await readCharacteristic(key)
				if (value) {
					results[key] = value
				}
			}
		}
		return results
	}, [])

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
			return null
		}
		try {
			const encoder = new TextEncoder()
			const value = encoder.encode("0")
			await characteristicsRef.current.start.writeValue(value)
			setIsRunning(false)
			setConnectionStatus("Board stopped")

			// Read all characteristics after stopping the board
			return await readAllCharacteristics()
		} catch (error) {
			setErrorMessage(`Error stopping board - ${(error as Error).message}`)
			return null
		}
	}, [readAllCharacteristics])

	// Add setPwmLevel function
	const setPwmLevel = useCallback(
		async (key: CharacteristicKeys, level: number) => {
			if (!characteristicsRef.current) {
				setErrorMessage("Not connected to the board")
				return false
			}

			if (level < 0 || level > 5) {
				setErrorMessage("PWM level must be between 0 and 5")
				return false
			}

			try {
				const encoder = new TextEncoder()
				const value = encoder.encode(level.toString())
				await characteristicsRef.current[key].writeValue(value)

				// Update the PWM level state
				setPwmLevels((prev) => ({
					...prev,
					[key]: level,
				}))

				setConnectionStatus(
					`${key.charAt(0).toUpperCase() + key.slice(1)} PWM level set to ${level}`,
				)
				return true
			} catch (error) {
				setErrorMessage(`Error setting PWM level: ${(error as Error).message}`)
				return false
			}
		},
		[],
	)

	const disconnectBle = async () => {
		let finalReadings = null
		if (isRunning) {
			finalReadings = await stopBoard()
		} else if (isConnected) {
			finalReadings = await readAllCharacteristics()
		}

		if (deviceRef.current && deviceRef.current.gatt?.connected) {
			await deviceRef.current.gatt.disconnect()
		}
		setIsConnected(false)
		setIsRunning(false)
		setConnectionStatus("Disconnected")
		characteristicsRef.current = null
		deviceRef.current = null

		return finalReadings
	}

	return {
		connectionStatus,
		errorMessage,
		isConnected,
		isRunning,
		pwmLevels,
		connectToBle,
		disconnectBle,
		startBoard,
		stopBoard,
		readCharacteristic,
		setPwmLevel,
	}
}
