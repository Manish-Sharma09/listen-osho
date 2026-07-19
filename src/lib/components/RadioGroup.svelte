<script lang="ts" module>
	export interface RadioGroupProps<T, Key extends keyof T, LabelKey extends keyof T> {
		items: readonly T[]
		key: Key
		labelKey: LabelKey
		selected?: T[Key]
		class?: ClassValue
	}
</script>

<script lang="ts" generics="T, const Key extends keyof T, const LabelKey extends keyof T">
	let {
		items,
		key,
		labelKey,
		selected = $bindable(),
		class: className,
	}: RadioGroupProps<T, Key, LabelKey> = $props()

	const groupName = crypto.randomUUID()
</script>

<div class={['flex flex-col', className]} role="radiogroup">
	{#each items as item (item[key])}
		{@const checked = item[key] === selected}
		<label class="flex cursor-pointer items-center gap-3 rounded-sm py-1.5 -outline-offset-2">
			<span
				class={[
					'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150',
					checked ? 'border-primary' : 'border-outline',
				]}
			>
				{#if checked}
					<span class="size-2.5 rounded-full bg-primary"></span>
				{/if}
			</span>

			<input
				type="radio"
				name={groupName}
				class="hidden"
				{checked}
				onchange={() => {
					selected = item[key]
				}}
			/>

			{item[labelKey]}
		</label>
	{/each}
</div>
