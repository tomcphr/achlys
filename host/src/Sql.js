class Sql {
    constructor (params) {
        this.q = require("q");

        this.mysql = require("mysql");

        this.pool = this.mysql.createPool(params);
    };

    getConnection () {
        var self = this;

        var promise = this.q.promise((resolve, reject) =>  {
            if (!self || !self.pool) {
                return reject(new Error("Something went wrong"));
            }
            self.pool.getConnection((error, connection)  =>  {
                if (error) {
                    return reject(new Error(error));
                }
                return resolve(connection);
            });
        });

        return promise;
    };

    query (query, params) {
        var self = this;

        var promise = this.q.promise((resolve, reject)  =>  {
            self.getConnection().then((connection)    =>  {
                var results = connection.query(query, params, (error, data)    =>  {
                    connection.release();

                    if (error) {
                        return reject(error);
                    }

                    return resolve(data);
                });
            }).catch ((error)   =>  {
                reject(error);
            });
        });

        return promise;
    };

    getWhere (params) {
        var query = [];
        var values = [];

        for (var clause in params) {
            var field = this.mysql.escapeId(clause);

            values.push(params[clause]);

            query.push(field + " = ?");

            query.push("AND");
        }
        // Remove the last AND statement in the where clause
        query = query.slice(0, -1);

        var data = {
            query: query,
            values: values
        };

        return data;
    };

    record (table, params) {
        var self = this;

        var promise = this.q.promise((resolve, reject) =>  {
            if (!(params instanceof Object)) {
                return resolve(null);
            }

            var where = self.getWhere(params);

            var query = [
                "SELECT * FROM ",
                self.mysql.escapeId(table),
                "WHERE",
            ];
            query = query.concat(where.query);
            query = query.join(" ");

            self.query(query, where.values)
                .then((data)    =>  {
                    var length = data.length;
                    switch (length) {
                        case 0:
                            resolve(null);
                            break;
                        default:
                            resolve(data[0]);
                    }
                }).catch((error)    =>  {
                    reject(error);
                });
        });

        return promise;
    };

    insert (table, record) {
        var query = [
            "INSERT INTO",
            this.mysql.escapeId(table),
            "SET ?",
        ],

        query = query.join(" ");

        return this.query(query, record);
    };

    update (table, params, update) {
        var query = [
            "UPDATE",
            this.mysql.escapeId(table),
            "SET",
        ];

        var values = [];
        for (var clause in update) {
            var value = update[clause];

            var field = this.mysql.escapeId(clause);

            query.push(field + " = ?");
            query.push(",");

            values.push(value);
        }
        // Remove the last comma in the set clause
        query = query.slice(0, -1);

        query.push("WHERE");

        var where = this.getWhere(params);
        query = query.concat(where.query);
        values = values.concat(where.values);

        query = query.join(" ");

        return this.query(query, values);
    };

    updateOrInsert (table, params, update)
    {
        var insert = Object.assign(params, update);

        var query = [
            "INSERT INTO",
            this.mysql.escapeId(table),
            "SET ?",
            "ON DUPLICATE KEY",
            "UPDATE ?",
        ].join(" ");

        var values = [insert, update];

        return this.query(query, values);
    }

    delete (table, params) {
        var query = [
            "DELETE FROM",
            this.mysql.escapeId(table),
            "WHERE",
        ];

        var where = this.getWhere(params);

        query = query.concat(where.query);

        query = query.join(" ");

        return this.query(query, where.values);
    };
}
module.exports = Sql;
