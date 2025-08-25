import { SiteHeader } from "@/components/site-header"
import { useRoutes } from "react-router-dom"
import { TailwindIndicator } from "./components/tailwind-indicator"
import BleGUI from "./components/ble-gui"
import { useState } from "react"

function Home({ triggerModalOpen }: { triggerModalOpen: number }) {
	return (
		<section>
			<div>
				<BleGUI triggerModalOpen={triggerModalOpen} />
			</div>
		</section>
	)
}

function App() {
	const [triggerModalOpen, setTriggerModalOpen] = useState(0)

	const handleOpenClinicianSettings = () => {
		setTriggerModalOpen((prev) => prev + 1) // Trigger BleGUI to open modal
	}

	const routes = [
		{
			path: "/",
			element: <Home triggerModalOpen={triggerModalOpen} />,
		},
	]

	const children = useRoutes(routes)

	return (
		<>
			<div className="relative flex min-h-screen flex-col">
				<SiteHeader onOpenClinicianSettings={handleOpenClinicianSettings} />
				<div className="flex-1">{children}</div>
			</div>
			<TailwindIndicator />
		</>
	)
}

export default App
