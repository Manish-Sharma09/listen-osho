<script lang="ts">
	import { afterNavigate } from '$app/navigation'
	import { onMount } from 'svelte'
	import { initPosthog, trackPageview } from '$lib/rajneesh/analytics/posthog'
	import { dismissPreloader } from '$lib/rajneesh/boot/preloader.ts'

	const { children } = $props()

	onMount(() => {
		// Runs after the whole first page has mounted, i.e. once the catalog has loaded
		dismissPreloader()
		initPosthog()
	})

	afterNavigate((nav) => {
		trackPageview(nav.to?.url?.href)

		if (import.meta.env.DEV) {
			return
		}

		window.goatcounter?.count({
			path: nav.to?.route.id ?? 'unknown',
		})
	})
</script>

{@render children()}
