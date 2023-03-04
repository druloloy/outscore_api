const CsvParser = require('../parsers/CsvParser');
const XlsxParser = require('../parsers/XlsxParser');
const ResultObject = require('../ResultObject');
class ParserFactory{
    constructor(){
        this.parser = null;
        this.result = new ResultObject(null);
    }

    static createParser(fileType, options = parserOptions){
        const type = ParserFactory._getShortName(fileType, options);
        this.parser = new FactoryType[type].parser();

        return this;
    }

    static loadFileBuffer(fileBuffer){
        this.parser.setFileBuffer(fileBuffer);
        return this;
    }

    static async parse(){
        const parsed = await this.parser.parse();
        this.result = new ResultObject(parsed);
        return this.result.parse();
    }

    static _getShortName(type, option){
        if (!option.shortName) return type;
        const t = FactoryType.find(t => t.shortName === type);
        if (!t) throw new Error('Invalid parser type');
        return t;
    }
}

const FactoryType = {
    'text/csv': {
        parser: CsvParser,
        shortName: 'csv'
    },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        parser: XlsxParser,
        shortName: 'xlsx'
    }
}

const parserOptions = {
    shortName: false
}
module.exports = ParserFactory;