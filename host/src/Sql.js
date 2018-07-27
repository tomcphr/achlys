class Sql {
    constructor () {
        var mysql = require("node-mysql-helper");

        mysql.connect({
            host: "mysql.cf0ltiuy5g4n.eu-west-1.rds.amazonaws.com",
            user: "root",
            password: "r7ttdqAU1JrS714UOr0u",
            database: "deko"
        });

        console.log("Connected to MySql");

        return mysql;
    };
}
module.exports = Sql;
