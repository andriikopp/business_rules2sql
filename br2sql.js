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

var dateTimeTags = ['time', 'date', 'from', 'to', 'end', 'start', 'until', 'due', 'arrival', 'departure', 'modified', 'created', 'deleted', 'issued', 'posted', 'published', 'received', 'sent', 'scheduled']

var numberTags = ['number', 'num', 'value', 'price', 'max', 'min', 'rate', 'age', 'amount', 'rating', 'year', 'salary', 'frequency', 'payment', 'offset', 'loan', 'quantity', 'capacity', 'percentage', 'billing', 'increment', 'cash', 'cost', 'unit', 'discount', 'dose', 'exchange', 'radius', 'interest', 'latitude', 'longitude', 'median', 'point', 'earned', 'count', 'total']

let domain = function(title) {
	let tokens = title.split('_')

	let dateTimeOccurrence = 0
	let numberOccurrence = 0

	for (let tag in dateTimeTags) {
		if (tokens.includes(dateTimeTags[tag])) {
			dateTimeOccurrence++
		}
	}

	for (let tag in numberTags) {
		if (tokens.includes(numberTags[tag])) {
			numberOccurrence++
		}
	}

	if (dateTimeOccurrence > numberOccurrence) {
		return 'DATETIME'
	} else if (numberOccurrence > dateTimeOccurrence) {
		return 'DECIMAL'
	} else {
		return 'TEXT'
	}
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
