import { SiteHeader } from "@/components/site-header"
import { useRoutes } from "react-router-dom"
import { TailwindIndicator } from "./components/tailwind-indicator"
import BleGUI from "./components/ble-gui"

const routes = [{ path: "/", element: <Home /> }]

function Home() {
	return (
		<section>
			<div>
				<BleGUI />
			</div>
		</section>
	)
}

function App() {
	const children = useRoutes(routes)

	return (
		<>
			<div className="relative flex min-h-screen flex-col">
				<SiteHeader />
				<div className="flex-1">{children}</div>
			</div>
			<TailwindIndicator />
		</>
	)
}

export default App
