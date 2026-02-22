import { cn } from "@/lib/utils";
import { Header } from "@/components/header"; // @efferd/header-2
import { HeroSection } from "@/components/hero";
import { LogosSection } from "@/components/logos-section";

import { createFileRoute } from '@tanstack/react-router'
import { FeatureSection } from "@/components/feature-section";
import { Integrations } from "@/components/integrations";
import { Footer } from "@/components/footer";

export const Route = createFileRoute('/landing')({
  component: RouteComponent,
})

function RouteComponent() {
return (
		<div className="relative flex min-h-screen flex-col overflow-hidden px-4 supports-[overflow:clip]:overflow-clip">
			<Header />
			<main
				className={cn(
					"relative mx-auto max-w-4xl grow",
					// X Borders
					"before:absolute before:-inset-y-14 before:-left-px before:w-px before:bg-border",
					"after:absolute after:-inset-y-14 after:-right-px after:w-px after:bg-border"
				)}
			>
			<div className="space-y-12">
				<HeroSection />
				<LogosSection />
				<FeatureSection />
				<Integrations />
				<Footer />
			</div>
			</main>
		</div>
	);}


