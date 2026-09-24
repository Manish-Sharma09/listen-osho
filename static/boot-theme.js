// IMPORTANT. Loaded synchronously from <head> before first paint. ES5 only.
// Applies the saved light/dark theme early so the preloader and app never flash the wrong theme.
// Mirrors MainStore: key `snaeplayer-main.theme`, values 'light' | 'dark' | 'auto', default 'light'.
(function () {
	var theme = 'light'

	try {
		var raw = window.localStorage.getItem('snaeplayer-main.theme')
		if (raw) {
			theme = JSON.parse(raw)
		}
	} catch (error) {
		// Storage can be unavailable (private mode, blocked cookies). Keep the default.
	}

	var isDark =
		theme === 'dark' ||
		(theme === 'auto' &&
			!!window.matchMedia &&
			window.matchMedia('(prefers-color-scheme: dark)').matches)

	if (isDark) {
		document.documentElement.classList.add('dark')
	}
})()
