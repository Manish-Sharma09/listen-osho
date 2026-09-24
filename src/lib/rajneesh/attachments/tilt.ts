import type { Attachment } from 'svelte/attachments'

export interface TiltOptions {
	/** Maximum rotation in degrees on each axis */
	max?: number
	/** Scale applied while the pointer is over the element */
	scale?: number
	/** Adds a moving specular highlight that follows the pointer */
	glare?: boolean
	/** CSS perspective distance in px */
	perspective?: number
}

/**
 * Pointer-driven 3D tilt with an optional mirror-like glare.
 * Only active for fine pointers that can hover, and never when reduced motion is requested.
 * Uses the `transform` property only, so Tailwind `translate`/`scale`/`rotate` utilities still compose.
 */
export const tilt =
	(options: TiltOptions = {}): Attachment<HTMLElement> =>
	(node) => {
		const { max = 7, scale = 1.015, glare = true, perspective = 900 } = options

		const canHover = window.matchMedia('(hover: hover) and (pointer: fine)')
		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
		if (!canHover.matches || reducedMotion.matches) {
			return
		}

		if (getComputedStyle(node).position === 'static') {
			node.style.position = 'relative'
		}
		node.style.transformStyle = 'preserve-3d'
		node.style.willChange = 'transform'

		let glareEl: HTMLSpanElement | undefined
		if (glare) {
			glareEl = document.createElement('span')
			glareEl.setAttribute('aria-hidden', 'true')
			Object.assign(glareEl.style, {
				position: 'absolute',
				inset: '0',
				borderRadius: 'inherit',
				pointerEvents: 'none',
				zIndex: '3',
				opacity: '0',
				transition: 'opacity 300ms ease',
				background:
					'radial-gradient(circle at var(--tilt-x, 50%) var(--tilt-y, 50%), rgb(255 255 255 / 0.28), transparent 55%)',
				mixBlendMode: 'soft-light',
			} satisfies Partial<CSSStyleDeclaration>)
			node.append(glareEl)
		}

		let frame = 0

		const onMove = (event: PointerEvent) => {
			const rect = node.getBoundingClientRect()
			const px = (event.clientX - rect.left) / rect.width
			const py = (event.clientY - rect.top) / rect.height

			cancelAnimationFrame(frame)
			frame = requestAnimationFrame(() => {
				const rotateX = (0.5 - py) * max * 2
				const rotateY = (px - 0.5) * max * 2
				node.style.transition = 'transform 120ms linear'
				node.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`

				if (glareEl) {
					glareEl.style.opacity = '1'
					glareEl.style.setProperty('--tilt-x', `${px * 100}%`)
					glareEl.style.setProperty('--tilt-y', `${py * 100}%`)
				}
			})
		}

		const onLeave = () => {
			cancelAnimationFrame(frame)
			node.style.transition = 'transform 700ms cubic-bezier(0.22, 1, 0.36, 1)'
			node.style.transform = ''
			if (glareEl) {
				glareEl.style.opacity = '0'
			}
		}

		node.addEventListener('pointermove', onMove)
		node.addEventListener('pointerleave', onLeave)

		return () => {
			cancelAnimationFrame(frame)
			node.removeEventListener('pointermove', onMove)
			node.removeEventListener('pointerleave', onLeave)
			glareEl?.remove()
			node.style.transform = ''
			node.style.willChange = ''
		}
	}
