<script lang="ts">
	import Button from '$lib/components/Button.svelte'
	import { isMobile } from '$lib/helpers/utils/ua.ts'

	interface Props {
		class?: ClassValue
	}

	const { class: className }: Props = $props()

	const main = useMainStore()
	const isHandHeldDevice = isMobile()

	const installEvent = $derived(main.appInstallPromptEvent)
	const isInstalled = $derived(main.isAppInstalled)

	const onInstallClick = async () => {
		if (!installEvent) {
			return
		}

		await installEvent.prompt()

		window.goatcounter?.count({
			path: 'click-home-install-app',
			title: 'Clicked home install app',
			event: true,
		})
	}
</script>

{#if installEvent && !isInstalled}
	<section
		class={[
			'surface-card mx-auto flex w-full flex-col gap-2 rounded-xl p-5',
			className,
		]}
	>
		<div class="flex items-center gap-2 text-title-md">
			<span class="size-2 rounded-full bg-sky" aria-hidden="true"></span>
			{m.settingsInstallAppTitle()}
		</div>
		<div class="flex w-full flex-col items-center justify-between gap-3 sm:flex-row">
			<div class="text-body-md text-onSurfaceVariant">
				{m.settingsInstallAppExplanation({
					device: isHandHeldDevice ? m.settingsInstallAppHomeScreen() : m.settingsInstallAppDesktop(),
				})}
			</div>

			<Button class="w-full shrink-0 sm:w-35" onclick={onInstallClick}>
				{m.settingsInstallAppHomeAction()}
			</Button>
		</div>
	</section>
{/if}
