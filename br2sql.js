let dbName = 'DB_SYNTHESIS'
let businessRulesText = 'Each supplier has address, email, phone. Some supplier is described as one person. Some supplier is described as one company. Each person has first name, last name, ssn. Each company has name, contact person, bank account. Each product has sku, title, amount, price. Each supplier is assigned to many contract. Each contract is assigned to many product. Each contract has number, date, comment.'

let fact = function(rule) {
	let regex = /(each|some)\s+(.+)\s+((is).+)\s+(one|many)\s+(.+)/g
	return regex.exec(rule.toLowerCase())
}

let definition = function(rule) {
	let regex = /(each)\s+(.+)(has)\s+(.+)/g
	return regex.exec(rule.toLowerCase())
}

var booleanTags = ['is', 'value', 'allowed', 'loan', 'abridged', 'accepts', 'reservations', 'cash', 'back', 'contactless', 'payment', 'does', 'not', 'ship', 'domiciled', 'mortgage', 'has', 'drive', 'through', 'service', 'health', 'plan', 'cost', 'sharing', 'in', 'store', 'returns', 'offered', 'accepting', 'new', 'patients', 'accessible', 'for', 'free', 'available', 'generically', 'family', 'friendly', 'gift', 'live', 'broadcast', 'proprietary', 'resizable', 'unlabelled', 'fallback', 'job', 'immediate', 'start', 'multiple', 'offers', 'prescription', 'by', 'mail', 'pets', 'public', 'access', 'readonly', 'recourse', 'renegotiable', 'representative', 'of', 'page', 'requires', 'subscription', 'smoking', 'added', 'tax', 'included', 'required']

var dateTimeTags = ['time', 'date', 'from', 'arrival', 'through', 'coverage', 'end', 'start', 'availability', 'available', 'checkin', 'modified', 'expected', 'owned', 'temporal', 'valid', 'ends', 'starts', 'booking', 'checkout', 'comment', 'content', 'reference', 'cvd', 'collection', 'created', 'deleted', 'issued', 'posted', 'published', 'read', 'received', 'sent', 'departure', 'door', 'dropoff', 'except', 'until', 'margin', 'of', 'error', 'observation', 'order', 'payment', 'due', 'pickup', 'scheduled', 'web']

var numberTags = ['number', 'of', 'cvd', 'num', 'value', 'price', 'max', 'min', 'rate', 'age', 'beds', 'pats', 'vent', 'amount', 'rating', 'year', 'salary', 'frequency', 'child', 'per', 'occ', 'icubeds', 'payment', 'offset', 'loan', 'bathrooms', 'quantity', 'seating', 'capacity', 'suggested', 'additional', 'guests', 'this', 'good', 'annual', 'percentage', 'base', 'best', 'billing', 'increment', 'broadcast', 'cash', 'back', 'copyright', 'cost', 'unit', 'c19died', 'c19hopats', 'c19hosp', 'c19mech', 'c19ofmech', 'c19overflow', 'tot', 'use', 'discount', 'dose', 'down', 'elevation', 'emissions', 'co2', 'end', 'estimated', 'exchange', 'spread', 'geo', 'radius', 'health', 'plan', 'coinsurance', 'high', 'interest', 'latitude', 'longitude', 'low', 'median', 'membership', 'points', 'earned', 'monthly', 'minimum', 'repayment', 'airbags', 'axles', 'bedrooms', 'doors', 'forward', 'gears', 'full', 'payments', 'partial', 'previous', 'owners', 'rooms', 'numbered', 'position', 'order', 'percentile10', 'percentile25', 'percentile75', 'percentile90', 'repetitions', 'required', 'screen', 'count', 'stage', 'as', 'start', 'step', 'strength', 'terms', 'total', 'vehicle', 'version', 'worst', 'built']

