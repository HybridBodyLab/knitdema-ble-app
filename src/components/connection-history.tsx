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
import { Trash2, Power, Download } from "lucide-react"
import { useLocalStorage } from "usehooks-ts"
import { formatDistance, intervalToDuration } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"
import { Card, CardContent, CardHeader } from "./ui/card"
import { Separator } from "@/components/ui/separator"
import * as XLSX from "xlsx"

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
								// Don't update boardStopTime on disconnect
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

	const [action, setAction] = useState<"delete" | "clear" | "download" | null>(
		null,
	)

	const handleClearAllClick = (): void => {
		setShowDialog(true)
		setPassword("")
		setError("")
		setSelectedId(null)
		setAction("clear")
	}

	const handleDelete = (id: number): void => {
		setSelectedId(id)
		setShowDialog(true)
		setPassword("")
		setError("")
		setAction("delete")
	}

	const handleDownload = (): void => {
		setShowDialog(true)
		setPassword("")
		setError("")
		setAction("download")
	}

	const downloadExcel = () => {
		const data = connections.map((conn) => ({
			"Connection Time": formatDate(conn.connectTime),
			"Disconnection Time": formatDate(conn.disconnectTime),
			"Board Start Time": formatDate(conn.boardStartTime),
			"Board Stop Time": formatDate(conn.boardStopTime),
			"Total Active Time": calculateBoardRuntime(
				conn.boardStartTime,
				conn.boardStopTime,
			),
		}))

		const ws = XLSX.utils.json_to_sheet(data)
		const wb = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(wb, ws, "Usage History")

		// Generate file name with current date
		const fileName = `usage_history_${new Date().toISOString().split("T")[0]}.xlsx`
		XLSX.writeFile(wb, fileName)
	}

	const confirmAction = (): void => {
		if (password === "1234") {
			if (action === "clear") {
				removeConnections()
			} else if (action === "delete" && selectedId !== null) {
				setConnections(connections.filter((conn) => conn.id !== selectedId))
			} else if (action === "download") {
				downloadExcel()
			}
			setShowDialog(false)
			setPassword("")
			setError("")
		} else {
			setError("Incorrect password")
		}
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<h2 className="text-xl font-semibold text-white">Usage</h2>
					<div className="flex gap-2">
						{connections.length > 0 && (
							<>
								<Button
									variant="outline"
									size="sm"
									onClick={handleDownload}
									className="text-sm"
								>
									<Download size={16} className="mr-2" />
									Export
								</Button>
								<Button
									variant="destructive"
									size="sm"
									onClick={handleClearAllClick}
									className="text-sm"
								>
									Clear
								</Button>
							</>
						)}
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
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
										<>
											<Separator className="my-2 bg-gray-700" />
											<div className="space-y-2">
												<div className="flex items-center gap-2 text-sm">
													<Power size={16} className="text-green-500" />
													<span className="text-gray-300">
														Started: {formatDate(conn.boardStartTime)}
													</span>
												</div>
												<div className="flex items-center gap-2 text-sm">
													<Power size={16} className="text-red-500" />
													<span className="text-gray-300">
														Stopped: {formatDate(conn.boardStopTime)}
													</span>
												</div>
												<Separator className="my-2 bg-gray-700" />
												<div className="flex items-center gap-2 text-sm">
													<Power size={16} className="text-blue-500" />
													<span className="text-gray-300">
														Total active time:{" "}
														{calculateBoardRuntime(
															conn.boardStartTime,
															conn.boardStopTime,
														)}
													</span>
												</div>
											</div>
										</>
									)}
								</div>
								<Button
									variant="ghost"
									size="icon"
									className="text-red-500 hover:text-red-400"
									onClick={() => handleDelete(conn.id)}
								>
									<Trash2 size={16} />
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
								<AlertDialogTitle>
									{selectedId === null
										? "Clear All History"
										: "Delete Connection Record"}
								</AlertDialogTitle>
								<AlertDialogDescription>
									Enter 4-digit password to{" "}
									{selectedId === null
										? "clear all history"
										: "delete this record"}
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
									onClick={confirmAction}
									className="bg-red-600 hover:bg-red-700"
								>
									{action === "clear"
										? "Clear All"
										: action === "delete"
											? "Delete"
											: "Download"}
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
