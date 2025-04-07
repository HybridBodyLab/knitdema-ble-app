import React from "react"
import { Card } from "./ui/card"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"

interface StatusPanelProps {
	connectionStatus: string
	isRunning: boolean
	errorMessage: string | null
}

const StatusPanel: React.FC<StatusPanelProps> = ({
	connectionStatus,
	isRunning,
	errorMessage,
}) => (
	<Card className="mb-4 p-3 text-sm">
		<div className="flex items-center justify-between">
			<span>
				Status:{" "}
				<span className="font-medium text-primary">{connectionStatus}</span>
			</span>
			<span className="flex items-center">
				{isRunning ? (
					<CheckCircle className="mr-1 size-4 text-emerald-600 dark:text-emerald-500" />
				) : (
					<XCircle className="mr-1 size-4 text-rose-600 dark:text-rose-500" />
				)}
				{isRunning ? "Running" : "Stopped"}
			</span>
		</div>
		{errorMessage && (
			<div className="mt-2 flex items-center text-destructive">
				<AlertTriangle className="mr-1 h-4 w-4" />
				<span>{errorMessage}</span>
			</div>
		)}
	</Card>
)

export default StatusPanel
