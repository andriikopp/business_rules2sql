$('#translate').submit(function() {
    let dbName = $('#databaseName').val()
    let businessRulesText = $('#businessRules').val()

    let fact = function(rule) {
        let regex = /(each|some)\s+(.+)\s+((is).+)\s+(one|many)\s+(.+)/g
        return regex.exec(rule.toLowerCase())
    }

    let definition = function(rule) {
        let regex = /(each)\s+(.+)(has)\s+(.+)/g
        return regex.exec(rule.toLowerCase())
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
            createTable += `, \`${tables[table].fields[i]}\` VARCHAR(255)`
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

    script = script.replace(/\s+/g, ' ')
    script = script.split(';').join(';\n')

    $('#sqlStatements').val(script)

    return false
})
