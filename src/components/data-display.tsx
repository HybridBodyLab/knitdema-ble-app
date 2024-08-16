import React from "react"
import { Card } from "./ui/card"
import { CharacteristicKeys } from "@/constants"

interface DataDisplayProps {
	receivedData: Record<CharacteristicKeys, string>
}

const DataDisplay: React.FC<DataDisplayProps> = ({ receivedData }) => (
	<>
		<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
			<Card className="bg-white dark:bg-gray-800">
				<h2 className="mb-2 text-xl font-semibold text-gray-700 dark:text-gray-300">
					LED Value
				</h2>
				<div className="rounded-md border border-gray-200 bg-gray-100 p-4 dark:border-gray-600 dark:bg-gray-700">
					<p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
						{receivedData.led}
					</p>
				</div>
			</Card>

			<Card className="bg-white dark:bg-gray-800">
				<h2 className="mb-2 text-xl font-semibold text-gray-700 dark:text-gray-300">
					Start Value
				</h2>
				<div className="rounded-md border border-gray-200 bg-gray-100 p-4 dark:border-gray-600 dark:bg-gray-700">
					<p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
						{receivedData.start}
					</p>
				</div>
			</Card>
		</div>

		<Card className="mt-6 bg-white dark:bg-gray-800">
			<h2 className="mb-4 text-2xl font-semibold text-gray-700 dark:text-gray-300">
				Finger Values
			</h2>
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
				{["thumb", "index", "middle", "ring", "pinky"].map((key) => (
					<div
						key={key}
						className="rounded-md border border-gray-200 bg-gray-100 p-4 dark:border-gray-600 dark:bg-gray-700"
					>
						<p className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-200">
							{key.charAt(0).toUpperCase() + key.slice(1)}
						</p>
						<p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
							{receivedData[key as CharacteristicKeys]}
						</p>
					</div>
				))}
			</div>
		</Card>

		<Card className="mt-6 bg-white dark:bg-gray-800">
			<h2 className="mb-2 text-2xl font-semibold text-gray-700 dark:text-gray-300">
				Palm Value
			</h2>
			<div className="rounded-md border border-gray-200 bg-gray-100 p-4 dark:border-gray-600 dark:bg-gray-700">
				<p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
					{receivedData.palm}
				</p>
			</div>
		</Card>
	</>
)

export default DataDisplay
