const attributeDomainsClassifier = {
    dateTimeTags: ['time', 'date', 'from', 'to', 'end', 'start', 'until', 'due', 'arrival', 'departure', 'modified', 'created', 'deleted', 'issued', 'posted', 'published', 'received', 'sent', 'scheduled'],

    numberTags: ['number', 'num', 'value', 'price', 'max', 'min', 'rate', 'age', 'amount', 'rating', 'year', 'salary', 'frequency', 'payment', 'offset', 'loan', 'quantity', 'capacity', 'percentage', 'billing', 'increment', 'cash', 'cost', 'unit', 'discount', 'dose', 'exchange', 'radius', 'interest', 'latitude', 'longitude', 'median', 'point', 'earned', 'count', 'total'],

    suggestDomain: function(attributeTitle) {
        const tokens = attributeTitle.split('_');

        let dateTimeFreq = 0;
        let numberFreq = 0;

        for (let token in tokens) {
            token = tokens[token];

            if (this.dateTimeTags.includes(token)) {
                dateTimeFreq++;
            }

            if (this.numberTags.includes(token)) {
                numberFreq++;
            }
        }

        dateTimeFreq /= tokens.length;
        numberFreq /= tokens.length;

        if (dateTimeFreq > numberFreq) {
            return 'DATETIME';
        } else if (numberFreq > dateTimeFreq) {
            return 'DECIMAL(8,2)';
        } else {
            return 'VARCHAR(255)';
        }
    }
};

const attributeUniqueClassifier = {
    uidsTags: ['id', 'identifier', 'unique', 'uid', 'isbn', 'issn', 'doi', 'orcid', 'ssn', 'vin', 'tin', 'sku', 'oid', 'uuid'],

    logit: function(x) {
        return 1 / (1 + Math.exp(-x));
    },

    suggestUnique: function(attributeTitle) {
        const tokens = attributeTitle.split('_');

        let match = 0;

        for (let token in tokens) {
            token = tokens[token];

            if (this.uidsTags.includes(token)) {
                match++;
            }
        }

        return this.logit(match) > 0.5;
    }
};

