const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const Exception = require('../Exception');

const filename = './eff_large_wordlist.txt';

class Dictionary {
    list = [];

    constructor() {
        if (Dictionary._instance) {
            throw new Error(
                'Error: Instantiation failed: Use Dictionary.getInstance() instead of new.'
            );
        }
        try {
            const file = fs.readFileSync(
                path.join(__dirname, filename),
                'utf8'
            );
            const lines = file.split('\n');
            this.list = lines;
            Dictionary._instance = this;
        } catch (error) {
            throw error;
        }
    }
    static getInstance() {
        if (!this._instance) {
            this._instance = new this();
        }
        return this._instance;
    }
    getPhrase(length) {
        try {
            const phrase = [];
            const list = this.list;
            const listLength = list.length;
            for (let i = 0; i < length; i++) {
                // generate random index
                const randomIndex = crypto.randomInt(listLength - 1);
                // get random word
                const randomWord = list[randomIndex];
                // add word to phrase
                phrase.push(randomWord);
            }
            return phrase;
        } catch (error) {
            throw new Error('Error in Dictionary.getPhrase(): ' + error);
        }
    }
    pickWord() {
        try {
            const randomInt = crypto.randomInt(this.list.length - 1);
            const randomWord = this.list[randomInt];
            return randomWord;
        } catch (error) {
            throw new Error('Error in Dictionary.pickWord(): ' + error);
        }
    }
    static comparePhrase(phrase, recoveryPhrase) {
        // check if length of phrase is equal to length of recovery phrase
        if (phrase.length !== recoveryPhrase.length) return false;

        // check if each word in phrase is equal to the corresponding word in recovery phrase
        for (let i = 0; i < phrase.length; i++) {
            if (!recoveryPhrase.includes(phrase[i].toLowerCase())) return false;
        }
        return true;
    }
}

module.exports = Dictionary;