class Sql {
    constructor (params) {
        this.q = require("q");

        this.mysql = require("mysql");

        this.pool = this.mysql.createPool(params);
    };

    getConnection () {
        let self = this;

        let promise = this.q.promise((resolve, reject) =>  {
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
        let self = this;

        let promise = this.q.promise((resolve, reject)  =>  {
            self.getConnection().then((connection)    =>  {
                let results = connection.query(query, params, (error, data)    =>  {
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
        let query = [];
        let values = [];

        for (let clause in params) {
            let field = this.mysql.escapeId(clause);

            values.push(params[clause]);

            query.push(field + " = ?");

            query.push("AND");
        }
        // Remove the last AND statement in the where clause
        query = query.slice(0, -1);

        let data = {
            query: query,
            values: values
        };

        return data;
    };

    record (table, params) {
        let self = this;

        let promise = this.q.promise((resolve, reject) =>  {
            if (!(params instanceof Object)) {
                return resolve(null);
            }

            let query = [
                "SELECT * FROM ",
                self.mysql.escapeId(table),
                "WHERE",
            ];

            let where = self.getWhere(params);

            query = query.concat(where.query);

            query = query.join(" ");

            self.query(query, where.values)
                .then((data)    =>  {
                    let length = data.length;
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
        let query = [
            "INSERT INTO",
            this.mysql.escapeId(table),
            "SET ?",
        ],

        query = query.join(" ");

        return this.query(query, record);
    };

    update (table, params, update) {
        let query = [
            "UPDATE",
            this.mysql.escapeId(table),
            "SET",
        ];

        let values = [];
        for (let clause in update) {
            let value = update[clause];

            let field = this.mysql.escapeId(clause);

            query.push(field + " = ?");
            query.push(",");

            values.push(value);
        }
        // Remove the last comma in the set clause
        query = query.slice(0, -1);

        query.push("WHERE");

        let where = this.getWhere(params);
        query = query.concat(where.query);
        values = values.concat(where.values);

        query = query.join(" ");

        return this.query(query, values);
    };

    updateOrInsert (table, params, update)
    {
        let insert = Object.assign(params, update);

        let query = [
            "INSERT INTO",
            this.mysql.escapeId(table),
            "SET ?",
            "ON DUPLICATE KEY",
            "UPDATE ?",
        ].join(" ");

        let values = [insert, update];

        return this.query(query, values);
    }

    delete (table, params) {
        let query = [
            "DELETE FROM",
            this.mysql.escapeId(table),
            "WHERE",
        ];

        let where = this.getWhere(params);

        query = query.concat(where.query);

        query = query.join(" ");

        return this.query(query, where.values);
    };
}
module.exports = Sql;
