// Add styles for messages and cursor
const style = document.createElement('style');
style.textContent = `
  #message1, #message2, #message3, #message4 {
    opacity: 0;
    display: block;
    white-space: pre-wrap;
  }

  .typing-container {
    position: relative;
    display: inline-block;
  }

  .cursor-active {
    position: relative;
  }

  .cursor-active::after {
    content: '';
    display: inline-block;
    position: absolute;
    width: 2px;
    height: 1em;
    background-color: #fff;
    margin-left: 2px;
    animation: blink 2s infinite;
  }

  @keyframes blink {
    50%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
`;
document.head.appendChild(style);

// The messages we want to type out
const messages = [
  {id: 'message1', text: 'Welcome to my Portfolio page, glad to see you are interested in my work.'},
  {id: 'message2', text: 'First of let me introduce myself, I am Jorge Velazquez.'},
  {id: 'message3', text: 'A student at the University of Utah studying computer science.'},
  {id: 'message4', text: 'Below you\'ll find my projects and some other things about me.'}
];

// Typing speed in milliseconds
const typingSpeed = 50;
const delayBetweenMessages = 700;

// Function to type out a single character
function typeCharacter(element, text, index) {
  return new Promise(resolve => {
    if (index < text.length) {
      element.textContent += text.charAt(index);
      setTimeout(() => {
        typeCharacter(element, text, index + 1).then(resolve);
      }, typingSpeed);
    } else {
      setTimeout(resolve, delayBetweenMessages);
    }
  });
}

// Function to start typing animation for a message
async function typeMessage(messageObj) {
  const element = document.getElementById(messageObj.id);
  element.style.opacity = 1;
  element.textContent = '';
  element.classList.add('cursor-active');
  await typeCharacter(element, messageObj.text, 0);

  // Remove cursor from current message before moving to next
  if (messageObj.id !== 'message4') { // Keep cursor on last message
    element.classList.remove('cursor-active');
  }
}

// Function to animate all messages sequentially
async function startTypingAnimation() {
  for (const message of messages) {
    await typeMessage(message);
  }
}

// Start the animation when the page loads
document.addEventListener('DOMContentLoaded', startTypingAnimation);
