import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

interface ColoredSliderProps
	extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
	level: number
}

const ColoredSlider = React.forwardRef<
	React.ElementRef<typeof SliderPrimitive.Root>,
	ColoredSliderProps
>(({ className, level, ...props }, ref) => {
	const getTrackColor = (level: number) => {
		if (level <= 1) return "bg-green-200"
		if (level <= 3) return "bg-yellow-200"
		return "bg-red-200"
	}

	const getRangeColor = (level: number) => {
		if (level <= 1) return "bg-gradient-to-r from-green-600 to-green-400"
		if (level <= 3) return "bg-gradient-to-r from-yellow-600 to-yellow-400"
		return "bg-gradient-to-r from-red-600 to-red-400"
	}

	const getThumbColor = (level: number) => {
		if (level <= 1) return "border-green-600 bg-green-500 hover:bg-green-600"
		if (level <= 3) return "border-yellow-600 bg-yellow-500 hover:bg-yellow-600"
		return "border-red-600 bg-red-500 hover:bg-red-600"
	}

	return (
		<SliderPrimitive.Root
			ref={ref}
			className={cn(
				"relative flex w-full touch-none select-none items-center",
				className,
			)}
			{...props}
		>
			<SliderPrimitive.Track
				className={cn(
					"relative h-2 w-full grow overflow-hidden rounded-full",
					getTrackColor(level),
				)}
			>
				<SliderPrimitive.Range
					className={cn("absolute h-full", getRangeColor(level))}
				/>
			</SliderPrimitive.Track>
			<SliderPrimitive.Thumb
				className={cn(
					"block h-5 w-5 rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
					getThumbColor(level),
				)}
			/>
		</SliderPrimitive.Root>
	)
})

ColoredSlider.displayName = "ColoredSlider"

export { ColoredSlider }
