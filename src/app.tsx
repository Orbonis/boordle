import React from 'react';
import './app.scss';
import { Strategy } from './strategy';

interface Properties {

}

interface State {
    tab: "game" | "solver";
    tipIndex: number;

    input: ("0" | "1" | "")[];
    guesses: string[];
    answer: string;

    solver: {
        input: ("" | "0" | "1" | "2" | "3" | "4" | "5" | "6");
        guesses: number[][];
        answer: number[] | null;
    }
}

class App extends React.Component<Properties, State> {
    private readonly config = {
        length: 6,
        maxGuesses: 9
    }

    private readonly tips: string[] = [
        "Start with strategic patterns like 111000 or 101010 to maximize information gain",
        "Use feedback to eliminate possibilities - if 3 are correct, exactly 3 positions are right",
        "Apply binary logic: change one position and see if the feedback increases or decreases",
        "If the feedback decreases when you change a position, that position was correct",
        "If the feedback stays the same, the position you changed was wrong",
        "Try complementary patterns - if you guess 111000, next try 000111",
        "Focus on one position at a time once you've narrowed down possibilities",
        "Keep mental track of known positions, eliminated positions, and remaining possibilities",
        "Each guess should provide maximum information about digit positions",
        "Think in terms of constraints - each feedback eliminates many possibilities",
        "The optimal strategy minimizes remaining search space with each guess"
    ];

    constructor(props: Properties) {
        super(props);

        this.state = {
            tab: "game",
            input: Array.from({ length: this.config.length }, () => ""),
            answer: Math.random().toString(2).slice(2, this.config.length + 2),
            guesses: [],
            tipIndex: 0,
            solver: {
                input: "",
                guesses: [],
                answer: null
            }
        };

        window.addEventListener("focus", (e) => {
            window.setTimeout(() => {
                switch (this.state.tab) {
                    case "game":
                        this.input.refocus();
                        break;
                    case "solver":
                        this.solver.refocus();
                        break;
                }
                e.preventDefault();
            }, 100);
        });
    }

    public componentDidMount() {
        this.input.refocus();
        this.solver.reset();
    }

    public componentDidUpdate(_: Properties, prevState: State) {
        if (prevState.input !== this.state.input) {
            this.input.refocus();
        }

        if (prevState.tab !== this.state.tab) {
            if (this.state.tab === "game") {
                this.input.refocus();
            } else {
                this.solver.refocus();
            }
        }
    }

    public render() {
        const tab = (this.state.tab === "game") ? (
            <main>
                {this.guesses.render()}
                {this.input.render()}
            </main>
        ) : (
            <main>
                {this.solver.render()}
            </main>
        );
        const gameTabClasses = this.helpers.conditionalClassName({ active: this.state.tab === "game" });
        const solverTabClasses = this.helpers.conditionalClassName({ active: this.state.tab === "solver" });
        return (
            <div className="app">
                <header>
                    <h1>B00rd1e</h1>
                    <h3>Recreated by Dean Rutter</h3>
                    <h2>
                        Get some practice before you {" "}
                        <a target="_blank" rel="noreferrer" href="https://mikeklubnika.itch.io/crank-it">Crank It</a>!
                    </h2>
                    <h3>by James Dornan & Mike Klubnika</h3>
                    <div className="tabs">
                        <button className={gameTabClasses} onClick={() => this.setState({ tab: "game" })}>
                            Game
                        </button>
                        <button className={solverTabClasses} onClick={() => this.setState({ tab: "solver" })}>
                            Solver
                        </button>
                    </div>
                </header>
                { tab }
            </div>
        );
    }

