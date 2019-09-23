/*
  Trivia Quiz Game
*/

//
// The scope of setTimeout() and setInterval() is global/window, imposing a problem w/ "this". 
// https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setInterval#The_this_problem
// The workaround to enable the passage of the 'this' object through the JavaScript timers
//
var __nativeST__ = window.setTimeout, __nativeSI__ = window.setInterval;

window.setTimeout = function(vCallback, nDelay /*, argumentToPass1, argumentToPass2, etc. */ ) {
  var oThis = this,
    aArgs = Array.prototype.slice.call(arguments, 2);
  return __nativeST__(vCallback instanceof Function ? function() {
    vCallback.apply(oThis, aArgs);
  } : vCallback, nDelay);
};

window.setInterval = function(vCallback, nDelay /*, argumentToPass1, argumentToPass2, etc. */ ) {
  var oThis = this,
    aArgs = Array.prototype.slice.call(arguments, 2);
  return __nativeSI__(vCallback instanceof Function ? function() {
    vCallback.apply(oThis, aArgs);
  } : vCallback, nDelay);
};

//
// Timer object for counting down seconds for the trivia quiz
//
const timer = {
  id: 0,              // setInterval will return non-zero
  mSec: 1000,         // timer interval in micro seconds
  callerObj: null,    // Object/class using this timer
  callbackFunc: null, // callback function
  counter: 10,        // Timer counter in seconds
  start: function(timeLimit = 10) {
    this.stop();
    this.counter = timeLimit;
    this.id = setInterval.call(this.callerObj, this.callbackFunc, this.mSec);
  },
  stop: function() {
    if (this.id) {
      clearInterval(this.id);
      this.id = 0;
    }
  }
}

//
// A class for running the trivia quiz game
//
class QuizRunner {
  constructor(quizObj, timeLimitSec = 10) {
    this.srcQuiz = quizObj;              // quiz data object
    this.ndxQuiz = -1;                   // current quiz array index
    this.timeLimit = timeLimitSec;       // time limit per quiz in second
    this.pauseSec = 3500;                // micro-seconds before next quiz
    this.answers = this.initStats();     // stats to display at the end
    timer.callerObj = this;              // set w/ this class
    timer.callbackFunc = this.countDown; // countdown timer function
  }

  //
  // (re-)Start the quiz game
  //
  start() {
    if ((this.ndxQuiz + 1) < this.srcQuiz.length) {
      this.ndxQuiz++;
      this.nextQuiz();
    } else {
      this.allDone();
    }
  }

  //
  // Next quiz
  // 1. Start the countdown timer
  // 2. Show a new question
  // 3. Wait for an user click event
  //
  nextQuiz() {
    timer.start(this.timeLimit);
    this.showQuestion(this.srcQuiz[this.ndxQuiz]);
    $(".choice").on("click", this, this.userAnswer);
  }

  //
  // A callback function for the countdown timer
  //
  countDown() {
    $("#timer").text(timer.counter);

    if (timer.counter === 0) {
      timer.stop();
      timer.callerObj.showAnswer();
    }
    timer.counter--;
  }

  //
  // 1. Display a question from the quiz data object
  // 2. List the choices with "choice" css class
  //
  showQuestion(quiz) {
    $(".content").html('<h2 class="question">' + quiz.question + "</h2>");
    for (let i = 0; i < quiz.choice.length; i++) {
      $(".content").append(`<h3 class="choice">${quiz.choice[i]}</h3>`);
    }
  }

  //
  // An event handler for user click on one of the answer choices.
  // 1. Identify the user selection by an array index
  // 2. Identify the correct answer by an array index
  // 3. Call showAnswer()
  //
  userAnswer(event) {
    timer.stop();

    let self = event.data;
    let selected = this.innerText;
    let ansNdx = self.srcQuiz[self.ndxQuiz].answer.ndx;
    let selNdx = self.srcQuiz[self.ndxQuiz].choice.findIndex(function(item) {
      return item === selected;
    });

    console.log("selected = " + this.innerText + " [" + selNdx + "]");
    console.log("answer ndx = " + ansNdx);

    self.showAnswer(selected, selNdx === ansNdx);
  }

  //
  // Display the correct answer and accumulate the stats
  //
  showAnswer(userAns, isCorrect = false) {
    let aNdx = this.srcQuiz[this.ndxQuiz].answer.ndx;
    let answer = this.srcQuiz[this.ndxQuiz].choice[aNdx];
    let comment = this.srcQuiz[this.ndxQuiz].answer.comment;

    if (isCorrect) {
      this.showCorrect(answer, comment);
      this.answers.correct += 1;
    }
    else {
      this.showIncorrect(userAns, answer, comment);
      if (userAns) {
        this.answers.incorrect += 1;
      }
      else {
        this.answers.unanswered += 1;
      }
    }

    setTimeout.call(this, this.start, this.pauseSec);
  }

  //
  // User got the correct answer
  //
  showCorrect(answer, comment) {
    $(".content").html('<h2 class="answer">' + answer + ' is CORRECT!</h2>')
      .append("<br>", '<h2 class="answer">' + comment + '</h2>');
  }

  //
  // User's answer was incorrect. Display the correct answer
  //
  showIncorrect(userAns, answer, comment) {
    if (userAns) {
      $(".content").html('<h2 class="answer"> Sorry. Your answer "' + userAns +  '" is not correct.</h2>');
    }
    else {
      $(".content").html('<h2 class="answer" />');
    }
    $(".content").append('<br> <h2 class="answer">The correct answer is <strong>' + answer + "</strong>. </h2>")
      .append('<h2 class="answer">' + comment + '</h2>');
    }

  //
  // The end of game stats 
  //
  allDone() {
    $(".content").html('<h2 class="answer">All done, here is how you did!</h2>')
      .append('<div><h2 class="answer">Correct Answers: ' + this.answers.correct + '</h2></div>')
      .append('<div><h2 class="answer">Incorrect Answers: ' + this.answers.incorrect + '</h2></div>')
      .append('<div><h2 class="answer">Unanswered: ' + this.answers.unanswered + '</h2></div>')
      .append('<button type="button" class="btn btn-primary btn-lg btn-block" id="start">START OVER?</button>');
    $(".btn").click(() => {
      this.answers = this.initStats();
      this.ndxQuiz = -1;
      this.start();
    });
  }

  //
  // Return initial game stats data object w/ all zero(0)
  //
  initStats() {
    let answers = {
      correct: 0,
      incorrect: 0,
      unanswered: 0
    }
    return answers;
  }
}