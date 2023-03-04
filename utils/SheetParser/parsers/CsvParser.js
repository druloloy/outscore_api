const csv2json = require('csvtojson');
const ParserError = require('./ParserError');
class CsvParser {
     constructor (fileBuffer=null) {
        this.fileBuffer = fileBuffer;
    }

    async parse(){
        return new Promise((resolve, reject)=>{
            const file = this.fileBuffer;
            const option = {
                noheader: true,
            }
            csv2json(option)
                .fromString(file.toString())
                .then((jsonObj)=>{
                    resolve(this.#_removeEmptyObjectKeys(jsonObj));
                })
                .catch((err)=>{
                    reject(new ParserError(err.message));
                })
        })
    }

    setFileBuffer(fileBuffer){
        if(!Buffer.isBuffer(fileBuffer))
            throw new Error('Invalid file buffer');
        this.fileBuffer = fileBuffer;
    }

    #_removeEmptyObjectKeys(array){
        return array.map(row=>{
            return this.#_removeEmptyValues(row); 
        })
    }
    #_removeEmptyValues(obj){
        const keys = Object.keys(obj);
        keys.forEach(key=>{
            if(!obj[key]){
                delete obj[key];
            }
        })
        return obj;
    }
}
module.exports = CsvParser;