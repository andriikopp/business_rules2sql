<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">

    <link rel="stylesheet" href="highlightjs/styles/default.css">
    <link href="https://fonts.googleapis.com/css?family=Kanit" rel="stylesheet" />
    <link rel="stylesheet" href="css/bootstrap.min.css">
    <link rel="stylesheet" href="css/main.css">

    <script src="highlightjs/highlight.pack.js"></script>
    <script>
        hljs.initHighlightingOnLoad();
    </script>

    <title>BR2SQL — Translate Business Rules into SQL</title>
    <meta name="title" content="BR2SQL — Translate Business Rules into SQL">
    <meta name="description" content="Free online service for business rules translation into a database components. Generates SQL DDL commands to create a database.">

    <meta name="keywords" content="database,sql,online,commands,components,rules,translation,ddl">

    <meta name="robots" content="index, follow">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="language" content="English">

    <meta name="viewport" content="width=device-width, initial-scale=1">

    <link rel="icon" type="image/png" href="img/icon.png" />
</head>

<body>
    <nav class="navbar navbar-light bg-light">
        <a class="navbar-brand" href="javascript:void(0);">
            <img src="img/logo.png" width="30" height="30" class="d-inline-block align-top" alt="logo"> <b class="text-muted">BR2SQL</b> — Translate Business Rules into a Database Schema
        </a>
    </nav>
    <div class="container custom-container">
        <div class="row">
            <div class="col-4">
                <div class="form-group">
                    <label for="businessRules">Business Rules</label>
                    <br>
                    <label for="businessRules"><small><b>Attributes</b>: Each "entity name" has "attribute",
                            "attribute", ...,
                            "attribute".</small></label>
                    <br>
                    <label for="businessRules"><small><b>e.g.</b> Each student has full name, student card id, birth
                            date, enrollment date.</small></label>
                    <br>
                    <label for="businessRules"><small><b>Relationships</b>: (Each | Some) "entity name" is "relationship
                            description" (one | many) "entity name".</small></label>
                    <br>
                    <label for="businessRules"><small><b>e.g.</b> Each student is given by many score.</small></label>
                    <textarea class="form-control" id="businessRules" rows="12" onchange="translateBRToSQL();">Each student has full name, student card id, birth date, enrollment date. Each student is given by many score. Each course has title, semester, approval date. Each course is evaluated by many score. Each score has value, completion date.</textarea>
                </div>
                <div class="form-group">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="clearAll();">Clear</button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="translateBRToSQL();">Translate</button>
                </div>
                <p><small>This service is a prototype created for academic purposes, therefore
                        certain features may not work properly.</small></p>
            </div>
            <div class="col-6">
                <label for="sqlStatements">SQL Statements</label>
                <pre><code class="lang-sql custom-editor" id="sqlStatements"></code></pre>
            </div>
            <div class="col-2">
                <label>Database Settings</label>
                <div class="form-group">
                    <label for="databaseName"><small><b>Database Name</b></small></label>
                    <input type="text" class="form-control" id="databaseName" value="sample_db" onchange="translateBRToSQL();">
                </div>

                <label><small><b>Optional Scripts</b></small></label>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="" id="includeDropDB" onchange="translateBRToSQL();" checked>
                    <label class="form-check-label" for="includeDropDB"><small>Drop database</small></label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="" id="includeCreateDB" onchange="translateBRToSQL();" checked>
                    <label class="form-check-label" for="includeCreateDB"><small>Create database</small></label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="" id="includeDropTables" onchange="translateBRToSQL();">
                    <label class="form-check-label" for="includeDropTables"><small>Drop tables</small></label>
                </div>
                <br>

                <label><small><b>SQL Dialect</b></small></label>
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="sqlDialect" id="mysql" value="mysql" checked>
                    <label class="form-check-label" for="sqlDialect"><small>MySQL</small></label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="sqlDialect" id="sqlserver" value="sqlserver" disabled>
                    <label class="form-check-label" for="sqlDialect"><small>SQL Server</small></label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="sqlDialect" id="oracle" value="oracle" disabled>
                    <label class="form-check-label" for="sqlDialect"><small>Oracle</small></label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="sqlDialect" id="postgres" value="postgres" disabled>
                    <label class="form-check-label" for="sqlDialect"><small>Postgres</small></label>
                </div>

                <br>
                <div class="form-group">
                    <button type="submit" class="btn btn-secondary btn-sm" onclick="copySQL();">Copy to
                        Clipboard</button>
                </div>
                <a href="https://github.com/andriikopp/business_rules2sql" target="_blank"><small>Contact or
                        Contribute</small></a>
            </div>
        </div>
    </div>

    <nav class="navbar fixed-bottom navbar-light bg-light">
        <small>
            <b class="text-muted">BR2SQL</b> <a href="https://creativecommons.org/licenses/by-nd/4.0/">CC BY-ND
                License</a>
            2020-<span id="year"></span>
        </small>
    </nav>

    <script src="js/jquery-3.4.1.min.js"></script>
    <script src="js/popper.min.js"></script>
    <script src="js/bootstrap.min.js"></script>

    <script src="app/rules.js"></script>
    <script src="app/notnull.js"></script>
    <script src="app/unique.js"></script>
    <script src="app/main.js"></script>

    <script>
        $('#year').text(new Date().getFullYear());

        translateBRToSQL();
    </script>
</body>

</html>