import { cn } from "@/lib/utils";
import { DecorIcon } from "@/components/ui/decor-icon";
import { FullWidthDivider } from "@/components/ui/full-width-divider";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02Icon, Call02Icon } from "@hugeicons/core-free-icons";
import { Dithering, GrainGradient, MeshGradient,  } from '@paper-design/shaders-react';


export function HeroSection() {
	return (
		<section>
			<div className="relative flex flex-col items-center justify-center gap-5 px-4 py-12 md:px-4 md:py-24 lg:py-28">
				{/* X Faded Borders & Shades */}
				<div
					aria-hidden="true"
					className="absolute inset-0 -z-1 size-full overflow-hidden"
				>
<Dithering
  width={1280}
  height={720}
  colorBack="#000000"
  colorFront="#00b3ff"
  shape="sphere"
  type="4x4"
  size={2}
  speed={1}
  scale={0.6}
/>
					<div
						className={cn(
							"absolute -inset-x-20 inset-y-0 z-0 rounded-full",
							"bg-[radial-gradient(ellipse_at_center,theme(--color-foreground/.1),transparent,transparent)]",
							"blur-[50px]"
						)}
					/>
					<div className="absolute inset-y-0 left-4 w-px bg-linear-to-b from-transparent via-border to-border md:left-8" />
					<div className="absolute inset-y-0 right-4 w-px bg-linear-to-b from-transparent via-border to-border md:right-8" />
					<div className="absolute inset-y-0 left-8 w-px bg-linear-to-b from-transparent via-border/50 to-border/50 md:left-12" />
					<div className="absolute inset-y-0 right-8 w-px bg-linear-to-b from-transparent via-border/50 to-border/50 md:right-12" />
				</div>
				<a
					className={cn(
						"group mx-auto flex w-fit items-center gap-3 rounded-sm border bg-card p-1 shadow",
						"fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards transition-all delay-500 duration-500 ease-out"
					)}
					href="#link"
				>
					<div className="rounded-xs border bg-card px-1.5 py-0.5 shadow-sm">
						<p className="font-mono text-xs">NOW</p>
					</div>

					<span className="text-xs">accepting new client projects</span>
					<span className="block h-5 border-l" />

					<div className="pr-1">
						<HugeiconsIcon icon={ArrowRight02Icon} strokeWidth={2} className="size-3 -translate-x-0.5 duration-150 ease-out group-hover:translate-x-0.5" />
					</div>
				</a>

				<h1
					className={cn(
						"max-w-2xl text-balance text-center text-3xl text-foreground md:text-5xl lg:text-6xl",
						"fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-100 duration-500 ease-out"
					)}
				>
					Building Digital Experiences That Drive Growth
				</h1>

				<p
					className={cn(
						"text-center text-muted-foreground text-sm tracking-wider sm:text-lg",
						"fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-200 duration-500 ease-out"
					)}
				>
					We help brands scale faster through design, <br /> development and
					strategic execution.
				</p>

				<div className="fade-in slide-in-from-bottom-10 flex w-fit animate-in items-center justify-center gap-3 fill-mode-backwards pt-2 delay-300 duration-500 ease-out">
					<Button variant="outline">
						<HugeiconsIcon icon={Call02Icon} strokeWidth={2} data-icon="inline-start" />{" "}
						Book a Call
					</Button>
					<Button>
						Get started{" "}
						<HugeiconsIcon icon={ArrowRight02Icon} strokeWidth={2} data-icon="inline-end" />
					</Button>
				</div>
			</div>
			<div className="relative">
				<DecorIcon className="size-4" position="top-left" />
				<DecorIcon className="size-4" position="top-right" />
				<DecorIcon className="size-4" position="bottom-left" />
				<DecorIcon className="size-4" position="bottom-right" />

				<FullWidthDivider className="-top-px" />
				<div className="overflow-hidden *:pointer-events-none *:aspect-video *:select-none">
					<img
						alt="light app screen"
						className="dark:hidden"
						height="auto"
						src="https://storage.efferd.com/screen/dashboard-light.webp"
						width="auto"
					/>
					<img
						alt="dark app screen"
						className="hidden dark:block"
						height="auto"
						src="https://storage.efferd.com/screen/dashboard-dark.webp"
						width="auto"
					/>
				</div>
				<FullWidthDivider className="-bottom-px" />
			</div>
		</section>
	);
}
