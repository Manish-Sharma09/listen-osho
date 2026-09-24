<script module lang="ts">
	import { ripple } from '../attachments/ripple.ts'
	import { tooltip } from '../attachments/tooltip.ts'

	export type AllowedButtonElement = 'button' | 'a'
	export type ButtonKind = 'filled' | 'toned' | 'outlined' | 'flat' | 'blank'

	export type ButtonHref<As extends AllowedButtonElement> = As extends 'a' ? string : never

	export interface ButtonProps<As extends AllowedButtonElement> {
		as?: As
		kind?: ButtonKind
		type?: 'button' | 'submit' | 'reset'
		target?: string
		disabled?: boolean
		href?: ButtonHref<As>
		class?: ClassValue
		tabindex?: number
		ariaLabel?: string
		tooltip?: string
		children?: Snippet
		onclick?: (event: MouseEvent) => void
	}
</script>

<script lang="ts" generics="As extends AllowedButtonElement = 'button'">
	const {
		as = 'button' as As,
		kind = 'filled',
		disabled = false,
		// svelte-ignore state_referenced_locally possible false positive?
		href = (as === 'a' ? '' : undefined) as ButtonHref<As>,
		type = 'button',
		children,
		ariaLabel,
		tooltip: tooltipMessage,
		...restProps
	}: ButtonProps<As> = $props()

	const KIND_CLASS_MAP = {
		filled: 'filled-button',
		toned: 'tonal-button',
		outlined: 'outlined-button',
		flat: 'flat-button',
		blank: '',
	} as const
</script>

<svelte:element
	this={(!disabled ? as : 'button') as AllowedButtonElement}
	{@attach ripple({ stopPropagation: true })}
	{@attach tooltip(tooltipMessage)}
	{...restProps}
	{type}
	aria-label={ariaLabel}
	{href}
	disabled={disabled === true ? true : undefined}
	class={[
		'interactable',
		KIND_CLASS_MAP[kind],
		kind !== 'blank' &&
			'base-button flex h-10 items-center justify-center gap-2 rounded-full px-4 text-label-lg transition-[outline-width,box-shadow,background-color,translate,scale] duration-200 ease-calm active:scale-[0.97]',
		restProps.class,
	]}
>
	{#if children}
		{@render children()}
	{/if}
</svelte:element>

<style lang="postcss">
	@reference '../../app.css';

	/* DESIGN.md button-primary: ink pill */
	.filled-button {
		background: var(--color-primary);
		color: var(--color-onPrimary);
		box-shadow:
			inset 0 1px 0 0 rgb(255 255 255 / 0.12),
			0 1px 2px rgb(0 0 0 / 0.12);

		@media (any-hover: hover) {
			&:not([disabled]):hover {
				background: color-mix(in oklab, var(--color-primary) 86%, var(--color-onPrimary));
			}
		}
	}

	.tonal-button {
		background: var(--color-secondaryContainer);
		color: var(--color-onSecondaryContainer);
	}

	/* DESIGN.md button-secondary: elevated pill with a hairline */
	.outlined-button {
		color: var(--color-onSurface);
		background: var(--color-surfaceContainerLowest);
		border: 1px solid var(--hairline);
		box-shadow: var(--shadow-whisper);
	}

	.flat-button {
		color: var(--color-tertiary);
		padding-left: --spacing(3);
		padding-right: --spacing(3);
	}

	.base-button[disabled] {
		cursor: default;
		box-shadow: none;
		background-color: --alpha(var(--color-onSurface) / 8%);
		border-color: transparent;
		color: --alpha(var(--color-onSurface) / 38%);
	}
</style>
