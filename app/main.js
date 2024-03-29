const attributeDomainsClassifier = {
    suggestDomain: function(attributeTitle) {
        var dataType = 'VARCHAR(255)';

        const LHS = Object.keys(DATA_TYPE_ASSOCIATION_RULES);

        if (LHS.includes(attributeTitle)) {
            dataType = DATA_TYPE_ASSOCIATION_RULES[attributeTitle]['type'];
        }

        return dataType;
    }
};

const attributeUniqueClassifier = {
    vocabulary: UNIQUE_ATTRIBUTES,

    logit: function(x) {
        return 1 / (1 + Math.exp(-x));
    },

    suggestUnique: function(attributeTitle) {
        let x = 0;

        if (this.vocabulary.includes(attributeTitle)) {
            x++;
        }

        return this.logit(x) > 0.5;
    }
};

const attributeNotNullClassifier = {
    vocabulary: NOT_NULL_ATTRIBUTES,

    logit: function(x) {
        return 1 / (1 + Math.exp(-x));
    },

    suggestNotNull: function(attributeTitle) {
        let x = 0;

        if (this.vocabulary.includes(attributeTitle)) {
            x++;
        }

        return this.logit(x) > 0.5;
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

            let createTable = `CREATE TABLE \`${table}\` (\n\t\`${this.tables[table].primary}\` INTEGER`;

            if (this.tables[table].foreign.length > 0) {
                for (const i in this.tables[table].foreign) {
                    if (this.tables[table].foreign[i].key !== this.tables[table].primary) {
                        createTable += `,\n\t\`${this.tables[table].foreign[i].key}\` INTEGER`;
                    }
                }
            }

            for (const i in this.tables[table].fields) {
                createTable += `,\n\t\`${this.tables[table].fields[i]}\` ${attributeDomainsClassifier.suggestDomain(this.tables[table].fields[i])}${attributeNotNullClassifier.suggestNotNull(this.tables[table].fields[i]) ? ' NOT NULL' : ''}`;
            }

            createTable += '\n);';
            this.script += createTable;
        }

        for (const table in this.tables) {
            const alterPrimaryKey = `ALTER TABLE \`${table}\`\nMODIFY \`${this.tables[table].primary}\` INTEGER AUTO_INCREMENT PRIMARY KEY;`;

            this.script += alterPrimaryKey;
        }

        for (const table in this.tables) {
            if (this.tables[table].foreign.length > 0) {
                for (const i in this.tables[table].foreign) {
                    let alterForeignKey = `ALTER TABLE \`${table}\`\nMODIFY \`${this.tables[table].foreign[i].key}\` INTEGER NOT NULL;`;

                    this.script += alterForeignKey;

                    alterForeignKey = `ALTER TABLE \`${table}\`\nADD FOREIGN KEY (\`${this.tables[table].foreign[i].key}\`) REFERENCES \`${this.tables[table].foreign[i].table}\`(\`${this.tables[table].foreign[i].key}\`);`;

                    this.script += alterForeignKey;
                }
            }
        }

        for (const table in this.tables) {
            for (const i in this.tables[table].fields) {
                if (attributeUniqueClassifier.suggestUnique(this.tables[table].fields[i])) {
                    const alterUniqueIndex = `ALTER TABLE \`${table}\`\nADD UNIQUE (\`${this.tables[table].fields[i]}\`);`;

                    this.script += alterUniqueIndex;
                }
            }
        }

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