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
		<Card className="mb-6 bg-gray-100 p-4">
			<p className="text-lg font-semibold text-gray-700">
				Status: <span className="text-blue-600">{connectionStatus}</span>
			</p>
			<p className="text-lg font-semibold text-gray-700">
				Board Running:{" "}
				<span className={`${isRunning ? "text-green-600" : "text-red-600"}`}>
					{isRunning ? "Yes" : "No"}
				</span>
			</p>
		</Card>

		{errorMessage && (
			<div
				className="mb-6 rounded-md border-l-4 border-red-500 bg-red-100 p-4 text-red-700"
				role="alert"
			>
				<p className="font-bold">Error</p>
				<p>{errorMessage}</p>
			</div>
		)}
	</>
)

export default StatusPanel
