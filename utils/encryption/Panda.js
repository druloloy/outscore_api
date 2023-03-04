const panda = require('panda-encryption').Panda;

const pandaConfig = {
    key: process.env.PANDA_SECRET_KEY,
    seed: process.env.PANDA_SECRET_SEED
}

async function encrypt(data) {
    try {
        const buffer = Buffer.from(data, 'utf8');
        const encrypted = await panda.encrypt(buffer, pandaConfig);
        return panda.bufferToBase64(encrypted);
    } catch (error) {
        console.log(error);
    }
}

async function decrypt(data) {
    const decrypted = await panda.decrypt(panda.base64ToBuffer(data), pandaConfig);
    return panda.bufferToUtf8(decrypted);
}

async function encryptObject(object) {
    for (const key in object) {
        if(!object[key]) 
            object[key] = '';
        if(typeof object[key] === 'object') {
            await encryptObject(object[key]);
        }
        else{
            object[key] = await encrypt(object[key].toString());
        }
    }
    return object;
}

async function decryptObject(object) {
    for (const key in object) {
        if(!object[key]) 
            object[key] = '';
        if(typeof object[key] === 'object'){ 
            await decryptObject(object[key]);
        }
        else{
            object[key] = await decrypt(object[key]);
        }
    }        
    
    return object;
}

module.exports = {
    encrypt,
    decrypt,
    encryptObject,
    decryptObject
};