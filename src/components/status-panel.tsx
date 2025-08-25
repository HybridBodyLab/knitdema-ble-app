import React from "react"
import { Card } from "./ui/card"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"

interface StatusPanelProps {
	connectionStatus: string
	isRunning: boolean
	errorMessage: string | null
	isMockMode?: boolean
}

const StatusPanel: React.FC<StatusPanelProps> = ({
	connectionStatus,
	isRunning,
	errorMessage,
	isMockMode = false,
}) => (
	<Card className="mb-4 p-3 text-sm">
		<div className="flex items-center justify-between">
			<div className="flex items-center space-x-2">
				<span>
					Status:{" "}
					<span className="font-medium text-primary">{connectionStatus}</span>
				</span>
				{isMockMode && (
					<span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
						MOCK
					</span>
				)}
			</div>
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
				<AlertTriangle className="mr-1 size-4" />
				<span>{errorMessage}</span>
			</div>
		)}
	</Card>
)

export default StatusPanel
