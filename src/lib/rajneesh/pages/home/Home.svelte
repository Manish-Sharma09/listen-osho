<script lang="ts">
	import { goto } from '$app/navigation'
	import Button from '$lib/components/Button.svelte'
	import Icon from '$lib/components/icon/Icon.svelte'
	import { getDatabase } from '$lib/db/database.ts'
	import { createQuery } from '$lib/db/query/query.ts'
	import { dbGetAlbumTracksIdsByName, getLibraryItemIdFromUuid } from '$lib/library/get/ids.ts'
	import { getLibraryValue, type TrackData } from '$lib/library/get/value.ts'
	import type { Album } from '$lib/library/types.ts'
	import ContinueListeningCard from '$lib/rajneesh/components/ContinueListeningCard.svelte'
	import InstallAppBanner from '$lib/rajneesh/components/InstallAppBanner.svelte'
	import HomeBookmarksSection from '$lib/rajneesh/pages/home/HomeBookmarksSection.svelte'
	import { resolve } from '$app/paths'
	import { tilt } from '$lib/rajneesh/attachments/tilt.ts'
	import CoverFlow, { type CoverFlowItem } from '$lib/rajneesh/components/three-d/CoverFlow.svelte'
	import MarqueeStrip from '$lib/rajneesh/components/ui/MarqueeStrip.svelte'
	import SectionHeader from '$lib/rajneesh/components/ui/SectionHeader.svelte'
	import SiteFooter from '$lib/rajneesh/components/ui/SiteFooter.svelte'
	import { getCatalog } from '$lib/rajneesh/stores/catalog.svelte.ts'
	import HomeHero from './HomeHero.svelte'
	import HomeNowSpinning from './HomeNowSpinning.svelte'
	import { useMainStore } from '$lib/stores/main/use-store.ts'

	const player = usePlayer()
	const mainStore = useMainStore()
	const DISCOVER_TOPICS_STORAGE_KEY = 'rajneesh-home-discover-topics'
	const DISCOVER_TOPICS = [
		'मुल्ला',
		'नसरुद्दीन',
		'स्त्री',
		'पुरुष',
		'बुद्ध',
		'पतंजलि',
		'गोरख',
		'कबीर',
		'मीरा',
		'सहजोबाई',
		'मलूकदास',
		'फरीद',
		'दयानंद',
		'कृष्ण',
		'जीसस',
		'लाओत्से',
		'जरथुस्त्र',
		'सुकरात',
		'हेराक्लीतुस',
		'जिब्रान',
		'खैयाम',
		'राबिया',
		'बोधिधर्म',
		'नागार्जुन',
		'शंकर',
		'महावीर',
		'मोहम्मद',
		'उपनिषद',
		'गीता',
		'धम्मपद',
		'तंत्र',
		'योग',
		'सांख्य',
		'अद्वैत',
		'सूफी',
		'झेन',
		'ताओ',
		'हसीद',
		'सामुराई',
		'बाऊल',
		'शिक्षा',
		'राजनीति',
		'परिवार',
		'विवाह',
		'प्रेम',
		'काम',
		'ब्रह्मचर्य',
		'मृत्यु',
		'बुढ़ापा',
		'बचपन',
		'निद्रा',
		'स्वप्न',
		'हास्य',
		'रुदन',
		'क्रोध',
		'अहंकार',
		'ईर्ष्या',
		'अकेलापन',
		'मौन',
		'संगीत',
		'नृत्य',
		'चित्रकला',
		'कविता',
		'सौंदर्य',
		'श्रृंगार',
		'भोजन',
		'उपवास',
		'औषधि',
		'शरीर',
		'श्वास',
		'हृदय',
		'मस्तिष्क',
		'विचार',
		'निर्विचार',
		'साक्षी',
		'होश',
		'प्रमाद',
		'करुणा',
		'अहिंसा',
		'सत्य',
		'स्वतंत्रता',
		'विद्रोह',
		'अनुशासन',
		'आज्ञा',
		'गुरु',
		'शिष्य',
		'दीक्षा',
		'संन्यास',
		'मंदिर',
		'तीर्थ',
		'पूजा',
		'प्रार्थना',
		'शब्द',
		'शून्य',
		'अस्तित्व',
		'प्रकृति',
		'वृक्ष',
		'मोर',
		'सागर',
		'मरुस्थल',
		'बाजार',
		'धन',
		'सत्ता',
		'विज्ञान',
		'मनोविज्ञान',
		'समाधि',
		'अमृता',
		'मजनू',
		'लैला',
		'शिखंडी',
		'द्रौपदी',
		'वेश्या',
		'नपुंसक',
		'पागल',
		'शराब',
		'दीवाना',
		'भिखारी',
		'सम्राट',
		'क्रान्ति',
		'नास्तिक',
		'आस्तिक',
		'मस्जिद',
		'काबा',
		'कैलाश',
		'स्वर्ग',
		'नरक',
		'पाप',
		'पुण्य',
		'शकुनि',
		'भीष्म',
		'कर्ण',
		'गांधी',
		'मार्क्स',
		'लेनिन',
		'नीत्शे',
		'फ्रायड',
		'युंग',
		'सार्त्र',
		'कैम्यु',
		'टॉल्स्टॉय',
		'दास्तयवस्की',
		'गोर्की',
		'बेथोवेन',
		'रविशंकर',
		'तुलसी',
		'सूरदास',
		'रहीम',
		'नानक',
		'बुल्लेशाह',
		'मंसूर',
		'शम्स',
		'रूमी',
		'अत्तार',
		'बाशो',
		'इक्कायू',
		'हकुइन',
		'दोगेन्',
		'बोधिसत्व',
		'अर्हत',
		'तीर्थंकर',
		'पर्वत',
		'वर्षा',
		'मिट्टी',
		'फूल',
		'काँटा',
		'तितली',
		'सांप',
		'शेर',
		'हंस',
		'कोयल',
		'अग्नि',
		'दीपक',
		'अंधेरा',
		'रोशनी',
		'चाँद',
		'सूरज',
		'सितारे',
		'विक्रम',
		'चाणक्य',
		'सिकंदर',
		'नेपोलियन',
		'हिटलर',
		'स्टालिन',
		'माओ',
		'भक्त',
		'साधु',
		'अघोरी',
		'वैराग्य',
		'उत्सव',
		'उल्लास',
		'आनंद',
		'परमानंद',
		'निर्वाण',
		'मोक्ष',
		'कैवल्य',
		'शिवम',
		'सुंदरम',
		'अस्तेय',
		'अपरिग्रह',
		'ब्रह्म',
		'माया',
		'लीला',
		'सृष्टि',
		'प्रलय',
		'कलियुग',
		'सतयुग',
		'त्रेता',
		'द्वापर',
		'राम',
		'लक्ष्मण',
		'सीता',
		'रावण',
		'हनुमान',
		'अर्जुन',
		'दुर्योधन',
		'धृतराष्ट्र',
		'नचिकेता',
		'यम',
		'नारद',
		'इंद्र',
		'कामदेव',
		'शिव',
		'शक्ति',
		'गणेश',
		'दुर्गा',
		'काली',
		'सरस्वती',
		'लक्ष्मी',
		'विष्णु',
		'ब्रह्मा',
		'गंगा',
		'यमुना',
		'हिमालय',
		'काशी',
		'मथुरा',
		'वृंदावन',
		'द्वारका',
		'मक्का',
		'मदीना',
		'यरूशलेम',
		'रोम',
		'बाइबिल',
		'कुरान',
		'वेद',
		'पुराण',
		'शास्त्र',
		'कर्म',
		'भाग्य',
		'संस्कार',
		'पुनर्जन्म',
		'आत्मा',
		'परमात्मा',
		'स्वयं',
		'अहं',
		'विशिष्टद्वैत',
		'द्वैत',
		'अष्टावक्र',
		'जनक',
		'ईशोपनिषद',
		'मुंडक',
		'माण्डूक्य',
		'यज्ञवल्क्य',
		'गार्गी',
		'मैत्रेयी',
		'खजुराहो',
		'कोणार्क',
		'नटराज',
		'तांडव',
		'अभिमन्यु',
		'अश्वत्थामा',
		'एकलव्य',
		'अहिल्या',
		'कुंती',
		'गांधारी',
		'यशोधरा',
		'राहुल',
		'आनंद',
		'महाकश्यप',
		'मिलारेपा',
		'तिलोपा',
		'नारोपा',
		'कपिल',
		'जैमिनी',
		'व्यास',
		'वाल्मीकि',
		'कालिदास',
		'भर्तृहरि',
		'जयदेव',
		'विद्यापति',
		'अक्का',
		'नामदेव',
		'तुकाराम',
		'एकनाथ',
		'ज्ञानेश्वर',
		'रैदास',
		'दादू',
		'अमीर',
		'खुसरो',
		'चिश्ती',
		'निजामुद्दीन',
		'औलिया',
		'कलंदर',
		'फकीर',
		'दरवेश',
		'पीर',
		'मुर्शिद',
		'मुरीद',
		'जिक्र',
		'वजूद',
		'निर्विकल्प',
		'सविकल्प',
		'तुरीय',
		'अनाहत',
		'नाद',
		'बिंदु',
		'कुंडलिनी',
		'मूलाधार',
		'सहस्रार',
		'विस्फोट',
		'अनंत',
		'अर्धनारीश्वर',
		'अनहद',
		'अस्तित्ववाद',
		'अंतर्यात्रा',
		'अश्रु',
		'अलिप्त',
		'अट्टहास',
		'आस्था',
		'इच्छा',
		'ईश्वरत्व',
		'एकांत',
		'एकात्म',
		'एकाग्रता',
		'ओकार',
		'औघड़',
		'कल्पवृक्ष',
		'काया',
		'किंवदंती',
		'कुतूहल',
		'कृतज्ञता',
		'कोलाहल',
		'क्षण',
		'क्षितिज',
		'खामोशी',
		'गंभीर',
		'गहन',
		'गुह्य',
		'चेतना',
		'चैतन्य',
		'जिज्ञासा',
		'जीवन्मुक्त',
		'ज्योति',
		'तटस्थ',
		'तन्मय',
		'तपस्या',
		'तरंग',
		'तर्क',
		'तलाश',
		'तल्लीन',
		'त्याग',
		'दर्पण',
		'दर्शन',
		'दृष्टा',
		'द्वंद्व',
	] as const
	// Independent English-language mirror of DISCOVER_TOPICS/DISCOVER_TOPIC_PRIORITY below.
	// These are literal English words scored directly against the English transcripts
	// (see scripts/generate-transcript-tags.ts) - no relation to the Hindi tags, and no
	// English-label lookup for Hindi tags: each language keeps its own catalog, priority
	// order, tag identifier, and randomization pool.
	const DISCOVER_TOPICS_EN = [
		'Love',
		'God',
		'Mind',
		'Master',
		'Death',
		'Truth',
		'Meditation',
		'Silence',
		'Ego',
		'Disciple',
		'Zen',
		'Freedom',
		'Fear',
		'Enlightenment',
		'Awareness',
		'Witness',
		'Sannyas',
		'Society',
		'War',
		'Politics',
		'Communism',
		'Money',
		'Marriage',
		'Family',
		'Anger',
		'Dance',
		'Poetry',
		'Music',
		'Art',
		'Humor',
		'Sufi',
		'Tao',
		'Bodhidharma',
		'Ecstasy',
		'Psychology',
		'Consciousness',
		'Existence',
		'Religion',
		'Jesus',
		'Socrates',
		'Buddha',
		'Krishnamurti',
		'Gurdjieff',
		'Freud',
		'Jung',
		'Marx',
		'Lenin',
		'Nietzsche',
		'Hitler',
		'Karma',
		'Dharma',
		'Nirvana',
		'Yoga',
		'Tantra',
		'Kundalini',
		'Baul',
		'Hasid',
		'Samurai',
		'Compassion',
		'Understanding',
		'Desire',
		'Courage',
		'Trust',
		'Doubt',
		'Creativity',
		'Celebration',
		'Discipline',
		'Rebellion',
		'Surrender',
		'Devotion',
		'Prayer',
		'Education',
		'Children',
		'Woman',
		'Body',
		'Sleep',
		'Dream',
		'Science',
		'India',
		'Violence',
	] as const
	const DISCOVER_TOPICS_COUNT = 10
	const DISCOVER_TAGS_URL = '/rajneesh/discover-tags.json'
	const DISCOVER_TAGS_URL_EN = '/rajneesh/discover-tags-en.json'
	const DISCOVER_TOPIC_PRIORITY_EN = [
		'Love',
		'Mind',
		'God',
		'Master',
		'Death',
		'Truth',
		'Meditation',
		'Silence',
		'Ego',
		'Disciple',
		'Zen',
		'Freedom',
		'Fear',
		'Enlightenment',
		'Awareness',
		'Witness',
		'Sannyas',
		'Society',
		'War',
		'Politics',
		'Communism',
		'Money',
		'Marriage',
		'Family',
		'Anger',
		'Dance',
		'Poetry',
		'Music',
		'Art',
		'Humor',
		'Sufi',
		'Tao',
		'Bodhidharma',
		'Ecstasy',
		'Psychology',
		'Consciousness',
		'Existence',
		'Religion',
		'Jesus',
		'Socrates',
	] as const
	const DISCOVER_TOPIC_PRIORITY = [
		'बुद्ध',
		'स्त्री',
		'पुरुष',
		'पतंजलि',
		'गोरख',
		'कबीर',
		'मीरा',
		'महावीर',
		'कृष्ण',
		'लाओत्से',
		'नानक',
		'उपनिषद',
		'गीता',
		'योग',
		'तंत्र',
		'ध्यान',
		'समाधि',
		'प्रार्थना',
		'मौन',
		'शून्य',
		'प्रेम',
		'करुणा',
		'भक्ति',
		'मृत्यु',
		'जीवन',
		'अहंकार',
		'परिवार',
		'विवाह',
		'सत्य',
		'धर्म',
		'साक्षी',
		'चेतना',
		'गुरु',
		'साधना',
		'स्वतंत्रता',
		'भारत',
		'शिक्षा',
		'राजनीति',
	] as const
	type DiscoverTopic = {
		tag: string
		documents: number
		hits: number
	}

	type DiscoverTagsResponse = {
		tags?: [string, number, number][]
	}

	const FALLBACK_DISCOVER_TOPIC_CATALOG: DiscoverTopic[] = DISCOVER_TOPICS.filter((topic) =>
		DISCOVER_TOPIC_PRIORITY.includes(topic as (typeof DISCOVER_TOPIC_PRIORITY)[number]),
	).map((topic) => ({
		tag: topic,
		documents: 0,
		hits: 0,
	}))
	const FALLBACK_DISCOVER_TOPIC_CATALOG_EN: DiscoverTopic[] = DISCOVER_TOPICS_EN.filter((topic) =>
		DISCOVER_TOPIC_PRIORITY_EN.includes(topic as (typeof DISCOVER_TOPIC_PRIORITY_EN)[number]),
	).map((topic) => ({
		tag: topic,
		documents: 0,
		hits: 0,
	}))
	type ResumeCardData = {
		track: TrackData
		album: Album | undefined
		albumTrackIds: number[]
		trackId: number
		lastPlayedAt: number
		listenedMinutes: number
	}

	const latestResumeQuery = createQuery({
		key: [],
		fetcher: async (): Promise<ResumeCardData[]> => {
			const db = await getDatabase()
			const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
			const tx = db.transaction('activeMinutes')
			const index = tx.store.index('activeMinuteTimestampMs')
			const minutes = []

			for await (const cursor of index.iterate(IDBKeyRange.lowerBound(cutoff))) {
				minutes.push(cursor.value)
			}

			const latestByTrack = new Map<string, (typeof minutes)[number]>()
			for (const minute of minutes) {
				const existing = latestByTrack.get(minute.trackId)
				if (!existing || minute.activeMinuteTimestampMs > existing.activeMinuteTimestampMs) {
					latestByTrack.set(minute.trackId, minute)
				}
			}

			const resolvedTracks = await Promise.all(
				Array.from(latestByTrack.values()).map(async (minute) => {
					const trackId = await getLibraryItemIdFromUuid('tracks', minute.trackId)
					if (!trackId) {
						return null
					}

					const track = await getLibraryValue('tracks', trackId, true)
					if (!track) {
						return null
					}

					return {
						track,
						trackId,
						lastPlayedAt: minute.activeMinuteTimestampMs,
					}
				}),
			)

			const resolvedTrackByUuid = new Map(
				resolvedTracks
					.filter((item): item is NonNullable<typeof item> => !!item)
					.map((item) => [item.track.uuid, item]),
			)

			const listenedMinutesByAlbum = new Map<string, number>()
			for (const minute of minutes) {
				const resolved = resolvedTrackByUuid.get(minute.trackId)
				if (!resolved) {
					continue
				}

				const albumName = resolved.track.album
				const existing = listenedMinutesByAlbum.get(albumName) ?? 0
				listenedMinutesByAlbum.set(albumName, existing + 1)
			}

			const latestByAlbum = new Map<string, (typeof resolvedTracks)[number]>()
			for (const item of resolvedTracks) {
				if (!item) {
					continue
				}

				const albumName = item.track.album
				const existing = latestByAlbum.get(albumName)
				if (!existing || item.lastPlayedAt > existing.lastPlayedAt) {
					latestByAlbum.set(albumName, item)
				}
			}

			const cards = await Promise.all(
				Array.from(latestByAlbum.values()).map(async (item) => {
					if (!item) {
						return null
					}

					const [album, albumTrackIds] = await Promise.all([
						db.getFromIndex('albums', 'name', item.track.album),
						dbGetAlbumTracksIdsByName(item.track.album),
					])

					return {
						track: item.track,
						trackId: item.trackId,
						lastPlayedAt: item.lastPlayedAt,
						listenedMinutes: listenedMinutesByAlbum.get(item.track.album) ?? 0,
						album,
						albumTrackIds,
					}
				}),
			)

			const sortedCards = cards
				.filter((card): card is ResumeCardData => !!card)
				.sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)

			const [mostRecentCard, ...remainingCards] = sortedCards
			if (!mostRecentCard) {
				return []
			}

			remainingCards.sort((a, b) => {
				if (b.listenedMinutes !== a.listenedMinutes) {
					return b.listenedMinutes - a.listenedMinutes
				}

				return b.lastPlayedAt - a.lastPlayedAt
			})

			return [mostRecentCard, ...remainingCards]
		},
		onDatabaseChange: (changes, { refetch }) => {
			for (const change of changes) {
				const storeName = change.storeName as string
				if (
					storeName === 'activeMinutes' ||
					storeName === 'tracks' ||
					storeName === 'albums'
				) {
					void refetch()
					break
				}
			}
		},
	})

	const resumeCards = $derived(latestResumeQuery.value ?? [])
	let resumeExpanded = $state(false)
	let discoverTopicCatalogHi = $state<DiscoverTopic[]>(FALLBACK_DISCOVER_TOPIC_CATALOG)
	let discoverTopicCatalogEn = $state<DiscoverTopic[]>(FALLBACK_DISCOVER_TOPIC_CATALOG_EN)
	let discoverTopics = $state<string[]>([])
	let previousDiscoverTopics = $state<string[]>([])
	let discoverTagsLoaded = $state(true)
	let discoverTagsLoadStartedHi = false
	let discoverTagsLoadStartedEn = false
	// Which pool random picks are drawn from - and which language's identifiers
	// discoverTopics holds - follows the user's content language selection directly.
	const discoverTopicCatalog = $derived(
		mainStore.contentLanguage === 'english'
			? discoverTopicCatalogEn
			: mainStore.contentLanguage === 'hindi'
				? discoverTopicCatalogHi
				: [...discoverTopicCatalogHi, ...discoverTopicCatalogEn],
	)
	const discoverTopicsStorageKey = $derived(
		`${DISCOVER_TOPICS_STORAGE_KEY}-${mainStore.contentLanguage}`,
	)
	const discoverTopicCatalogByTag = $derived(
		new Map(discoverTopicCatalog.map((topic) => [topic.tag, topic])),
	)
	const visibleDiscoverTopics = $derived(
		discoverTopics
			.map((tag) => discoverTopicCatalogByTag.get(tag))
			.filter((topic): topic is DiscoverTopic => !!topic),
	)
	const visibleResumeCards = $derived(
		resumeExpanded ? resumeCards : resumeCards.slice(0, 2),
	)
	const hasHiddenResumeCards = $derived(resumeCards.length > 2)

	const getDiscoverTopicCountLabel = (documents: number) =>
		documents > 0 ? `${documents} talks` : 'Explore'

	const buildDiscoverTopicCatalog = (
		globalTags: DiscoverTopic[],
		priorityTags: readonly string[],
		fallback: DiscoverTopic[],
	) => {
		const priorityIndex = new Map<string, number>(
			priorityTags.map((tag, index) => [tag, index]),
		)
		const filtered = globalTags
			.filter((topic) => priorityIndex.has(topic.tag))
			.sort((a, b) => {
				const aPriority = priorityIndex.get(a.tag) ?? Number.MAX_SAFE_INTEGER
				const bPriority = priorityIndex.get(b.tag) ?? Number.MAX_SAFE_INTEGER
				if (aPriority !== bPriority) {
					return aPriority - bPriority
				}
				if (b.documents !== a.documents) {
					return b.documents - a.documents
				}
				return b.hits - a.hits
			})

		return filtered.length > 0 ? filtered : fallback
	}

	const parseDiscoverTagsResponse = (json: DiscoverTagsResponse): DiscoverTopic[] => {
		if (!Array.isArray(json.tags)) {
			return []
		}

		return json.tags
			.map((entry) => {
				if (!Array.isArray(entry) || entry.length < 3) {
					return null
				}

				const [tag, documents, hits] = entry
				if (
					typeof tag !== 'string' ||
					typeof documents !== 'number' ||
					typeof hits !== 'number'
				) {
					return null
				}

				return {
					tag,
					documents,
					hits,
				}
			})
			.filter((topic): topic is DiscoverTopic => !!topic)
	}

	const restoreDiscoverTopics = () => {
		if (typeof localStorage === 'undefined') {
			return false
		}

		const raw = localStorage.getItem(discoverTopicsStorageKey)
		if (!raw) {
			return false
		}

		try {
			const parsed = JSON.parse(raw)
			if (!Array.isArray(parsed)) {
				return false
			}

			const restoredTopics = parsed.filter(
				(topic): topic is string =>
					typeof topic === 'string' && discoverTopicCatalogByTag.has(topic),
			)

			if (restoredTopics.length === DISCOVER_TOPICS_COUNT) {
				previousDiscoverTopics = []
				discoverTopics = restoredTopics
				return true
			}
		} catch {
			return false
		}

		return false
	}

	const persistDiscoverTopics = () => {
		if (typeof localStorage === 'undefined' || discoverTopics.length === 0) {
			return
		}

		localStorage.setItem(discoverTopicsStorageKey, JSON.stringify(discoverTopics))
	}

	const shuffleTags = (tags: string[]) => {
		const shuffled = [...tags]
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1))
			const current = shuffled[i]
			const next = shuffled[j]
			if (!current || !next) {
				continue
			}
			shuffled[i] = next
			shuffled[j] = current
		}
		return shuffled
	}

	const pickDiscoverTopics = (excludedTags: string[] = []) => {
		const allTags = discoverTopicCatalog.map((topic) => topic.tag)
		const excludedTagSet = new Set(excludedTags)
		const freshTags = shuffleTags(allTags.filter((tag) => !excludedTagSet.has(tag)))

		if (freshTags.length >= DISCOVER_TOPICS_COUNT) {
			return freshTags.slice(0, DISCOVER_TOPICS_COUNT)
		}

		const fallbackTags = shuffleTags(allTags.filter((tag) => !freshTags.includes(tag)))
		return [...freshTags, ...fallbackTags].slice(0, DISCOVER_TOPICS_COUNT)
	}

	const shuffleDiscoverTopics = () => {
		previousDiscoverTopics = discoverTopics
		discoverTopics = pickDiscoverTopics(discoverTopics)
		persistDiscoverTopics()
	}

	const resume = (card: ResumeCardData) => {
		const { albumTrackIds, trackId } = card
		if (albumTrackIds.length > 0) {
			const startIndex = albumTrackIds.indexOf(trackId)
			if (startIndex >= 0) {
				player.playTrack(startIndex, albumTrackIds)
				return
			}
		}

		player.playTrack(0, [trackId])
	}

	const MASTERS = [
		'Buddha',
		'Lao Tzu',
		'Kabir',
		'Meera',
		'Krishna',
		'Mahavira',
		'Patanjali',
		'Jesus',
		'Zarathustra',
		'Heraclitus',
		'Rumi',
		'Nanak',
		'Gorakh',
		'Ashtavakra',
		'Bodhidharma',
		'Tilopa',
		'Chuang Tzu',
		'Socrates',
	] as const

	const FEATURED_SERIES_COUNT = 15

	// Series with real cover art, spread across the catalog, for the 3D cover flow
	const featuredSeries = $derived.by((): CoverFlowItem[] => {
		const catalog = getCatalog()
		if (!catalog) return []

		const trackCounts = new Map<string, number>()
		for (const track of catalog.tracks) {
			trackCounts.set(track.album, (trackCounts.get(track.album) ?? 0) + 1)
		}

		// Catalog albums carry remote cover URLs (strings) even though the library type allows Blobs
		const coverOf = (album: (typeof catalog.albums)[number]) => {
			const image = album.image as unknown
			return typeof image === 'string' && !image.includes('no_image') ? image : undefined
		}
		const withCovers = catalog.albums.filter((album) => coverOf(album))
		const step = Math.max(1, Math.floor(withCovers.length / FEATURED_SERIES_COUNT))

		return withCovers
			.filter((_, index) => index % step === 0)
			.slice(0, FEATURED_SERIES_COUNT)
			.map((album) => ({
				id: album.uuid,
				title: album.name,
				subtitle: `${trackCounts.get(album.name) ?? 0} discourses`,
				image: coverOf(album),
				href: resolve('/(app)/library/[[slug=libraryEntities]]/[uuid]', {
					slug: 'albums',
					uuid: album.uuid,
				}),
			}))
	})

	const startListening = () => {
		const firstCard = resumeCards[0]
		if (firstCard) {
			resume(firstCard)
			return
		}

		void goto('/library/shorts')
	}

	const openExplore = () => {
		void goto('/library/explore')
	}


	const openDiscoverTopic = (topic: string) => {
		void goto(`/library/explore?search=${encodeURIComponent(topic)}`)
	}

	$effect(() => {
		const firstCard = resumeCards[0]
		if (!firstCard || !player.isQueueEmpty) {
			return
		}

		const { albumTrackIds, trackId } = firstCard
		if (albumTrackIds.length > 0) {
			const startIndex = albumTrackIds.indexOf(trackId)
			player.prepareTrack(Math.max(0, startIndex), albumTrackIds)
			return
		}

		player.prepareTrack(0, [trackId])
	})

	$effect(() => {
		if (resumeCards.length <= 2 && resumeExpanded) {
			resumeExpanded = false
		}
	})

	$effect(() => {
		if (discoverTagsLoaded && discoverTopics.length === 0) {
			if (!restoreDiscoverTopics()) {
				shuffleDiscoverTopics()
			}
		}
	})

	$effect(() => {
		if (discoverTopics.length === 0 || discoverTopicCatalog.length === 0) {
			return
		}

		const invalidTopicExists = discoverTopics.some((topic) => !discoverTopicCatalogByTag.has(topic))
		if (!invalidTopicExists) {
			return
		}

		discoverTopics = pickDiscoverTopics(previousDiscoverTopics)
		persistDiscoverTopics()
	})

	$effect(() => {
		if (discoverTagsLoadStartedHi || typeof fetch === 'undefined') {
			return
		}

		discoverTagsLoadStartedHi = true

		void (async () => {
			try {
				const response = await fetch(DISCOVER_TAGS_URL)
				if (!response.ok) {
					throw new Error('Could not load discover tags.')
				}

				const json = (await response.json()) as DiscoverTagsResponse
				const globalTags = parseDiscoverTagsResponse(json)
				discoverTopicCatalogHi = buildDiscoverTopicCatalog(
					globalTags,
					DISCOVER_TOPIC_PRIORITY,
					FALLBACK_DISCOVER_TOPIC_CATALOG,
				)
			} catch {
				discoverTopicCatalogHi = FALLBACK_DISCOVER_TOPIC_CATALOG
			} finally {
				discoverTagsLoaded = true
			}
		})()
	})

	$effect(() => {
		if (discoverTagsLoadStartedEn || typeof fetch === 'undefined') {
			return
		}

		discoverTagsLoadStartedEn = true

		void (async () => {
			try {
				const response = await fetch(DISCOVER_TAGS_URL_EN)
				if (!response.ok) {
					throw new Error('Could not load discover tags.')
				}

				const json = (await response.json()) as DiscoverTagsResponse
				const globalTags = parseDiscoverTagsResponse(json)
				discoverTopicCatalogEn = buildDiscoverTopicCatalog(
					globalTags,
					DISCOVER_TOPIC_PRIORITY_EN,
					FALLBACK_DISCOVER_TOPIC_CATALOG_EN,
				)
			} catch {
				discoverTopicCatalogEn = FALLBACK_DISCOVER_TOPIC_CATALOG_EN
			} finally {
				discoverTagsLoaded = true
			}
		})()
	})
