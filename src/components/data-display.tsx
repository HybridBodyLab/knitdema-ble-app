import React from "react"
import { CharacteristicKeys } from "../constants"
import { Card } from "./ui/card"

interface DataDisplayProps {
	receivedData: Record<CharacteristicKeys, string>
}

const DataDisplay: React.FC<DataDisplayProps> = ({ receivedData }) => (
	<>
		<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
			<Card className="bg-gray-50">
				<h2 className="mb-2 text-xl font-semibold text-gray-700">LED Value</h2>
				<div className="rounded-md border border-gray-200 bg-white p-4">
					<p className="text-2xl font-bold text-blue-600">{receivedData.led}</p>
				</div>
			</Card>

			<Card className="bg-gray-50">
				<h2 className="mb-2 text-xl font-semibold text-gray-700">
					Start Value
				</h2>
				<div className="rounded-md border border-gray-200 bg-white p-4">
					<p className="text-2xl font-bold text-blue-600">
						{receivedData.start}
					</p>
				</div>
			</Card>
		</div>

		<Card className="mt-6 bg-gray-50">
			<h2 className="mb-4 text-2xl font-semibold text-gray-700">
				Finger Values
			</h2>
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
				{["thumb", "index", "middle", "ring", "pinky"].map((key) => (
					<div
						key={key}
						className="rounded-md border border-gray-200 bg-white p-4"
					>
						<p className="mb-2 text-lg font-semibold text-gray-800">
							{key.charAt(0).toUpperCase() + key.slice(1)}
						</p>
						<p className="text-2xl font-bold text-blue-600">
							{receivedData[key as CharacteristicKeys]}
						</p>
					</div>
				))}
			</div>
		</Card>

		<Card className="mt-6 bg-gray-50">
			<h2 className="mb-2 text-2xl font-semibold text-gray-700">Palm Value</h2>
			<div className="rounded-md border border-gray-200 bg-white p-4">
				<p className="text-2xl font-bold text-blue-600">{receivedData.palm}</p>
			</div>
		</Card>
	</>
)

export default DataDisplay
