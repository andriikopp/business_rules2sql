let dbName = 'DB_SYNTHESIS'
let businessRulesText = 'Each supplier has address, email, phone. Some supplier is described as one person. Some supplier is described as one company. Each person has first name, last name, ssn. Each company has name, contact person, bank account. Each product has sku, title, amount, price, discount. Each supplier is assigned to many contract. Each contract is assigned to many product. Each contract has number, date, comment.'

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

var uidsTags = ['id', 'identifier', 'unique', 'uid', 'isbn', 'issn', 'doi', 'orcid', 'ssn', 'vin', 'tin', 'sku', 'oid', 'uuid']

var constraints = {
	'age': '`age` >= 0',
	'price': '`price` > 0',
	'discount': '`discount` >= 0 AND `discount` <= 100',
	'amount': '`amount` > 0'
}

let domain = function(title) {
	let tokens = title.split('_')

	let dateTimeFreq = 0, numberFreq = 0

	for (let token in tokens) {
		token = tokens[token]

		if (dateTimeTags.includes(token)) {
			dateTimeFreq++
		}

		if (numberTags.includes(token)) {
			numberFreq++
		}
	}

	dateTimeFreq /= tokens.length
	numberFreq /= tokens.length

	if (dateTimeFreq > numberFreq) {
		return 'DATETIME'
	} else if (numberFreq > dateTimeFreq) {
		return 'DECIMAL(8,2)'
	} else {
		return 'VARCHAR(255)'
	}
}

let p = x => 1 / (1 + Math.exp(-x))

let unique = function(title) {
	let tokens = title.split('_')

	let match = 0

	for (let token in tokens) {
		token = tokens[token]

		if (uidsTags.includes(token)) {
			match++
		}
	}

	return p(match) > 0.5
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
	let alterPrimaryKey = `ALTER TABLE \`${table}\` MODIFY \`${tables[table].primary}\` INTEGER AUTO_INCREMENT PRIMARY KEY;`

	script += alterPrimaryKey
}

for (let table in tables) {
	if (tables[table].foreign.length > 0) {
		for (let i in tables[table].foreign) {
			let alterForeignKey = `ALTER TABLE \`${table}\` MODIFY \`${tables[table].foreign[i].key}\` INTEGER NOT NULL;`

			script += alterForeignKey

			alterForeignKey = `ALTER TABLE \`${table}\` ADD FOREIGN KEY (\`${tables[table].foreign[i].key}\`) REFERENCES \`${tables[table].foreign[i].table}\`(\`${tables[table].foreign[i].key}\`);`

			script += alterForeignKey
		}
	}
}

for (let table in tables) {
	for (let i in tables[table].fields) {
		if (unique(tables[table].fields[i])) {
			let alterUniqueIndex = `ALTER TABLE \`${table}\` ADD UNIQUE (\`${tables[table].fields[i]}\`);`

			script += alterUniqueIndex
		}
	}
}

let checkFields = {}

for (let table in tables) {
	checkFields[table] = []

	for (let i in tables[table].fields) {
		if (tables[table].fields[i] in constraints) {
			checkFields[table].push(tables[table].fields[i])
		}
	}
}

for (let table in checkFields) {
	if (checkFields[table].length > 0) {
		let alterConstraint = `ALTER TABLE \`${table}\` ADD CONSTRAINT \`${table}_constraint\` CHECK (`

		for (let i = 0; i < checkFields[table].length; i++) {
			alterConstraint += '(' + constraints[checkFields[table][i]] + ')'

			if (i < checkFields[table].length - 1) {
				alterConstraint += ' AND '
			}
		}

		script += alterConstraint + ');'
	}
}

script = script.replace(/\s+/g, ' ')
script = script.split(';').join(';\n')

console.log(script)
