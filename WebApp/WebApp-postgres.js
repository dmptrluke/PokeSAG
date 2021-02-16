/*
 * Joppy Furr, 2018
 */
const express = require ('express');
const postgres = require ('pg').Client;

/*********************
 * Utility functions *
 *********************/

function clean_rows (rows)
{
    for (i = 0; i < rows.length; i++)
    {
        /* Remove the T, and chop off the milliseconds. */
        rows[i].rx_date = rows[i].rx_date.toISOString ().slice (0,19).replace ('T', ' ');
    }
}


/***********************
 * Database Connection *
 ***********************/

let db = new postgres (
    {
        user: 'username',
        password: 'password',
        host: 'localhost',
        database: 'pokesag',
        port: 'port',
    } );
db.connect ();


/***************
 * HTTP Server *
 ***************/

let app = express ();
let port = process.env.PORT || 8003;

app.use (express.static ('Client', { 'index': ['main.html'] } ));

/* API to retrieve the 100 most recent pages */
app.get ('/Pages/', function onListenEvent (req, res) {
    db.query ('select * from pages order by rx_date desc limit 100', (query_err, query_res) => {
        if (query_err) {
            throw query_err;
        }
        clean_rows (query_res.rows);
        res.send (query_res.rows);
    });
});

/* API to retrieve all pages matching a string */
app.get ('/Pages/Search/:type/:string/', function onListenEvent (req, res) {
    if (req.params.type == 'ft') {
        let search_string = decodeURIComponent(req.params.string);
        db.query ("SELECT * from pages WHERE tsx @@ websearch_to_tsquery('simple', $1) ORDER BY rx_date DESC LIMIT 100", [search_string], (query_err, query_res) => {
            if (query_err) {
                throw query_err;
            }
            clean_rows (query_res.rows);
            res.send (query_res.rows);
        });
    } else {
        let search_string = decodeURIComponent(req.params.string).replace (/[#%.?\/\\]/g, '');
        db.query ("select * from pages where content ilike $1 order by rx_date desc",['%' + search_string + '%'], (query_err, query_res) => {
            if (query_err) {
                throw query_err;
            }
            clean_rows (query_res.rows);
            res.send (query_res.rows);
        });
    }

});

let server = app.listen (port, '::', function () {
    console.log ('Listening on port %s.', server.address ().port);
});
