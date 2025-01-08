import React, { useState, useEffect, useRef } from "react"
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp"
import { Trash2, Power } from "lucide-react"
import { useLocalStorage } from "usehooks-ts"
import { formatDistance, intervalToDuration } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"
import { Card, CardContent, CardHeader } from "./ui/card"

interface ConnectionRecord {
	id: number
	connectTime: string
	disconnectTime: string | null
	boardStartTime: string | null
	boardStopTime: string | null
}

interface ConnectionHistoryProps {
	isConnected: boolean
	isRunning: boolean
}

const EST_TIMEZONE = "America/New_York"

const ConnectionHistory: React.FC<ConnectionHistoryProps> = ({
	isConnected,
	isRunning,
}) => {
	const [connections, setConnections, removeConnections] = useLocalStorage<
		ConnectionRecord[]
	>("device-connections", [])
	const [password, setPassword] = useState<string>("")
	const [selectedId, setSelectedId] = useState<number | null>(null)
	const [showDialog, setShowDialog] = useState<boolean>(false)
	const [error, setError] = useState<string>("")
	const prevConnectedRef = useRef<boolean>(isConnected)
	const prevRunningRef = useRef<boolean>(isRunning)

	useEffect(() => {
		if (prevConnectedRef.current !== isConnected) {
			if (isConnected) {
				const newConnection: ConnectionRecord = {
					id: Date.now(),
					connectTime: new Date().toISOString(),
					disconnectTime: null,
					boardStartTime: null,
					boardStopTime: null,
				}
				setConnections((prev) => [...prev, newConnection])
			} else {
				setConnections((prev) => {
					const lastConnection = prev[prev.length - 1]
					if (lastConnection && !lastConnection.disconnectTime) {
						return [
							...prev.slice(0, -1),
							{
								...lastConnection,
								disconnectTime: new Date().toISOString(),
								boardStopTime: lastConnection.boardStartTime
									? new Date().toISOString()
									: null,
							},
						]
					}
					return prev
				})
			}
			prevConnectedRef.current = isConnected
		}

		// Track board start/stop times
		if (prevRunningRef.current !== isRunning) {
			setConnections((prev) => {
				const lastConnection = prev[prev.length - 1]
				if (lastConnection) {
					if (isRunning) {
						return [
							...prev.slice(0, -1),
							{
								...lastConnection,
								boardStartTime: new Date().toISOString(),
								boardStopTime: null,
							},
						]
					} else {
						return [
							...prev.slice(0, -1),
							{
								...lastConnection,
								boardStopTime: new Date().toISOString(),
							},
						]
					}
				}
				return prev
			})
			prevRunningRef.current = isRunning
		}
	}, [isConnected, isRunning, setConnections])

	const formatDate = (dateString: string | null): string => {
		if (!dateString) return "Active"

		const date = new Date(dateString)

		const formattedDate = formatInTimeZone(
			date,
			EST_TIMEZONE,
			"MMM d, yyyy h:mm:ss a zzz",
		)

		const relativeTime = formatDistance(date, new Date(), {
			addSuffix: true,
		})

		return `${formattedDate} (${relativeTime})`
	}

	const calculateBoardRuntime = (
		startTime: string | null,
		stopTime: string | null,
	): string => {
		if (!startTime) return "Never started"
		if (!stopTime) return "Currently running"

		const start = new Date(startTime)
		const stop = new Date(stopTime)
		const duration = intervalToDuration({ start, end: stop })

		const hours = duration.hours || 0
		const minutes = duration.minutes || 0
		const seconds = duration.seconds || 0

		if (hours > 0) {
			return `${hours}h ${minutes}m ${seconds}s`
		} else if (minutes > 0) {
			return `${minutes}m ${seconds}s`
		}
		return `${seconds}s`
	}

	const handleDelete = (id: number): void => {
		setSelectedId(id)
		setShowDialog(true)
		setPassword("")
		setError("")
	}

	const confirmDelete = (): void => {
		if (password === "1234") {
			setConnections(connections.filter((conn) => conn.id !== selectedId))
			setShowDialog(false)
			setPassword("")
			setError("")
		} else {
			setError("Incorrect password")
		}
	}

	const handleClearAll = (): void => {
		removeConnections()
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<h2 className="text-xl font-semibold text-white">Usage</h2>
					{connections.length > 0 && (
						<Button
							variant="destructive"
							size="sm"
							onClick={handleClearAll}
							className="text-sm"
						>
							Clear
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent>
				<div className="mt-6 space-y-4">
					<div className="space-y-2">
						{connections.map((conn) => (
							<div
								key={conn.id}
								className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3"
							>
								<div className="flex-1 space-y-1">
									<div className="text-sm text-gray-300">
										Connected: {formatDate(conn.connectTime)}
									</div>
									<div className="text-sm text-gray-300">
										Disconnected: {formatDate(conn.disconnectTime)}
									</div>
									{conn.boardStartTime && (
										<div className="mt-2 space-y-1">
											<div className="flex items-center gap-2 text-sm">
												<Power className="size-4 text-green-500" />
												<span className="text-gray-300">
													Started: {formatDate(conn.boardStartTime)}
												</span>
											</div>
											<div className="flex items-center gap-2 text-sm">
												<Power className="size-4 text-red-500" />
												<span className="text-gray-300">
													Stopped: {formatDate(conn.boardStopTime)}
												</span>
											</div>
											<div className="flex items-center gap-2 text-sm">
												<Power className="size-4 text-blue-500" />
												<span className="text-gray-300">
													Total active time:{" "}
													{calculateBoardRuntime(
														conn.boardStartTime,
														conn.boardStopTime,
													)}
												</span>
											</div>
										</div>
									)}
								</div>
								<Button
									variant="ghost"
									size="icon"
									className="text-red-500 hover:text-red-400"
									onClick={() => handleDelete(conn.id)}
								>
									<Trash2 className="size-4" />
								</Button>
							</div>
						))}

						{connections.length === 0 && (
							<div className="text-center text-gray-400">
								No connection history available
							</div>
						)}
					</div>

					<AlertDialog open={showDialog} onOpenChange={setShowDialog}>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Delete Connection Record</AlertDialogTitle>
								<AlertDialogDescription>
									Enter 4-digit password to delete this record
								</AlertDialogDescription>
							</AlertDialogHeader>
							<div className="space-y-4">
								<div className="flex justify-center">
									<InputOTP
										maxLength={4}
										value={password}
										onChange={(value) => setPassword(value)}
									>
										<InputOTPGroup>
											<InputOTPSlot index={0} />
											<InputOTPSlot index={1} />
											<InputOTPSlot index={2} />
											<InputOTPSlot index={3} />
										</InputOTPGroup>
									</InputOTP>
								</div>
								{error && (
									<p className="text-center text-sm text-red-500">{error}</p>
								)}
							</div>
							<AlertDialogFooter>
								<AlertDialogCancel onClick={() => setShowDialog(false)}>
									Cancel
								</AlertDialogCancel>
								<Button
									onClick={confirmDelete}
									className="bg-red-600 hover:bg-red-700"
								>
									Delete
								</Button>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</CardContent>
		</Card>
	)
}

export default ConnectionHistory
