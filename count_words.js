let attributes = [
]

let words = []

attributes.forEach(x => {
	let parsed = x.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(' ')

	parsed.forEach(word => {
		if (typeof words[word] === 'undefined') {
			words[word] = 1
		} else {
			words[word]++
		}
	})
})

for (let word in words) {
	if (words[word] > 0) {
		console.log(`${word} ${words[word]}`)
	}
}
