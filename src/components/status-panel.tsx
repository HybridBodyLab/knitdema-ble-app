import React from "react"
import { Card } from "./ui/card"

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
	<>
		<Card className="mb-6 bg-white p-4 dark:bg-gray-800">
			<p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
				Status:{" "}
				<span className="text-blue-600 dark:text-blue-400">
					{connectionStatus}
				</span>
			</p>
			<p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
				Board Running:{" "}
				<span
					className={`${isRunning ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
				>
					{isRunning ? "Yes" : "No"}
				</span>
			</p>
		</Card>

		{errorMessage && (
			<div
				className="mb-6 rounded-md border-l-4 border-red-500 bg-red-100 p-4 text-red-700 dark:bg-red-900 dark:text-red-300"
				role="alert"
			>
				<p className="font-bold">Error</p>
				<p>{errorMessage}</p>
			</div>
		)}
	</>
)

export default StatusPanel
