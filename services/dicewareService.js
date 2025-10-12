import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ApiException } from '../utils/ApiException.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DicewareService {
    constructor() {
        this.words = [];
        this.isLoaded = false;
        this.loadWords();
    }

    loadWords() {
        try {
            const filePath = path.join(__dirname, '..', 'diceware.txt');
            const fileContent = fs.readFileSync(filePath, 'utf8');
            this.words = fileContent.trim().split('\n').filter(word => word.trim() !== '');
            this.isLoaded = true;
            console.log(`Loaded ${this.words.length} words from diceware.txt`);
        } catch (error) {
            throw new ApiException('Failed to load diceware words', 500);
        }
    }

    getRandomWord() {
        if (!this.isLoaded || this.words.length === 0) {
            throw new ApiException('Diceware words not loaded', 500);
        }
        
        const randomIndex = Math.floor(Math.random() * this.words.length);
        return this.words[randomIndex];
    }

    getTwoRandomWordsAsTuple(allowDuplicates = false) {
        if (!this.isLoaded || this.words.length === 0) {
            throw new ApiException('Diceware words not loaded', 500);
        }

        const firstWord = this.getRandomWord();
        
        if (allowDuplicates) {
            const secondWord = this.getRandomWord();
            return [firstWord, secondWord];
        } else {
            // Ensure second word is different from first
            let secondWord;
            do {
                secondWord = this.getRandomWord();
            } while (secondWord === firstWord && this.words.length > 1);
            
            return [firstWord, secondWord];
        }
    }

    getTwoRandomWords() {
        const [firstWord, secondWord] = this.getTwoRandomWordsAsTuple();
        return `${firstWord}-${secondWord}`;
    }
}

export default new DicewareService();