</script>

{#snippet discoverSection()}
	<section class="py-14" aria-labelledby="home-discover-title">
		<SectionHeader
			id="home-discover-title"
			eyebrow="Themes from the transcripts"
			title="Discover"
			description="Topics counted across every transcript. Pick one to search inside the talks."
		>
			{#snippet action()}
				<Button kind="outlined" class="shuffle-button" onclick={shuffleDiscoverTopics}>
					<Icon type="shuffle" class="size-4" />
					Shuffle
				</Button>
			{/snippet}
		</SectionHeader>

		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
			{#each visibleDiscoverTopics as topic, index (topic.tag)}
				<button
					{@attach tilt({ max: 8 })}
					type="button"
					class="topic-card surface-card interactable animate-rise flex-col items-start justify-between gap-4 rounded-xl p-4 text-left transition-[border-color] duration-200 hover:border-(--hairline-strong) sm:gap-8 sm:p-5"
					style="animation-delay: {index * 40}ms"
					onclick={() => openDiscoverTopic(topic.tag)}
				>
					<span class="font-mono text-label-md text-onSurfaceVariant tabular-nums">
						{String(index + 1).padStart(2, '0')}
					</span>
					<span class="flex min-w-0 flex-col gap-1">
						<span class="truncate text-title-lg">{topic.tag}</span>
						<span class="text-eyebrow text-onSurfaceVariant">
							{getDiscoverTopicCountLabel(topic.documents)}
						</span>
					</span>
				</button>
			{/each}
		</div>
	</section>
{/snippet}

<div class="flex grow flex-col pb-4">
	<HomeHero
		primaryLabel={resumeCards.length > 0 ? 'Continue listening' : 'Start listening'}
		onPrimary={startListening}
		onExplore={openExplore}
	/>

	<MarqueeStrip
		label="Masters and mystics Osho speaks on"
		items={MASTERS}
		href={(name) => `/library/explore?search=${encodeURIComponent(name)}`}
		class="border-b border-(--hairline)"
	/>

	<InstallAppBanner class="mt-8" />

	<HomeNowSpinning onStart={startListening} />

	{#if resumeCards.length > 0}
		<section class="border-t border-(--hairline) py-14" aria-labelledby="home-resume-title">
			<SectionHeader
				id="home-resume-title"
				eyebrow="Pick up where you left off"
				title="Continue listening"
			>
				{#snippet action()}
					{#if hasHiddenResumeCards}
						<Button kind="outlined" class="shrink-0" onclick={() => (resumeExpanded = !resumeExpanded)}>
							{resumeExpanded ? 'Show less' : 'Show all'}
						</Button>
					{/if}
				{/snippet}
			</SectionHeader>

			<div class="grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{#each visibleResumeCards as card, index (card.trackId)}
					<ContinueListeningCard
						{card}
						featured={index === 0}
						onResume={() => resume(card)}
					/>
				{/each}
			</div>
		</section>
	{/if}

	{#if featuredSeries.length > 0}
		<section class="border-t border-(--hairline) py-14" aria-labelledby="home-featured-title">
			<SectionHeader
				id="home-featured-title"
				eyebrow="Featured series"
				title="Browse the shelf"
				description="Drag, swipe or use the arrow keys. Select the centre cover to open the series."
			>
				{#snippet action()}
					<Button kind="outlined" as="a" href="/library/explore">View all</Button>
				{/snippet}
			</SectionHeader>

			<CoverFlow items={featuredSeries} label="Featured series" />
		</section>
	{/if}

	<div class="border-t border-(--hairline)">
		{@render discoverSection()}
	</div>

	<HomeBookmarksSection />

	<!-- DESIGN.md cta-band -->
	<section
		class="relative isolate mt-6 overflow-hidden rounded-2xl border border-(--hairline) bg-surfaceContainerLowest px-6 py-16 text-center sm:py-24"
		aria-labelledby="home-cta-title"
	>
		<div class="bg-mesh absolute inset-0 -z-1 opacity-60" aria-hidden="true"></div>
		<div class="mb-4 text-eyebrow text-onSurfaceVariant">Listen anywhere</div>
		<h2 id="home-cta-title" class="mx-auto max-w-2xl text-headline-lg text-balance sm:text-display-xl">
			Take the silence with you.
		</h2>
		<p class="mx-auto mt-4 max-w-lg text-body-lg text-onSurfaceVariant">
			Download any discourse for offline listening, or let Shorts surprise you with a moment.
		</p>
		<div class="mt-8 flex flex-wrap items-center justify-center gap-3">
			<Button as="a" href="/library/shorts" class="h-11 px-5">
				<Icon type="musicNote" class="size-5" />
				Try Shorts
			</Button>
			<Button kind="outlined" as="a" href="/library/explore" class="h-11 px-5">
				Explore library
			</Button>
		</div>
	</section>

	<button
		onclick={() => void goto('/settings')}
		class="interactable mt-6 w-full gap-3 rounded-lg border border-dashed border-(--hairline-strong) px-4 py-3 text-left"
	>
		<Icon type="information" class="size-5 shrink-0 text-tertiary" />
		<span class="flex-1 text-body-sm text-onSurfaceVariant">
			App is in early development. Help us improve!
		</span>
		<Icon type="chevronRight" class="size-5 shrink-0 opacity-50" />
	</button>

	<SiteFooter />
</div>

<style>
	@media (any-hover: hover) and (prefers-reduced-motion: no-preference) {
		:global(.shuffle-button:hover svg) {
			transform: rotate(180deg);
			transition: transform 500ms var(--ease-calm);
		}
	}
</style>
