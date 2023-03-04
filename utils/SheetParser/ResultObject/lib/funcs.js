function convertSingle(object){
    // get keys count
    const keys = Object.values(object);
    const length = keys.length;

    if(length > 2){
        return new Error('Too much keys in object');
    }
    if(length === 1)
        return {[toCamelCase(keys[0])]: ''}
    
    return {[toCamelCase(keys[0])]: keys[1]}
}

function convertMultiple(object1, object2){
    const result = {};
    const keys = Object.values(object1);
    const values = Object.values(object2);

    if(keys.length !== values.length){
        return new Error('Objects have different keys count');
    }

    for(let i = 0; i < keys.length; i++){
        result[toCamelCase(keys[i])] = values[i];
    }

    return result;
}

function toCamelCase(text){
    return _filterText(_camelize(text));

    function _camelize(text){
        return text.toLowerCase().replace(/(\s+)([a-z])/g, (match, p1, p2)=>p2.toUpperCase())
    }
    function _filterText(text){
        return text.replace(/[^a-zA-Z0-9]/g, '');
    }
}

module.exports = {
    convertSingle,
    convertMultiple,
    toCamelCase
}