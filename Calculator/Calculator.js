const questionDisplay = document.getElementById("display");
const answerDisplay = document.getElementById("result");
const digits = document.querySelectorAll(".digit");
const equalTo = document.getElementById("equalto");
const del = document.getElementById("delete");
const reset = document.getElementById("reset");

for (const digit of digits) {
  digit.addEventListener("click", function (e) {
    questionDisplay.value += e.target.value;
  });
}

equalTo.addEventListener("click", function () {
  let answer = eval(questionDisplay.value);
  answerDisplay.value = answer.toLocaleString();
});

del.addEventListener("click", function () {
  questionDisplay.value = questionDisplay.value.slice(0, -1);
});

reset.addEventListener("click", function () {
  questionDisplay.value = "";
  answerDisplay.value = "";
});