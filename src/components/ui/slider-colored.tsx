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
		if (level <= 1) return "bg-emerald-100 dark:bg-emerald-950/40"
		if (level <= 3) return "bg-amber-100 dark:bg-amber-950/40"
		return "bg-rose-100 dark:bg-rose-950/40"
	}

	const getRangeColor = (level: number) => {
		if (level <= 1) return "bg-emerald-600 dark:bg-emerald-500"
		if (level <= 3) return "bg-amber-600 dark:bg-amber-500"
		return "bg-rose-600 dark:bg-rose-500"
	}

	const getThumbColor = (level: number) => {
		if (level <= 1) {
			return "border-emerald-600 bg-emerald-500 hover:bg-emerald-600 dark:border-emerald-400 dark:bg-emerald-500 dark:hover:bg-emerald-400"
		}
		if (level <= 3) {
			return "border-amber-600 bg-amber-500 hover:bg-amber-600 dark:border-amber-400 dark:bg-amber-500 dark:hover:bg-amber-400"
		}
		return "border-rose-600 bg-rose-500 hover:bg-rose-600 dark:border-rose-400 dark:bg-rose-500 dark:hover:bg-rose-400"
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
