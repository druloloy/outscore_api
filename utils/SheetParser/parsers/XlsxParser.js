const excel2json = require('convert-excel-to-json');
const ParserError = require('./ParserError');

class XlsxParser{
    constructor(fileBuffer=null){
        this.fileBuffer = fileBuffer;
    }

    async parse(){
        return new Promise((resolve, reject)=>{
            const file = this.fileBuffer;
            const result = excel2json({
                source: file,
                includeEmptyCells: true
            });

            resolve(result[Object.keys(result)[0]]);
            reject(new ParserError('Invalid file format'));
        })
    }
    setFileBuffer(fileBuffer){
        if(!Buffer.isBuffer(fileBuffer))
            throw new Error('Invalid file buffer');
        this.fileBuffer = fileBuffer;
    }
}

module.exports = XlsxParser;