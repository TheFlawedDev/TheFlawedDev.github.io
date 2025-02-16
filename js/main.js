const myImage = document.querySelector("img");

myImage.addEventListener("click", function () {
  const mySrc = myImage.getAttribute("src");
  if (mySrc === "img/riri.jpg") {
    myImage.setAttribute("src", "img/riri2.jpg");
  } else {
    myImage.setAttribute("src", "img/riri.jpg");
  }
});

let myButton = document.querySelector("button");
let myHeading = document.querySelector("h1")

function setUserName() {
  const myName = prompt("Please enter your name.");
  if (!myName) {
    setUserName();
  } else {
    localStorage.setItem("name", myName);
    myHeading.textContent = `Ari is cooler than, ${myName}`;
  }
}

myButton.addEventListener("click", () => {
  setUserName();
});


