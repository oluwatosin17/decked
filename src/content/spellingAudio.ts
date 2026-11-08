const AUDIO_IDS: Record<string, string> = {
  'lantern': '616724102448eb2b',
  'puzzle': 'f651f48c63523060',
  'blanket': '1ec1d81b45eafcbe',
  'basket': '6981c9531f0e09a7',
  'festival': '4d12e321aad4982c',
  'journey': '0ada982c35ec4edf',
  'thunder': '53b6ba416107954b',
  'whisper': '960e380700bd5ed2',
  'diamond': 'dc0bb21935482970',
  'cinnamon': '3eff3cceb8ad1e3e',
  'treasure': '20937ea7d81d1e60',
  'calendar': '518b7df2c8ffcbde',
  'adventure': '3b8ee248078331ad',
  'silhouette': 'a368f3a673690d5b',
  'occasion': '5d169afa35413ec5',
  'rhythm': '212b35790d7028ec',
  'mischief': '7d1eddf991634415',
  'restaurant': '47801ebd759980d8',
  'boulevard': 'a976096e56540017',
  'exaggerate': '0a65e312b06fa2cb',
  'conscience': '68cb471850b81a53',
  'courteous': '76c86f11afaea193',
  'persuade': 'c549be9d9dc84750',
  'necessary': 'c07ef67cb86002db',
  'accommodate': '718604d056198ed1',
  'entrepreneur': '714de8a0c16e1cc8',
  'bureaucracy': '98cdbff287787997',
  'conscientious': 'c9a11086431fb0c4',
  'resilience': '2f83a6a1671f8cac',
  'onomatopoeia': '9807227326f30faf',
  'idiosyncrasy': '21bf2beb7a7e2fe2',
  'chrysanthemum': 'ef82b72b119ac570',
  'miscellaneous': '8629f155e61bb326',
  'quintessential': '24ca445ba048bd4b',
  'indispensable': 'd1645528f9a92953',
  'fluorescent': '28d3d97ee647ee30',
}

export function spellingAudioId(word: string): string | null {
  return AUDIO_IDS[word.toLowerCase()] ?? null
}

export function spellingAudioUrl(word: string): string | null {
  const id = spellingAudioId(word)
  return id ? `/assets/spelling-pronunciations/${id}.wav` : null
}
