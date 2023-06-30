const ParserError = require('../parsers/ParserError');
const {
    convertSingle,
    convertMultiple,
    toCamelCase
} = require('./lib/funcs');

class ResultObject {
    constructor(result) {
        this.data = result;
    }
    parse(left_to_right = false) {
        const data = this.data;
        if (left_to_right) {
            return this.#leftToRightParse(data);
        }

        return this.#oneHeaderParse(data);
    }

    #oneHeaderParse(data) {
        const object = [];

        if (!data) return object;

        if (!Array.isArray(data)) return new ParserError("Must be an array of objects.");

        const keys = Object.values(data[0]);
        const headerObj = Object.fromEntries(keys.map(key => [(toCamelCase(key)), null]));

        let index = 1;

        while (index < data.length) {
            // first row is header, it will be used as key
            const values = Object.values(data[index]);

            const keys = Object.keys(headerObj);
            const newObj = Object.fromEntries(keys.map((key, i) => [key, values[i] || ""]));

            object[index - 1] = newObj;
            index++;
        }

        return object;
    }

    #leftToRightParse(data) {
        const object = new Object();

        if (!data) return object;

        if (!Array.isArray(data)) return new ParserError("Must be an array of objects.");

        let index = 0;
        const parents = [];
        while (index < data.length) {
            const keys = Object.keys(data[index]);
            const values = Object.values(data[index]);
            const length = keys.length;

            // if there is only one key in object, add it as parent
            if (length === 1) {
                const key = toCamelCase(values[0]);
                object[key] = null;
                parents.push(key);
                index++;
                continue;
            }

            // if there is 2 keys in object, add it as child
            if (length === 2) {
                const parent = parents[parents.length - 1];
                // add child to parent
                const newObj = {
                    ...object[parent],
                    ...convertSingle(data[index])
                };

                object[parent] = newObj;
                index++;
                continue;
            }

            // if there is more than 2 keys in object, add it as child
            if (length > 2) {
                const parent = parents[parents.length - 1];
                // add child to parent
                const newObj = {
                    ...object[parent],
                    ...convertMultiple(data[index], data[index + 1])
                };

                object[parent] = newObj;
                index += 2;
                continue;
            }
            index++;
        }

        return object;
    }
}



module.exports = ResultObject;