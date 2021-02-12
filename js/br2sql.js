$('#clearAll').click(function() {
    $('#databaseName').val('')
    $('#businessRules').val('')
})

const dateTimeTags = ['time', 'date', 'from', 'to', 'end', 'start', 'until', 'due', 'arrival', 'departure', 'modified', 'created', 'deleted', 'issued', 'posted', 'published', 'received', 'sent', 'scheduled']

const numberTags = ['number', 'num', 'value', 'price', 'max', 'min', 'rate', 'age', 'amount', 'rating', 'year', 'salary', 'frequency', 'payment', 'offset', 'loan', 'quantity', 'capacity', 'percentage', 'billing', 'increment', 'cash', 'cost', 'unit', 'discount', 'dose', 'exchange', 'radius', 'interest', 'latitude', 'longitude', 'median', 'point', 'earned', 'count', 'total']

const uidsTags = ['id', 'identifier', 'unique', 'uid', 'isbn', 'issn', 'doi', 'orcid', 'ssn', 'vin', 'tin', 'sku', 'oid', 'uuid']

const domain = function(title) {
    const tokens = title.split('_')

    let dateTimeFreq = 0,
        numberFreq = 0

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

const p = x => 1 / (1 + Math.exp(-x))

const unique = function(title) {
    const tokens = title.split('_')

    let match = 0

    for (let token in tokens) {
        token = tokens[token]

        if (uidsTags.includes(token)) {
            match++
        }
    }

    return p(match) > 0.5
}

const translateBr2Sql = function() {
    const dbName = $('#databaseName').val()
    const businessRulesText = $('#businessRules').val()

    const fact = function(rule) {
        const regex = /(each|some)\s+(.+)\s+((is).+)\s+(one|many)\s+(.+)/g
        return regex.exec(rule.toLowerCase())
    }

    const definition = function(rule) {
        const regex = /(each)\s+(.+)(has)\s+(.+)/g
        return regex.exec(rule.toLowerCase())
    }

    let businessRules = businessRulesText.split('.')

    businessRules = businessRules.filter(x => x.length > 0)
    businessRules.forEach((x, i) => businessRules[i] = x.trim())

    const tables = []

    for (const rule in businessRules) {
        let parsed = fact(businessRules[rule])

        if (parsed !== null) {
            parsed.forEach((x, i) => parsed[i] = x.trim().replace(/\s+/g, '_'))

            const subject = parsed[2]
            const cardinality = parsed[5]
            const object = parsed[6]

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

                const subject = parsed[2].replace(/\s+/g, '_')
                const object = parsed[4]

                const attributes = object.split(',')
                attributes.forEach((x, i) => attributes[i] = x.trim().replace(/\s+/g, '_'))

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

    let script = ``

    if ($('#includeDropDB').is(':checked')) {
        script += `DROP DATABASE IF EXISTS \`${dbName}\`;`
    }

    if ($('#includeCreateDB').is(':checked')) {
        script += `CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`
    }

    script += `USE \`${dbName}\`;`

    for (const table in tables) {
        if ($('#includeDropTables').is(':checked')) {
            script += `DROP TABLE IF EXISTS \`${table}\`;`
        }

        let createTable = `CREATE TABLE \`${table}\` ( \`${tables[table].primary}\` INTEGER`

        if (tables[table].foreign.length > 0) {
            for (const i in tables[table].foreign) {
                if (tables[table].foreign[i].key !== tables[table].primary) {
                    createTable += `, \`${tables[table].foreign[i].key}\` INTEGER`
                }
            }
        }

        for (const i in tables[table].fields) {
            createTable += `, \`${tables[table].fields[i]}\` ${domain(tables[table].fields[i])}`
        }

        createTable += ');'
        script += createTable
    }

    for (const table in tables) {
        const alterPrimaryKey = `ALTER TABLE \`${table}\` MODIFY \`${tables[table].primary}\` INTEGER AUTO_INCREMENT PRIMARY KEY;`

        script += alterPrimaryKey
    }

    for (const table in tables) {
        if (tables[table].foreign.length > 0) {
            for (const i in tables[table].foreign) {
                let alterForeignKey = `ALTER TABLE \`${table}\` MODIFY \`${tables[table].foreign[i].key}\` INTEGER NOT NULL;`

                script += alterForeignKey

                alterForeignKey = `ALTER TABLE \`${table}\` ADD FOREIGN KEY (\`${tables[table].foreign[i].key}\`) REFERENCES \`${tables[table].foreign[i].table}\`(\`${tables[table].foreign[i].key}\`);`

                script += alterForeignKey
            }
        }
    }

    for (const table in tables) {
        for (const i in tables[table].fields) {
            if (unique(tables[table].fields[i])) {
                const alterUniqueIndex = `ALTER TABLE \`${table}\` ADD UNIQUE (\`${tables[table].fields[i]}\`);`

                script += alterUniqueIndex
            }
        }
    }

    script = script.replace(/\s+/g, ' ')
    script = script.split(';').join(';\n\n')

    $('#sqlStatements').text(script)

    $(document).ready(function() {
        $('pre code').each(function(i, block) {
            hljs.highlightBlock(block)
        })
    })

    return false
}

translateBr2Sql()

const copySQL = function() {
    navigator.clipboard.writeText($('#sqlStatements').text()).then(function() {
        alert('SQL statements copied to clipboard!')
    });
}