const brToSQLTranslator = {
    dbName: null,
    businessRulesText: null,
    businessRules: null,
    tables: null,
    script: null,

    extractBusinessRules: function() {
        this.businessRules = this.businessRulesText.split('.');

        this.businessRules = this.businessRules.filter(x => x.length > 0);
        this.businessRules.forEach((x, i) => this.businessRules[i] = x.trim());
    },

    businessRulesToTables: function() {
        const fact = function(rule) {
            const regex = /(each|some)\s+(.+)\s+((is).+)\s+(one|many)\s+(.+)/g;
            return regex.exec(rule.toLowerCase());
        };

        const definition = function(rule) {
            const regex = /(each)\s+(.+)(has)\s+(.+)/g;
            return regex.exec(rule.toLowerCase());
        }

        this.tables = [];

        for (const rule in this.businessRules) {
            let parsed = fact(this.businessRules[rule]);

            if (parsed !== null) {
                parsed.forEach((x, i) => parsed[i] = x.trim().replace(/\s+/g, '_'));

                const subject = parsed[2];
                const cardinality = parsed[5];
                const object = parsed[6];

                if (typeof this.tables[subject] === 'undefined') {
                    this.tables[subject] = {
                        primary: subject + '_id',
                        foreign: [],
                        fields: []
                    };
                }

                if (typeof this.tables[object] === 'undefined') {
                    this.tables[object] = {
                        primary: null,
                        foreign: [],
                        fields: []
                    };
                }

                if (cardinality === 'one') {
                    this.tables[object].primary = subject + '_id';
                    this.tables[object].foreign.push({
                        key: subject + '_id',
                        table: subject
                    });
                } else if (cardinality === 'many') {
                    this.tables[object].primary = object + '_id';
                    this.tables[object].foreign.push({
                        key: subject + '_id',
                        table: subject
                    });
                }
            } else {
                parsed = definition(this.businessRules[rule]);

                if (parsed !== null) {
                    parsed.forEach((x, i) => parsed[i] = x.trim());

                    const subject = parsed[2].replace(/\s+/g, '_');
                    const object = parsed[4];

                    const attributes = object.split(',');
                    attributes.forEach((x, i) => attributes[i] = x.trim().replace(/\s+/g, '_'));

                    if (typeof this.tables[subject] === 'undefined') {
                        this.tables[subject] = {
                            primary: subject + '_id',
                            foreign: [],
                            fields: attributes
                        };
                    } else {
                        this.tables[subject].fields = attributes;
                    }
                }
            }
        }
    },

    tablesToSQL: function(isDropDbIncluded, isCreateDbIncluded) {
        this.script = '';

        if (isDropDbIncluded) {
            this.script += `DROP DATABASE IF EXISTS \`${this.dbName}\`;`;
        }

        if (isCreateDbIncluded) {
            this.script += `CREATE DATABASE IF NOT EXISTS \`${this.dbName}\`;`;
        }

        this.script += `USE \`${this.dbName}\`;`;

        for (const table in this.tables) {
            if ($('#includeDropTables').is(':checked')) {
                this.script += `DROP TABLE IF EXISTS \`${table}\`;`;
            }

            let createTable = `CREATE TABLE \`${table}\` ( \`${this.tables[table].primary}\` INTEGER`;

            if (this.tables[table].foreign.length > 0) {
                for (const i in this.tables[table].foreign) {
                    if (this.tables[table].foreign[i].key !== this.tables[table].primary) {
                        createTable += `, \`${this.tables[table].foreign[i].key}\` INTEGER`;
                    }
                }
            }

            for (const i in this.tables[table].fields) {
                createTable += `, \`${this.tables[table].fields[i]}\` ${attributeDomainsClassifier.suggestDomain(this.tables[table].fields[i])}`;
            }

            createTable += ');';
            this.script += createTable;
        }

        for (const table in this.tables) {
            const alterPrimaryKey = `ALTER TABLE \`${table}\` MODIFY \`${this.tables[table].primary}\` INTEGER AUTO_INCREMENT PRIMARY KEY;`;

            this.script += alterPrimaryKey;
        }

        for (const table in this.tables) {
            if (this.tables[table].foreign.length > 0) {
                for (const i in this.tables[table].foreign) {
                    let alterForeignKey = `ALTER TABLE \`${table}\` MODIFY \`${this.tables[table].foreign[i].key}\` INTEGER NOT NULL;`;

                    this.script += alterForeignKey;

                    alterForeignKey = `ALTER TABLE \`${table}\` ADD FOREIGN KEY (\`${this.tables[table].foreign[i].key}\`) REFERENCES \`${this.tables[table].foreign[i].table}\`(\`${this.tables[table].foreign[i].key}\`);`;

                    this.script += alterForeignKey;
                }
            }
        }

        for (const table in this.tables) {
            for (const i in this.tables[table].fields) {
                if (attributeUniqueClassifier.suggestUnique(this.tables[table].fields[i])) {
                    const alterUniqueIndex = `ALTER TABLE \`${table}\` ADD UNIQUE (\`${this.tables[table].fields[i]}\`);`;

                    this.script += alterUniqueIndex;
                }
            }
        }

        this.script = this.script.replace(/\s+/g, ' ');
        this.script = this.script.split(';').join(';\n\n');
    }
};

const translateBRToSQL = function() {
    brToSQLTranslator.dbName = $('#databaseName').val();
    brToSQLTranslator.businessRulesText = $('#businessRules').val();

    brToSQLTranslator.extractBusinessRules();
    brToSQLTranslator.businessRulesToTables();
    brToSQLTranslator.tablesToSQL($('#includeDropDB').is(':checked'), $('#includeCreateDB').is(':checked'));

    $('#sqlStatements').text(brToSQLTranslator.script);

    $(document).ready(function() {
        $('pre code').each(function(i, block) {
            hljs.highlightBlock(block);
        });
    });

    return false;
};

const clearAll = function() {
    $('#databaseName').val('');
    $('#businessRules').val('');
};

const copySQL = function() {
    navigator.clipboard.writeText($('#sqlStatements').text()).then(function() {
        alert('SQL statements copied to clipboard!')
    });
};

translateBRToSQL();