import React from "react"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"

interface SMARow {
	number: string
	index: string
	middle: string
	ring: string
	little: string
	thumb: string
	palm: string
}

interface SMATableProps {
	smaData: SMARow[]
}

const getColorClass = (value: string) => {
	switch (value) {
		case "high":
			return "text-green-500"
		case "medium":
			return "text-yellow-500"
		case "low":
			return "text-red-500"
		case "disabled":
			return "text-gray-500"
		default:
			return ""
	}
}

const SMATable: React.FC<SMATableProps> = ({ smaData }) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle>SMA Data</CardTitle>
				<CardDescription>
					A list of SMA Values for Fingers and Palm Segments
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="overflow-x-auto">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{smaData.map((sma) => (
							<Card key={sma.number} className="p-4">
								<h3 className="mb-2 text-lg font-semibold">{sma.number}</h3>
								<div className="grid grid-cols-2 gap-2 text-sm">
									<span className="text-gray-400">Index:</span>
									<span className={getColorClass(sma.index)}>{sma.index}</span>
									<span className="text-gray-400">Middle:</span>
									<span className={getColorClass(sma.middle)}>
										{sma.middle}
									</span>
									<span className="text-gray-400">Ring:</span>
									<span className={getColorClass(sma.ring)}>{sma.ring}</span>
									<span className="text-gray-400">Little:</span>
									<span className={getColorClass(sma.little)}>
										{sma.little}
									</span>
									<span className="text-gray-400">Thumb:</span>
									<span className={getColorClass(sma.thumb)}>{sma.thumb}</span>
									<span className="text-gray-400">Palm:</span>
									<span className={getColorClass(sma.palm)}>{sma.palm}</span>
								</div>
							</Card>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

export default SMATable
