class Strategy {
    private numberLength: number;
    private possibleNumbers: number[][];
    private constraints: { guess: number[], feedback: number }[];
    private guessHistory: number[][];

    constructor(length: number) {
        this.numberLength = length;
        this.possibleNumbers = this.generateAllPossibleNumbers();
        this.constraints = [];
        this.guessHistory = [];
    }

    public reset(length: number) {
        this.numberLength = length;
        this.possibleNumbers = this.generateAllPossibleNumbers();
        this.constraints = [];
        this.guessHistory = [];
    }

    public getNextGuess(lastGuess: number[], lastFeedback: number, guessCount: number) {
        if (lastGuess && lastFeedback !== null) {
            this.addConstraint(lastGuess, lastFeedback);
            this.updatePossibleNumbers();
        }

        return this.chooseOptimalGuess();
    }

    private generateAllPossibleNumbers() {
        const numbers: number[][] = [];
        for (let i = 0; i < Math.pow(2, this.numberLength); i++) {
            const binary = i.toString(2).padStart(this.numberLength, '0');
            const number = binary.split('').map(digit => parseInt(digit));
            numbers.push(number);
        }
        return numbers;
    }

    private addConstraint(guess: number[], feedback: number) {
        this.constraints.push({ guess: [...guess], feedback });
        this.guessHistory.push([...guess]);
    }

    private updatePossibleNumbers() {
        this.possibleNumbers = this.generateAllPossibleNumbers().filter(number => {
            return this.constraints.every(constraint => {
                const actualFeedback = this.calculateFeedback(constraint.guess, number);
                return actualFeedback === constraint.feedback;
            });
        });
        
        if (this.possibleNumbers.length === 0) {
            const constraintScores = new Map<number[], number>();
            
            for (const number of this.generateAllPossibleNumbers()) {
                let score = 0;
                for (const constraint of this.constraints) {
                    const actualFeedback = this.calculateFeedback(constraint.guess, number);
                    if (actualFeedback === constraint.feedback) {
                        score++;
                    }
                }
                constraintScores.set(number, score);
            }
            
            const sortedNumbers = Array.from(constraintScores.entries())
                .sort((a, b) => b[1] - a[1]);
            
            const bestScore = sortedNumbers[0][1];
            const bestNumbers = sortedNumbers
                .filter(([_, score]) => score >= bestScore - 1)
                .map(([number, _]) => number);
            
            if (bestNumbers.length > 0) {
                this.possibleNumbers = bestNumbers;
            } else {
                this.possibleNumbers = this.generateAllPossibleNumbers();
            }
        }
    }

    private calculateFeedback(guess: number[], target: number[]) {
        let correctCount = 0;
        for (let i = 0; i < guess.length; i++) {
            if (guess[i] === target[i]) {
                correctCount++;
            }
        }
        return correctCount;
    }

    private chooseOptimalGuess() {
        if (this.possibleNumbers.length <= 3) {
            if (this.possibleNumbers.length === 0) {
                return [0, 0, 0, 0, 0, 0];
            }
            
            for (const number of this.possibleNumbers) {
                if (!this.guessHistory.some(prevGuess => 
                    prevGuess.every((digit, index) => digit === number[index]))) {
                    return number;
                }
            }
            
            const allGuesses = this.generateAllPossibleNumbers();
            for (const guess of allGuesses) {
                if (!this.guessHistory.some(prevGuess => 
                    prevGuess.every((digit, index) => digit === guess[index]))) {
                    return guess;
                }
            }
            
            return this.possibleNumbers[0];
        }

        let bestGuess: number[] | null = null;
        let bestScore: number = -1;

        const allGuesses = this.generateAllPossibleNumbers();
        
        for (const guess of allGuesses) {
            if (this.guessHistory.some(prevGuess => 
                prevGuess.every((digit, index) => digit === guess[index]))) {
                continue;
            }
            
            const score = this.calculateGuessScore(guess);
            if (score > bestScore) {
                bestScore = score;
                bestGuess = guess;
            }
        }

        if (!bestGuess) {
            if (this.possibleNumbers.length > 0) {
                return this.possibleNumbers[0];
            }
            const allGuesses = this.generateAllPossibleNumbers();
            for (const guess of allGuesses) {
                if (!this.guessHistory.some(prevGuess => 
                    prevGuess.every((digit, index) => digit === guess[index]))) {
                    return guess;
                }
            }
            return [0, 0, 0, 0, 0, 0];
        }

        return bestGuess;
    }

    private calculateGuessScore(guess: number[]) {
        const feedbackCounts = new Array(this.numberLength + 1).fill(0);
        
        for (const number of this.possibleNumbers) {
            const feedback = this.calculateFeedback(guess, number);
            feedbackCounts[feedback]++;
        }

        let entropy: number = 0;
        for (const count of feedbackCounts) {
            if (count > 0) {
                const probability = count / this.possibleNumbers.length;
                entropy -= probability * Math.log2(probability);
            }
        }

        return entropy;
    }
}

export { Strategy };
