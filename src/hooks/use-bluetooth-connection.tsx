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
	const [isMockMode, setIsMockMode] = useState(false)
	const [activationMode, setActivationMode] = useLocalStorage<number>(
		"activation-mode",
		0,
	)
	const characteristicsRef = useRef<Record<
		CharacteristicKeys,
		BluetoothRemoteGATTCharacteristic
	> | null>(null)
	const deviceRef = useRef<BluetoothDevice | null>(null)
	const mockDataRef = useRef<Record<CharacteristicKeys, string>>({
		led: "0",
		start: "0",
		thumb: "000000",
		index: "000000",
		middle: "000000",
		ring: "000000",
		pinky: "000000",
		palm: "0000000",
	})
	const mockSimulationRef = useRef<NodeJS.Timeout | null>(null)

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

	// Mock simulation functions
	const startMockSimulation = useCallback(() => {
		let step = 0
		const fingerSequence = ["thumb", "index", "middle", "ring", "pinky"]

		mockSimulationRef.current = setInterval(() => {
			// Reset all to inactive
			mockDataRef.current.thumb = "000000"
			mockDataRef.current.index = "000000"
			mockDataRef.current.middle = "000000"
			mockDataRef.current.ring = "000000"
			mockDataRef.current.pinky = "000000"
			mockDataRef.current.palm = "0000000"

			if (step < 6) {
				// Finger phases (6 steps for each finger)
				const fingerState = "000000".split("")
				fingerState[step] = "1"
				const activeFingerState = fingerState.join("")

				// Activate all fingers for the current step
				fingerSequence.forEach((finger) => {
					mockDataRef.current[finger as CharacteristicKeys] = activeFingerState
				})
			} else if (step < 13) {
				// Palm phases (7 steps)
				const palmIndex = step - 6
				const palmState = "0000000".split("")
				palmState[palmIndex] = "1"
				mockDataRef.current.palm = palmState.join("")
			}

			step = (step + 1) % 13 // Reset after 13 steps to cycle continuously
		}, 3000) // 3 seconds per step (reduced from 5 seconds for demo purposes)
	}, [])

	const stopMockSimulation = useCallback(() => {
		if (mockSimulationRef.current) {
			clearInterval(mockSimulationRef.current)
			mockSimulationRef.current = null
		}
	}, [])

	// Function to set the activation mode on the board
	const setActivationModeOnBoard = useCallback(
		async (mode: number) => {
			if (mode < 0 || mode > 2) {
				setErrorMessage("Activation mode must be between 0 and 2")
				return false
			}

			if (isMockMode) {
				mockDataRef.current.led = mode.toString()
				setConnectionStatus(`Mock: Activation mode set to ${mode}`)
				return true
			}

			if (!characteristicsRef.current || !isConnected) {
				setConnectionStatus(
					`Activation mode configured (will apply when board connects)`,
				)
				return true // Return true to indicate localStorage update succeeded
			}

			try {
				const encoder = new TextEncoder()
				const value = encoder.encode(mode.toString())
				await characteristicsRef.current.led.writeValue(value)

				setConnectionStatus(`Activation mode set to ${mode}`)
				return true
			} catch (error) {
				setErrorMessage(
					`Hardware update failed, but setting saved: ${(error as Error).message}`,
				)
				return true // Return true because localStorage was already updated
			}
		},
		[isMockMode, isConnected],
	)

	// Function to update the activation mode
	const changeActivationMode = useCallback(
		async (mode: number) => {
			console.log(`Changing activation mode to ${mode}`)

			// ALWAYS update localStorage first (app configuration)
			console.log(`Updating localStorage activation mode to ${mode}`)
			setActivationMode(mode)

			// Then try to send to hardware if connected
			const result = await setActivationModeOnBoard(mode)
			console.log(`setActivationModeOnBoard result:`, result)

			// Always return true because localStorage was updated successfully
			return true
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
			setIsMockMode(false)
			setErrorMessage(null)
			setConnectionStatus("Connected. Click 'Start' to begin.")
		} catch (error) {
			setErrorMessage(`Error - ${(error as Error).message}`)
			setConnectionStatus("Connection failed")
		}
	}

	const mockConnect = async () => {
		try {
			setConnectionStatus("Initializing Mock Connection...")
			await new Promise((resolve) => setTimeout(resolve, 500))

			setConnectionStatus("Mock: Getting Service...")
			await new Promise((resolve) => setTimeout(resolve, 300))

			setConnectionStatus("Mock: Getting Characteristics...")
			await new Promise((resolve) => setTimeout(resolve, 300))

			// Reset mock data to initial state
			mockDataRef.current = {
				led: activationMode.toString(),
				start: "0",
				thumb: "000000",
				index: "000000",
				middle: "000000",
				ring: "000000",
				pinky: "000000",
				palm: "0000000",
			}

			setIsConnected(true)
			setIsMockMode(true)
			setErrorMessage(null)
			setConnectionStatus("Mock Connected. Click 'Start' to begin.")
		} catch (error) {
			setErrorMessage(`Mock Error - ${(error as Error).message}`)
			setConnectionStatus("Mock connection failed")
		}
	}

	const readCharacteristic = useCallback(
		async (key: CharacteristicKeys) => {
			if (isMockMode) {
				// Return mock data with small delay to simulate real BLE
				await new Promise((resolve) => setTimeout(resolve, 10))
				return mockDataRef.current[key]
			}

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
		},
		[isMockMode],
	)

	const readAllCharacteristics = useCallback(async () => {
		if (isMockMode) {
			const results: Partial<Record<CharacteristicKeys, string>> = {}
			for (const key of Object.keys(
				CHARACTERISTIC_UUIDS,
			) as CharacteristicKeys[]) {
				if (key !== "led" && key !== "start") {
					results[key] = mockDataRef.current[key]
				}
			}
			return results
		}

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
	}, [isMockMode, readCharacteristic])

	const startBoard = useCallback(async () => {
		if (isMockMode) {
			mockDataRef.current.start = "1"
			setIsRunning(true)
			setConnectionStatus("Mock Board started")
			// Start mock simulation
			startMockSimulation()
			return
		}

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
	}, [isMockMode, startMockSimulation])

	const stopBoard = useCallback(async () => {
		if (isMockMode) {
			mockDataRef.current.start = "0"
			// Reset all mock data to inactive state
			mockDataRef.current.thumb = "000000"
			mockDataRef.current.index = "000000"
			mockDataRef.current.middle = "000000"
			mockDataRef.current.ring = "000000"
			mockDataRef.current.pinky = "000000"
			mockDataRef.current.palm = "0000000"

			setIsRunning(false)
			setConnectionStatus("Mock Board stopped")
			stopMockSimulation()

			return await readAllCharacteristics()
		}

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
	}, [readAllCharacteristics, isMockMode, stopMockSimulation])

	// Add setPwmLevel function
	const setPwmLevel = useCallback(
		async (key: CharacteristicKeys, level: number) => {
			console.log(`setPwmLevel called with key: ${key}, level: ${level}`)

			if (level < 0 || level > 5) {
				console.log(`Invalid level: ${level}`)
				setErrorMessage("PWM level must be between 0 and 5")
				return false
			}

			// ALWAYS update localStorage first (app configuration)
			console.log(`Updating localStorage for ${key} to ${level}`)
			setPwmLevels((prev) => ({
				...prev,
				[key]: level,
			}))

			// Then try to send to hardware if connected
			if (isMockMode) {
				console.log(`Mock mode: PWM level configured`)
				setConnectionStatus(
					`Mock: ${key.charAt(0).toUpperCase() + key.slice(1)} PWM level set to ${level}`,
				)
				console.log(`Mock PWM level update successful`)
				return true
			}

			if (!characteristicsRef.current || !isConnected) {
				console.log(
					`Not connected to board - settings saved for when board connects`,
				)
				setConnectionStatus(
					`${key.charAt(0).toUpperCase() + key.slice(1)} PWM level configured (will apply when board connects)`,
				)
				return true // Success because localStorage was updated
			}

			try {
				console.log(`Sending PWM level to connected hardware`)
				const encoder = new TextEncoder()
				const value = encoder.encode(level.toString())
				await characteristicsRef.current[key].writeValue(value)

				setConnectionStatus(
					`${key.charAt(0).toUpperCase() + key.slice(1)} PWM level set to ${level}`,
				)
				console.log(`Hardware PWM level update successful`)
				return true
			} catch (error) {
				console.log(`Hardware write failed, but localStorage succeeded:`, error)
				setErrorMessage(
					`Hardware update failed, but setting saved: ${(error as Error).message}`,
				)
				return true // Still success because localStorage was updated
			}
		},
		[setPwmLevels, isMockMode, isConnected],
	)

	const disconnectBle = async () => {
		let finalReadings = null
		if (isRunning) {
			finalReadings = await stopBoard()
		} else if (isConnected) {
			finalReadings = await readAllCharacteristics()
		}

		// Clean up mock simulation if running
		stopMockSimulation()

		if (isMockMode) {
			setIsConnected(false)
			setIsMockMode(false)
			setIsRunning(false)
			setConnectionStatus("Mock Disconnected")
			return finalReadings
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
	}
}
