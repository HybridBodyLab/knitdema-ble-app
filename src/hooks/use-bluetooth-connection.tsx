import {
	CHARACTERISTIC_UUIDS,
	CharacteristicKeys,
	SERVICE_UUID,
} from "@/constants"
import { useState, useCallback, useRef, useEffect } from "react"
import { useLocalStorage } from "usehooks-ts"

export const useBluetoothConnection = () => {
	const [connectionStatus, setConnectionStatus] = useState("Disconnected")
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [isConnected, setIsConnected] = useState(false)
	const [isRunning, setIsRunning] = useState(false)
	const [activationMode, setActivationMode] = useLocalStorage<number>(
		"activation-mode",
		0,
	)
	const characteristicsRef = useRef<Record<
		CharacteristicKeys,
		BluetoothRemoteGATTCharacteristic
	> | null>(null)
	const deviceRef = useRef<BluetoothDevice | null>(null)

	// Add active PWM levels state with localStorage and default to level 3
	const [pwmLevels, setPwmLevels] = useLocalStorage<Record<string, number>>(
		"pwm-levels",
		{
			thumb: 3,
			index: 3,
			middle: 3,
			ring: 3,
			pinky: 3,
			palm: 3,
		},
	)

	// Apply saved PWM levels on connection
	useEffect(() => {
		if (isConnected && characteristicsRef.current) {
			const applyStoredLevels = async () => {
				// Small delay to ensure the board is ready
				await new Promise((resolve) => setTimeout(resolve, 1000))

				// First apply the activation mode
				try {
					await setActivationModeOnBoard(activationMode)
				} catch (error) {
					console.error("Failed to apply activation mode:", error)
				}

				for (const [key, level] of Object.entries(pwmLevels)) {
					if (Object.keys(CHARACTERISTIC_UUIDS).includes(key)) {
						try {
							const encoder = new TextEncoder()
							const value = encoder.encode(level.toString())
							await characteristicsRef.current?.[
								key as CharacteristicKeys
							]?.writeValue(value)
							console.log(`Applied stored PWM level for ${key}: ${level}`)
						} catch (error) {
							console.error(`Failed to apply PWM level for ${key}:`, error)
						}
					}
				}
			}

			applyStoredLevels()
		}
	}, [isConnected, pwmLevels, activationMode])

	// Function to set the activation mode on the board
	const setActivationModeOnBoard = useCallback(async (mode: number) => {
		if (!characteristicsRef.current) {
			setErrorMessage("Not connected to the board")
			return false
		}

		if (mode < 0 || mode > 2) {
			setErrorMessage("Activation mode must be between 0 and 2")
			return false
		}

		try {
			const encoder = new TextEncoder()
			const value = encoder.encode(mode.toString())
			await characteristicsRef.current.led.writeValue(value)

			setConnectionStatus(`Activation mode set to ${mode}`)
			return true
		} catch (error) {
			setErrorMessage(
				`Error setting activation mode: ${(error as Error).message}`,
			)
			return false
		}
	}, [])

	// Function to update the activation mode
	const changeActivationMode = useCallback(
		async (mode: number) => {
			if (await setActivationModeOnBoard(mode)) {
				setActivationMode(mode)
				return true
			}
			return false
		},
		[setActivationMode, setActivationModeOnBoard],
	)

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
		[setPwmLevels],
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
		activationMode,
		connectToBle,
		disconnectBle,
		startBoard,
		stopBoard,
		readCharacteristic,
		setPwmLevel,
		changeActivationMode,
	}
}
