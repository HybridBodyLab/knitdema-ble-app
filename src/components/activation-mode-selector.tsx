// src/components/activation-mode-selector.tsx
import React from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { InfoIcon } from "lucide-react"

interface ActivationModeSelectorProps {
	value: number
	onChange: (value: number) => Promise<boolean>
	disabled?: boolean
}

const modes = [
	{
		value: 0,
		label: "Single",
		tooltip: "Activates one SMA at a time",
	},
	{
		value: 1,
		label: "Dual",
		tooltip: "Activates two SMAs at a time",
	},
	{
		value: 2,
		label: "Triple",
		tooltip: "Activates three SMAs at a time",
	},
]

export const ActivationModeSelector: React.FC<ActivationModeSelectorProps> = ({
	value,
	onChange,
	disabled = false,
}) => {
	const handleValueChange = (selectedValue: string) => {
		onChange(parseInt(selectedValue))
	}

	return (
		<Card className="w-full">
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<CardTitle className="text-base">Activation Pattern</CardTitle>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<InfoIcon className="h-4 w-4 cursor-help text-muted-foreground" />
							</TooltipTrigger>
							<TooltipContent side="right" className="max-w-xs">
								Controls how many SMAs are activated simultaneously
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			</CardHeader>
			<CardContent>
				<RadioGroup
					value={value.toString()}
					onValueChange={handleValueChange}
					disabled={disabled}
					className="flex items-center justify-between gap-4"
				>
					{modes.map((mode) => (
						<div key={mode.value} className="flex items-center gap-2">
							<RadioGroupItem
								value={mode.value.toString()}
								id={`mode-${mode.value}`}
								disabled={disabled}
							/>
							<div className="flex items-center">
								<Label
									htmlFor={`mode-${mode.value}`}
									className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
								>
									{mode.label}
								</Label>
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<InfoIcon className="ml-1 h-3 w-3 cursor-help text-muted-foreground" />
										</TooltipTrigger>
										<TooltipContent side="top" className="max-w-xs">
											{mode.tooltip}
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</div>
						</div>
					))}
				</RadioGroup>
			</CardContent>
		</Card>
	)
}
