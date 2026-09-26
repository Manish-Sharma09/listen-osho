import { redirect } from '@sveltejs/kit'
import '../../app.css'

export const ssr = true
export const prerender = true
export const csr = true

export const load = () => {
	// Temporary, so browsers don't cache which page the app opens on
	redirect(307, '/library/home')
}