    public guesses = {
        validate: () => {
            const guess = this.state.input;
            const answer = this.state.answer.split("");
            const correct = guess.every((value, index) => value === answer[index]);

            if (guess.every(value => value.length > 0)) {
                if (correct) {
                    window.setTimeout(() => {
                        alert("You win!");
                        window.location.reload();
                    }, 0);
                } else if (this.state.guesses.length >= this.config.maxGuesses) {
                    window.setTimeout(() => {
                        const lossMessage = [
                            "Sorry! Better luck next time!",
                            "This answer this time was: " + this.state.answer
                        ];

                        alert(lossMessage.join("\n"));
                        window.location.reload();
                    }, 0);
                } else {
                    this.guesses.nextTip();
                    this.setState({ 
                        guesses: [...this.state.guesses, guess.join("")], 
                        input: Array.from({ length: this.config.length }, () => "") 
                    });
                }
            } else {
                this.input.refocus();
            }
        },
        render: () => {
            const comparisons: number[] = this.state.guesses.map((guess) => {
                return guess.split("").filter((value, index) => value === this.state.answer[index]).length;
            });

            return (
                <div className="guesses">
                    {this.state.guesses.map((guess, index) => {
                        const remainingGuesses = index === this.state.guesses.length - 1 ? (
                            <span>
                                <br />
                                ({this.config.maxGuesses - this.state.guesses.length} guesses remaining)
                            </span>
                        ) : undefined;

                        return (
                            <div key={index} className="guess">
                                <div className="comparison">
                                    There are {comparisons[index]} correct values.
                                    {remainingGuesses}
                                </div>
                                <div className="values">
                                    {guess.split("").map((value, index) => {
                                        return (
                                            <input key={index} type="text" value={value} disabled />
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                    <div className="tips">
                        Hint:<br/>
                        { this.tips[this.state.tipIndex]}
                    </div>
                </div>
            );
        },
        nextTip: () => {
            this.setState({ tipIndex: (this.state.tipIndex + 1) % this.tips.length });
        }
    }

    public solver = {
        strategy: new Strategy(this.config.length),
        render: () => {
            const successClasses = [
                "success",
                this.helpers.conditionalClassName({ hidden: this.state.solver.answer === null })
            ].filter(Boolean).join(" ");
            const inputClasses = [
                "input",
                this.helpers.conditionalClassName({ hidden: this.state.solver.answer !== null })
            ].filter(Boolean).join(" ");
            return (
                <div className="solver">
                    <button onClick={() => this.solver.reset()}>Reset</button>
                    <div className={successClasses}>
                        Got it! The answer is:
                        <div className="answer">{this.state.solver.answer?.join("").trim()}</div>
                        Hope this helped!
                    </div>
                    <div className="guesses">
                        {this.state.solver.guesses.map((guess, index) => {
                            return (
                                <div key={index} className="guess">
                                    {
                                        index === this.state.solver.guesses.length - 1 ? (
                                            <div className="info">
                                                Latest Guess:
                                            </div>
                                        ) : (
                                            <div className="info">
                                                Guess {index + 1}:
                                            </div>
                                        )
                                    }
                                    <div className="values">
                                        {guess.map((value, index) => {
                                            return (
                                                <input key={index} type="text" value={value.toString()} disabled />
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div className="tips">
                        Enter a number between 0 and 6 to indicate the number of correct positions.
                    </div>
                    <div className={inputClasses}>
                        <input id="solver-input" type="text" value={this.state.solver.input} onChange={(e) => this.solver.onInputChange(e)} />
                    </div>
                </div>
            );
        },
        reset: () => {
            this.solver.strategy.reset();
            this.setState({
                solver: {
                    input: "0",
                    guesses: [],
                    answer: null
                }
            }, () => {
                this.solver.next();
            });
        },
        next: () => {
            if (this.state.solver.input.length > 0) {
                if (this.state.solver.input === "6") {
                    this.setState({
                        solver: {
                            ...this.state.solver,
                            answer: this.state.solver.guesses[this.state.solver.guesses.length - 1] ?? null
                        }
                    });
                } else {
                    this.setState({
                        solver: {
                            input: "",
                            guesses: [
                                ...this.state.solver.guesses, 
                                this.solver.strategy.getNextGuess(
                                    this.state.solver.guesses[this.state.solver.guesses.length - 1] ?? [], 
                                    Number.parseInt(this.state.solver.input), 
                                    this.state.solver.guesses.length
                                )
                            ],
                            answer: null
                        }
                    });
                }
            }
        },
        refocus: () => {
            const input = document.getElementById("solver-input");
            if (input) {
                input.focus();
            }
        },
        onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            const validation = ["0", "1", "2", "3", "4", "5", "6"];
            if (validation.includes(e.currentTarget.value)) {
                this.setState({
                    solver: {
                        ...this.state.solver,
                        input: e.currentTarget.value as (typeof this.state.solver.input)
                    }
                }, () => {
                    this.solver.next();
                });
            }
        }
    }

    public input = {
        render: () => {
            return (
                <div className="input">
                    {
                        this.state.input.map((value, index) => {
                            return (
                                <input
                                    type="text"
                                    key={index}
                                    id={`input-${index}`}
                                    value={value}
                                    onChange={(e) => this.input.onChange(e, index)}
                                    onKeyDown={(e) => this.input.onKeyDown(e, index)}
                                    disabled={(this.state.input[index - 1] ?? " ").length === 0}
                                />
                            )
                        })
                    }
                </div>
            );
        },
        refocus: (index?: number) => {
            const focusIndex = index ?? this.state.input.findIndex(value => value.length === 0);
            if (focusIndex >= 0 && focusIndex < this.config.length) {
                const focusInput = document.getElementById(`input-${focusIndex}`);
                if (focusInput) {
                    focusInput.focus();
                }
            }

            window.setTimeout(() => {
                window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                const main = document.getElementsByTagName("main")[0];
                if (main) {
                    main.scrollTo({ top: main.scrollHeight, behavior: "smooth" });
                }
            }, 0);
        },
        onChange: (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
            const value = e.currentTarget.value;
            switch (value) {
                case "":
                case "0":
                case "1":
                    const input = [...this.state.input];
                    input[index] = value;
                    this.setState({ input }, () => {
                        if (value.length > 0) {
                            const nextInput = document.getElementById(`input-${index + 1}`);
                            if (nextInput) {
                                nextInput.focus();
                                e.preventDefault();
                            } else if (this.state.input.every(value => value.length > 0)) {
                                this.guesses.validate();
                            }
                        }
                    });
                    break;
            }
        },
        onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
            const key = e.key;
            const value = e.currentTarget.value;

            switch (key) {
                case "Backspace":
                    if (value.length === 0) {
                        const previousInput = document.getElementById(`input-${index - 1}`);
                        if (previousInput) {
                            previousInput.focus();
                            e.preventDefault();
                        }
                    }
                    break;
            }
        }
    }

    public helpers = {
        conditionalClassName: (classes: Record<string, boolean>) => {
            return Object.entries(classes).map(([className, condition]) => {
                return condition ? className : "";
            }).join(" ");
        }
    }
}

export default App;
