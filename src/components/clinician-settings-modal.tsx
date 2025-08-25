import React, { useState } from "react"
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp"
import { X } from "lucide-react"
import { Label } from "@/components/ui/label"
import { ColoredSlider } from "./ui/slider-colored"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select"
import { ActivationModeSelector } from "./activation-mode-selector"
import { SESSION_DURATION_OPTIONS } from "@/lib/constants"
import { CharacteristicKeys } from "@/constants"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ClinicianSettingsModalProps {
	isOpen: boolean
	onClose: () => void
	// Connection State
	isConnected: boolean
	// Session Duration
	sessionDuration: string
	onSessionDurationChange: (value: string) => void
	isRunning: boolean
	// Compression Patterns
	activationMode: number
	onActivationModeChange: (mode: number) => Promise<boolean>
	// Compression Levels
	pwmLevels: Record<string, number>
	onPwmLevelChange: (key: CharacteristicKeys, value: number[]) => Promise<void>
}

const ClinicianSettingsModal: React.FC<ClinicianSettingsModalProps> = ({
	isOpen,
	onClose,
	isConnected,
	sessionDuration,
	onSessionDurationChange,
	isRunning,
	activationMode,
	onActivationModeChange,
	pwmLevels,
	onPwmLevelChange,
}) => {
	const [password, setPassword] = useState<string>("")
	const [error, setError] = useState<string>("")
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

	const handlePasswordSubmit = () => {
		if (password === "1111") {
			setIsAuthenticated(true)
			setError("")
		} else {
			setError("Incorrect password")
		}
	}

	const handleClose = () => {
		setPassword("")
		setError("")
		setIsAuthenticated(false)
		onClose()
	}

	const handleSaveAndClose = () => {
		handleClose()
	}

	return (
		<AlertDialog open={isOpen} onOpenChange={handleClose}>
			<AlertDialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
				{/* Close button - top right */}
				<Button
					variant="ghost"
					size="icon"
					className="absolute right-4 top-4 size-6 opacity-70 hover:opacity-100"
					onClick={handleClose}
				>
					<X className="size-4" />
				</Button>

				{!isAuthenticated ? (
					// Password Authentication Screen
					<>
						<AlertDialogHeader>
							<AlertDialogTitle>Clinician Settings</AlertDialogTitle>
							<AlertDialogDescription>
								Enter the 4-digit clinician password to access therapy settings
							</AlertDialogDescription>
						</AlertDialogHeader>
						<div className="space-y-4">
							<div className="flex justify-center">
								<InputOTP
									maxLength={4}
									value={password}
									onChange={(value) => setPassword(value)}
								>
									<InputOTPGroup>
										<InputOTPSlot index={0} />
										<InputOTPSlot index={1} />
										<InputOTPSlot index={2} />
										<InputOTPSlot index={3} />
									</InputOTPGroup>
								</InputOTP>
							</div>
							{error && (
								<p className="text-center text-sm text-destructive">{error}</p>
							)}
						</div>
						<AlertDialogFooter>
							<AlertDialogCancel onClick={handleClose}>
								Cancel
							</AlertDialogCancel>
							<Button onClick={handlePasswordSubmit}>Access Settings</Button>
						</AlertDialogFooter>
					</>
				) : (
					// Settings Configuration Screen
					<>
						<AlertDialogHeader>
							<AlertDialogTitle>Clinician Settings</AlertDialogTitle>
							<AlertDialogDescription>
								Configure therapy parameters for the patient
								{!isConnected && (
									<span className="mt-1 block text-amber-600 dark:text-amber-400">
										⚠️ Not connected - settings will be applied when board
										connects
									</span>
								)}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<div className="space-y-6">
							{/* Session Duration */}
							<div className="rounded-lg bg-muted/50 p-4">
								<h3 className="mb-4 text-lg font-medium">Session Duration</h3>
								<div className="flex items-center space-x-2">
									<Label
										htmlFor="clinician-session-duration"
										className="whitespace-nowrap text-sm font-medium"
									>
										Duration:
									</Label>
									<Select
										value={sessionDuration}
										onValueChange={onSessionDurationChange}
										disabled={isConnected && isRunning}
									>
										<SelectTrigger
											id="clinician-session-duration"
											className="w-full"
										>
											<SelectValue placeholder="Select duration" />
										</SelectTrigger>
										<SelectContent>
											{SESSION_DURATION_OPTIONS.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								{isConnected && isRunning && (
									<p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
										⚠️ Cannot change duration while therapy is active
									</p>
								)}
							</div>

							{/* Compression Pattern */}
							<div className="rounded-lg bg-muted/50 p-4">
								<ActivationModeSelector
									value={activationMode}
									onChange={onActivationModeChange}
									disabled={isConnected && isRunning}
								/>
								{isConnected && isRunning && (
									<p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
										⚠️ Cannot change pattern while therapy is active
									</p>
								)}
							</div>

							{/* Compression Levels */}
							<div className="rounded-lg bg-muted/50 p-4">
								<h3 className="mb-4 text-lg font-medium">Compression Levels</h3>
								<Tabs defaultValue="thumb" className="w-full">
									<TabsList className="grid w-full grid-cols-6">
										<TabsTrigger value="thumb">Thumb</TabsTrigger>
										<TabsTrigger value="index">Index</TabsTrigger>
										<TabsTrigger value="middle">Middle</TabsTrigger>
										<TabsTrigger value="ring">Ring</TabsTrigger>
										<TabsTrigger value="pinky">Pinky</TabsTrigger>
										<TabsTrigger value="palm">Palm</TabsTrigger>
									</TabsList>

									{(
										[
											"thumb",
											"index",
											"middle",
											"ring",
											"pinky",
											"palm",
										] as CharacteristicKeys[]
									).map((key) => (
										<TabsContent key={key} value={key} className="space-y-4">
											<div className="space-y-2">
												<div className="flex items-center justify-between">
													<Label htmlFor={`clinician-${key}-level`}>
														Compression Level: {pwmLevels[key]}
													</Label>
													<span className="text-sm text-muted-foreground">
														(0-5)
													</span>
												</div>
												<ColoredSlider
													id={`clinician-${key}-level`}
													min={0}
													max={5}
													step={1}
													value={[pwmLevels[key]]}
													onValueChange={(value) =>
														onPwmLevelChange(key, value)
													}
													level={pwmLevels[key]}
													className="w-full"
												/>
												<div className="flex justify-between text-xs text-muted-foreground">
													<span className="text-emerald-600 dark:text-emerald-500">
														Low
													</span>
													<span className="text-amber-600 dark:text-amber-500">
														Medium
													</span>
													<span className="text-rose-600 dark:text-rose-500">
														High
													</span>
												</div>
											</div>
										</TabsContent>
									))}
								</Tabs>
							</div>
						</div>
						<AlertDialogFooter>
							<Button onClick={handleSaveAndClose} className="w-full">
								Save Settings
							</Button>
						</AlertDialogFooter>
					</>
				)}
			</AlertDialogContent>
		</AlertDialog>
	)
}

export default ClinicianSettingsModal
