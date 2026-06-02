// DOM Elements
const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");
const startButton = document.getElementById("start-btn");
const questionText = document.getElementById("question-text");
const answersContainer = document.getElementById("answers-container");
const currentQuestionSpan = document.getElementById("current-question");
const totalQuestionsSpan = document.getElementById("total-questions");
const scoreSpan = document.getElementById("score");
const finalScoreSpan = document.getElementById("final-score");
const maxScoreSpan = document.getElementById("max-score");
const resultMessage = document.getElementById("result-message");
const restartButton = document.getElementById("restart-btn");
const progressBar = document.getElementById("progress");

// QUIZ STATE VARS
let quizQuestions = []; // <-- This now starts empty and will be filled by the API
let currentQuestionIndex = 0;
let score = 0;
let answersDisabled = false;
const QUESTIONS_PER_ROUND = 5; // How many questions you want to fetch

// Set initial static UI numbers
totalQuestionsSpan.textContent = QUESTIONS_PER_ROUND;
maxScoreSpan.textContent = QUESTIONS_PER_ROUND;

// event listeners
startButton.addEventListener("click", startQuiz);
restartButton.addEventListener("click", restartQuiz);

// Helper function to fix weird HTML characters from the API (like &quot; or &#039;)
function decodeHTML(html) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

// Fetch 5 random questions from the Open Trivia API
async function fetchNewQuestions() {
    // Show a loading text while waiting for the API
    questionText.textContent = "Loading fresh questions...";
    answersContainer.innerHTML = "";
    
    const url = `https://opentdb.com/api.php?amount=${QUESTIONS_PER_ROUND}&type=multiple`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        // Map the API data structure to match your exact game structure
        quizQuestions = data.results.map((apiData) => {
            // Create the answers array with the wrong answers first
            const formattedAnswers = apiData.incorrect_answers.map(text => ({
                text: decodeHTML(text),
                correct: false
            }));
            
            // Randomly insert the correct answer into the array
            const correctIndex = Math.floor(Math.random() * 4);
            formattedAnswers.splice(correctIndex, 0, {
                text: decodeHTML(apiData.correct_answer),
                correct: true
            });
            
            return {
                question: decodeHTML(apiData.question),
                answers: formattedAnswers
            };
        });
        
    } catch (error) {
        console.error("Error fetching data from Trivia API:", error);
        // Fallback question if the API fails or user is offline
        quizQuestions = [{
            question: "Failed to load online questions. Are you online?",
            answers: [{ text: "Try again", correct: true }]
        }];
    }
}

async function startQuiz() {
    // reset vars
    currentQuestionIndex = 0;
    score = 0;
    scoreSpan.textContent = 0;

    startScreen.classList.remove("active");
    quizScreen.classList.add("active");

    // 1. Wait to fetch brand new questions from the web
    await fetchNewQuestions();
    
    // 2. Display the first freshly fetched question
    showQuestion();
}

function showQuestion() {
    // reset state
    answersDisabled = false;

    const currentQuestion = quizQuestions[currentQuestionIndex];

    currentQuestionSpan.textContent = currentQuestionIndex + 1;

    const progressPercent = (currentQuestionIndex / quizQuestions.length) * 100;
    progressBar.style.width = progressPercent + "%";

    questionText.textContent = currentQuestion.question;

    answersContainer.innerHTML = "";

    currentQuestion.answers.forEach((answer) => {
        const button = document.createElement("button");
        button.textContent = answer.text;
        button.classList.add("answer-btn");

        // dataset
        button.dataset.correct = answer.correct;

        button.addEventListener("click", selectAnswer);

        answersContainer.appendChild(button);
    });
}

function selectAnswer(event) {
    // optimization check
    if (answersDisabled) return;

    answersDisabled = true;

    const selectedButton = event.target;
    const isCorrect = selectedButton.dataset.correct === "true";

    Array.from(answersContainer.children).forEach((button) => {
        if (button.dataset.correct === "true") {
            button.classList.add("correct");
        } else if (button === selectedButton) {
            button.classList.add("incorrect");
        }
    });

    if (isCorrect) {
        score++;
        scoreSpan.textContent = score;
    }

    setTimeout(() => {
        currentQuestionIndex++;

        // checks if there are more questions
        if (currentQuestionIndex < quizQuestions.length) {
            showQuestion();
        } else {
            showResults();
        }
    }, 1000);
}

function showResults() {
    quizScreen.classList.remove("active");
    resultScreen.classList.add("active");

    finalScoreSpan.textContent = score;

    const percentage = (score / quizQuestions.length) * 100;

    if (percentage === 100) {
        resultMessage.textContent = "Perfect !!! You're a genius!!!";
    } else if (percentage >= 80) {
        resultMessage.textContent = "Great Job!!! You know your stuff!!!";
    } else if (percentage >= 60) {
        resultMessage.textContent = "Good effort! Keep learning!";
    } else if (percentage >= 40) {
        resultMessage.textContent = "Not bad! Try again to improve!";
    } else {
        resultMessage.textContent = "Keep studying! You'll get better!";
    }
}

function restartQuiz() {
    resultScreen.classList.remove("active");

    startQuiz();
}