var textTags = ['type', 'number', 'code', 'name', 'id', 'health', 'plan', 'category', 'requirements', 'unit', 'broadcast', 'value', 'of', 'price', 'vehicle', 'platform', 'text', 'status', 'educational', 'accessibility', 'address', 'warning', 'language', 'rating', 'location', 'size', 'currency', 'recipe', 'action', 'option', 'frequency', 'body', 'version', 'service', 'required', 'method', 'cost', 'course', 'description', 'program', 'requirement', 'product', 'item', 'job', 'postal', 'print', 'target', 'access', 'mode', 'region', 'application', 'sub', 'arrival', 'edition', 'section', 'class', 'group', 'tier', 'content', 'supported', 'work', 'credential', 'cvd', 'departure', 'discount', 'drug', 'level', 'flight', 'list', 'gender', 'in', 'order', 'title', 'legislation', 'range', 'page', 'payment', 'seat', 'video', 'feature', 'account', 'ingredient', 'additional', 'variable', 'headline', 'gate', 'terminal', 'art', 'article', 'pathophysiology', 'available', 'bank', 'bed', 'box', 'channel', 'timezone', 'bus', 'by', 'day', 'sample', 'system', 'color', 'origin', 'countries', 'prerequisites', 'accepted', 'date', 'facility', 'data', 'element', 'form', 'configuration', 'eidr', 'awarded', 'role', 'to', 'eligible', 'encoding', 'format', 'estimated', 'network', 'honorific', 'prefix', 'suffix', 'identifier', 'benefits', 'start', 'jurisdiction', 'knows', 'legal', 'lodging', 'material', 'standard', 'model', 'proprietary', 'occupational', 'hours', 'end', 'passenger', 'pattern', 'usage', 'post', 'op', 'programming', 'cuisine', 'yield', 'strength', 'review', 'security', 'label', 'software', 'special', 'temporal', 'ticket', 'time', 'train', 'transmission', 'measured', 'interior', 'abstract', 'accepts', 'reservations', 'api', 'control', 'hazard', 'summary', 'accommodation', 'acriss', 'active', 'activity', 'country', 'locality', 'administration', 'route', 'aircraft', 'alcohol', 'algorithm', 'alignment', 'alternate', 'alternative', 'suite', 'area', 'served', 'medium', 'artform', 'artwork', 'surface', 'assembly', 'assesses', 'associated', 'audience', 'on', 'device', 'award', 'backstory', 'beneficiary', 'best', 'biomechnical', 'bitrate', 'boarding', 'book', 'branch', 'breadcrumb', 'breastfeeding', 'display', 'signal', 'modulation', 'browser', 'call', 'sign', 'caption', 'carrier', 'catalog', 'character', 'circle', 'citation', 'claim', 'reviewed', 'clinical', 'pharmacology', 'clip', 'coding', 'comment', 'competency', 'conditions', 'confirmation', 'contact', 'contraindication', 'cooking', 'correction', 'per', 'not', 'workload', 'creative', 'currencies', 'collection', 'county', 'feed', 'dateline', 'default', 'dependencies', 'diet', 'features', 'disambiguating', 'dosage', 'dose', 'drive', 'wheel', 'duns', 'edit', 'education', 'framework', 'use', 'elevation', 'eligibility', 'email', 'employer', 'overview', 'employment', 'engine', 'epidemiology', 'episode', 'duration', 'evidence', 'executable', 'library', 'exercise', 'exif', 'expected', 'prognosis', 'experience', 'expert', 'considerations', 'family', 'fax', 'fees', 'and', 'commissions', 'specification', 'file', 'financial', 'aid', 'distance', 'floor', 'followup', 'food', 'fuel', 'functional', 'game', 'genre', 'geo', 'radius', 'given', 'global', 'gtin', 'gtin12', 'gtin13', 'gtin14', 'gtin8', 'has', 'menu', 'coinsurance', 'copay', 'pharmacy', 'high', 'how', 'performed', 'http', 'iata', 'icao', 'with', 'support', 'incentive', 'compensation', 'industry', 'ineligible', 'infectious', 'agent', 'intensity', 'interactivity', 'isbn', 'isic', 'v4', 'isrc', 'issn', 'issue', 'iswc', 'keywords', 'known', 'damages', 'about', 'latitude', 'learning', 'resource', 'lei', 'line', 'link', 'relationship', 'loan', 'longitude', 'low', 'extent', 'meal', 'measurement', 'technique', 'mechanism', 'meets', 'emission', 'membership', 'memory', 'mpn', 'muscle', 'music', 'composition', 'musical', 'key', 'naics', 'natural', 'progression', 'non', 'normal', 'nsn', 'airbags', 'opening', 'operating', 'overdosage', 'ownership', 'funding', 'info', 'pagination', 'priority', 'sequence', 'permissions', 'permitted', 'pets', 'allowed', 'phonetic', 'physical', 'physiological', 'player', 'polygon', 'position', 'possible', 'complication', 'office', 'begin', 'pre', 'pregnancy', 'preparation', 'prescription', 'column', 'procedure', 'processor', 'proficiency', 'property', 'provider', 'mobility', 'publication', 'qualifications', 'query', 'explanation', 'instructions', 'recommendation', 'release', 'notes', 'repeat', 'report', 'collateral', 'quantity', 'reservation', 'responsibilities', 'rest', 'periods', 'aspect', 'risks', 'runtime', 'rxcui', 'safety', 'consideration', 'salary', 'schedule', 'schema', 'season', 'row', 'seating', 'clearance', 'screening', 'sensory', 'serial', 'serves', 'serving', 'shipping', 'significance', 'skills', 'sku', 'slogan', 'commitments', 'speech', 'markup', 'sport', 'step', 'storage', 'street', 'structural', 'stage', 'subtitle', 'suggested', 'supply', 'population', 'tax', 'teaches', 'telephone', 'coverage', 'term', 'terms', 'ticker', 'symbol', 'token', 'tissue', 'tool', 'total', 'tourist', 'tracking', 'transcript', 'transit', 'typical', 'age', 'url', 'template', 'uses', 'variables', 'variant', 'cover', 'varies', 'vat', 'identification', 'frame', 'quality', 'volume', 'worst']

