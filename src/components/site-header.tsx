import { MainNav } from "@/components/main-nav"
import { ModeToggle } from "@/components/mode-toggle"
import { siteConfig } from "@/config/site"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
interface SiteHeaderProps {
	onOpenClinicianSettings: () => void
}

export function SiteHeader({ onOpenClinicianSettings }: SiteHeaderProps) {
	return (
		<header className="sticky top-0 z-40 w-full border-b bg-background">
			<div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
				<MainNav items={siteConfig.mainNav} />
				<div className="flex flex-1 items-center justify-end space-x-4">
					<nav className="flex items-center space-x-1">
						<Button
							onClick={onOpenClinicianSettings}
							variant="ghost"
							size="icon"
							className="size-9"
							title="Clinician Settings"
						>
							<Settings className="size-4" />
						</Button>
						<ModeToggle />
					</nav>
				</div>
			</div>
		</header>
	)
}