let domain = function(title) {
	let tokens = title.split('_')

	for (let token in tokens) {
		token = tokens[token]

		if (booleanTags.includes(token)) {
			return 'BOOLEAN'
		} else if (dateTimeTags.includes(token)) {
			return 'DATETIME'
		} else if (numberTags.includes(token)) {
			return 'DECIMAL'
		} else if (textTags.includes(token)) {
			return 'TEXT'
		}
	}

	return 'BLOB'
}

let businessRules = businessRulesText.split('.')

businessRules = businessRules.filter(x => x.length > 0)
businessRules.forEach((x, i) => businessRules[i] = x.trim())

let tables = []

for (let rule in businessRules) {
	let parsed = fact(businessRules[rule])

	if (parsed !== null) {
		parsed.forEach((x, i) => parsed[i] = x.trim().replace(/\s+/g , '_'))

		let subject = parsed[2]
		let cardinality = parsed[5]
		let object = parsed[6]

		if (typeof tables[subject] === 'undefined') {
			tables[subject] = {
				primary: subject + '_id',
				foreign: [],
				fields: []
			}
		}

		if (typeof tables[object] === 'undefined') {
			tables[object] = {
				primary: null,
				foreign: [],
				fields: []
			}
		}

		if (cardinality === 'one') {
			tables[object].primary = subject + '_id'
			tables[object].foreign.push({
				key: subject + '_id',
				table: subject
			})
		} else if (cardinality === 'many') {
			tables[object].primary = object + '_id'
			tables[object].foreign.push({
				key: subject + '_id',
				table: subject
			})
		}
	} else {
		parsed = definition(businessRules[rule])

		if (parsed !== null) {
			parsed.forEach((x, i) => parsed[i] = x.trim())

			let subject = parsed[2].replace(/\s+/g , '_')
			let object = parsed[4]

			let attributes = object.split(',')
			attributes.forEach((x, i) => attributes[i] = x.trim().replace(/\s+/g , '_'))

			if (typeof tables[subject] === 'undefined') {
				tables[subject] = {
					primary: subject + '_id',
					foreign: [],
					fields: attributes
				}
			} else {
				tables[subject].fields = attributes
			}
		}
	}
}

let script = `DROP DATABASE IF EXISTS \`${dbName}\`;`
script += `CREATE DATABASE \`${dbName}\`;`
script += `USE \`${dbName}\`;`

for (let table in tables) {
	let createTable = `CREATE TABLE \`${table}\` ( \`${tables[table].primary}\` INTEGER`

	if (tables[table].foreign.length > 0) {
		for (let i in tables[table].foreign) {
			if (tables[table].foreign[i].key !== tables[table].primary) {
				createTable += `, \`${tables[table].foreign[i].key}\` INTEGER`
			}
		}
	}

	for (let i in tables[table].fields) {
		createTable += `, \`${tables[table].fields[i]}\` ${domain(tables[table].fields[i])}`
	}

	createTable += ');'
	script += createTable
}

for (let table in tables) {
	let alterPrimaryKey = `ALTER TABLE \`${table}\` ADD PRIMARY KEY (\`${tables[table].primary}\`);`

	script += alterPrimaryKey
}

for (let table in tables) {
	if (tables[table].foreign.length > 0) {
		for (let i in tables[table].foreign) {
			let alterForeignKey = ` ALTER TABLE \`${table}\` ADD FOREIGN KEY (\`${tables[table].foreign[i].key}\`) REFERENCES \`${tables[table].foreign[i].table}\`(\`${tables[table].foreign[i].key}\`);`

			script += alterForeignKey
		}
	}
}

script = script.replace(/\s+/g , ' ')

console.log(script)
