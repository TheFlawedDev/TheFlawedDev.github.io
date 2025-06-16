document.addEventListener("DOMContentLoaded", function () {
  // Get all list items
  let rotation = 0;
  const circle = document.querySelector(".circle");
  const songItems = document.querySelectorAll(".song-list li");
  const albumArtElement = document.querySelector("#right-content img");
  const buttons = document.querySelectorAll(
    ".backward-button, .forward-button, .pause-button, .menu-button",
  );
  const gradientLayer = document.createElement("div");
  const objects = document.querySelectorAll(".object");

  const openPopupButton = document.getElementById("open-popup-app-button");
  const popupWindow = document.getElementById("popup-window");
  const closeButton = document.querySelector(".close-btn");
  const inputField1 = document.getElementById("inputField1");
  const inputField2 = document.getElementById("inputField2");
  const submitBtn = document.getElementById("submit-btn");
  const popupBody = document.querySelector(".popup-api-response");
  console.log("Found buttons:", buttons.length);
  gradientLayer.className = "circle-gradient";
  circle.parentNode.insertBefore(gradientLayer, circle.nextSibling);

  window.addEventListener("wheel", (e) => {
    const delta = e.deltaY;

    // Scroll down = positive delta → rotate clockwise
    // Scroll up = negative delta → rotate counter-clockwise
    rotation += delta * 0.2; // Adjust multiplier for sensitivity

    circle.style.transform = `translateY(-50%) rotate(${rotation}deg)`;

    if (Math.abs(rotation) >= 360 * 2) {
      circle.style.transition = `transform: 6s ease-in-out`;
      rotation = 0;
      circle.style.transform = `translateY(-50%) rotate(${rotation}deg)`;
    }
  });

  //Object Scale Effect
  objects.forEach((obj) => {
    // Scale up on mouse enter
    obj.addEventListener("mouseenter", () => {
      obj.style.transition = "transform 0.3s ease"; // Add smooth transition
      obj.style.transform = "scale(1)"; // Scale up to 120%
    });

    // Scale back on mouse leave
    obj.addEventListener("mouseleave", () => {
      obj.style.transition = "transform 0.3s ease"; // Maintain smooth transition
      obj.style.transform = "scale(0.7)"; // Reset to the original size
    });
  });

  // Create a div to hold the SoundCloud player (initially hidden)
  const playerContainer = document.createElement("div");
  playerContainer.id = "soundcloud-player-container";
  playerContainer.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    opacity: 0.01; /* Not completely invisible to keep it active */
  `;
  document.querySelector("#right-content").appendChild(playerContainer);
  console.log("Player container created", playerContainer);
  // Add the SoundCloud Widget API script
  const scApiScript = document.createElement("script");
  scApiScript.src = "https://w.soundcloud.com/player/api.js";
  document.head.appendChild(scApiScript);

  // Reference to the SoundCloud widget
  let scWidget = null;

  // For debugging - check if elements are found
  console.log("Song items found:", songItems.length);
  console.log("Album art element found:", albumArtElement);

  // Add click event listener to each item
  songItems.forEach((item) => {
    item.addEventListener("click", function () {
      // Remove active class from all items
      songItems.forEach((song) => {
        song.classList.remove("active");
      });

      // Add active class to clicked item
      this.classList.add("active");

      // Get the song title from the clicked item (removing the artist part)
      const fullText = this.textContent.trim();
      // Extract just the song name (everything before the first dash)
      const songTitle = fullText.split("-")[0].trim();

      console.log("Selected song:", songTitle);

      // Update the album art based on the song title
      updateAlbumArt(songTitle);

      playSoundCloudTrack(songTitle);
    });
  });

  //click event listener to each button
  buttons.forEach((button) => {
    button.addEventListener("click", function () {
      // Use data-action attribute to determine the action
      const action = this.dataset.action;

      this.classList.add("active");

      // Handle different button actions
      switch (action) {
        case "menu":
          // Popover is handled by the browser
          break;
        case "pause":
        case "forward":
        case "backward":
          playerAction(action);
          break;
      }

      // Remove active class after short delay
      setTimeout(() => {
        this.classList.remove("active");
      }, 200);
    });
  });

  function playerAction(action) {
    // Get currently active song
    console.log("playerAction called with:", action); // Add this line
    const activeSong = document.querySelector(".song-list li.active");
    const songItems = document.querySelectorAll(".song-list li");

    // Check if the SoundCloud widget is initialized
    if (!scWidget) {
      console.log("SoundCloud widget not initialized yet");

      // If the action is pause (play/pause button), initialize with first song
      if (action === "pause") {
        const firstSong = songItems[0];
        if (firstSong) {
          firstSong.click(); // Trigger click on first song to start playback
        }
      }
      return;
    }

    // Check if a track is currently playing
    scWidget.isPaused(function (isPaused) {
      // If no track is playing and action is not pause, do nothing
      if (isPaused && action !== "pause") {
        console.log("No track is playing. Press play first.");
        return;
      }

      switch (action) {
        case "pause":
          // Toggle play/pause
          if (isPaused) {
            // If paused and no active song, play the first song
            if (!activeSong) {
              songItems[0].click();
            } else {
              scWidget.play();
            }
          } else {
            scWidget.pause();
          }
          break;

        case "forward":
          // Find the next song in the list
          if (activeSong) {
            const nextSong = activeSong.nextElementSibling || songItems[0]; // Loop back to first song if at end
            nextSong.click(); // Trigger click to play next song
          } else {
            // If no active song but trying to go forward, play the first song
            songItems[0].click();
          }
          break;

        case "backward":
          // Find the previous song in the list
          if (activeSong) {
            const index = Array.from(songItems).indexOf(activeSong);
            const prevIndex = (index - 1 + songItems.length) % songItems.length; // Handle going back from first song
            songItems[prevIndex].click(); // Trigger click to play previous song
          } else {
            // If no active song but trying to go backward, play the last song
            songItems[songItems.length - 1].click();
          }
          break;

        default:
          console.log("Unknown action:", action);
      }
    });
  }
  function updateAlbumArt(songTitle) {
    console.log("Updating album art for:", songTitle);

    const albumArtMap = {
      "Mad Rush": "../img/cover/mad-rush.png",
      "Kyoko's House": "../img/cover/kyokos-house.png",
      Lament: "../img/cover/lament.png",
      "Safe In Your Skin": "../img/cover/safe-in-your-skin.png",
      "Do You Know": "../img/cover/do-you-know.png",
    };

    console.log("Path from map:", albumArtMap[songTitle]);

    // Update the image source using the mapping (with fallback)
    albumArtElement.src = albumArtMap[songTitle] || "../img/cover/mad-rush.png";
    albumArtElement.alt = songTitle + " Album Cover";

    console.log("Set image src to:", albumArtElement.src);
  }

  function playSoundCloudTrack(songTitle) {
    // Map song titles to SoundCloud track URLs
    const soundCloudMap = {
      "Mad Rush":
        "https://soundcloud.com/paul-kean-581814336/philip-glass-mad-rush-live?si=f85762e425c64ab0b47227c09c7f6b51&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing",
      "Kyoko's House":
        "https://soundcloud.com/user-186049895/kyokos-house-mishima-ost-piano?si=5c5d1281789d4224851430f125b67cc2&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing",
      Lament:
        "https://soundcloud.com/villagelive/robohands-lament-exclusive?si=c044211dcad64958b60071adb1643223&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing",
      "Safe In Your Skin":
        "https://soundcloud.com/title-fight/safe-in-your-skin?si=8793632723984df3b76763fc9b3781cc&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing",
      "Do You Know":
        "https://soundcloud.com/texasisthereason/do-you-know-who-you-are?si=b0ee78f21a684a5daa943c17dea4e437&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing",
    };

    // Get the SoundCloud track URL for this song
    const trackUrl = soundCloudMap[songTitle];

    if (trackUrl) {
      // Create or update the SoundCloud iframe
      if (!playerContainer.querySelector("iframe")) {
        // First time - create the iframe
        playerContainer.innerHTML = `
          <iframe
            id="soundcloud-widget"
            width="100%"
            height="166"
            scrolling="no"
            frameborder="no"
            allow="autoplay"
            src="https://w.soundcloud.com/player/?url=${encodeURIComponent(trackUrl)}&auto_play=true&show_artwork=false&color=ff5500">
          </iframe>
        `;

        // After iframe is loaded, initialize the widget
        const iframe = document.getElementById("soundcloud-widget");
        iframe.onload = function () {
          scWidget = SC.Widget(iframe);

          // Add event listeners if needed
          scWidget.bind(SC.Widget.Events.READY, function () {
            console.log("SoundCloud widget is ready");
          });

          scWidget.bind(SC.Widget.Events.PLAY, function () {
            console.log("Track started playing");
          });
        };
      } else if (scWidget) {
        // Widget exists, just load the new URL and play
        scWidget.load(trackUrl, {
          auto_play: true,
          show_artwork: false,
        });
      }
    } else {
      console.error("No SoundCloud track found for:", songTitle);
    }
  }
  // 2. Show the pop-up when the button is clicked
  openPopupButton.addEventListener("click", () => {
    console.log("popup button was clicked");

    popupWindow.classList.add("show");
  });

  // 3. Hide the pop-up when the close button is clicked
  closeButton.addEventListener("click", () => {
    console.log("close button clicked");
    popupWindow.classList.remove("show");
  });

  // 4. Optional: Hide the pop-up when clicking outside of it
  window.addEventListener("click", (event) => {
    if (event.target == popupWindow) {
      popupWindow.classList.remove("show");
    }
  });
  submitBtn.addEventListener("click", async () => {
    const word1 = inputField1.value.trim();
    const word2 = inputField2.value.trim();

    if (!word1 || !word2) {
      popupBody.innerHTML =
        '<p style="color: green;">Please enter both words.</p>';
      return;
    }

    // Show a loading message
    popupBody.innerHTML = "<p>Finding path...</p>";

    try {
      // The endpoint for your Netlify function.
      // It includes the words as query parameters.
      const proxyUrl = `/.netlify/functions/proxy?word1=${word1}&word2=${word2}`;

      const response = await fetch(proxyUrl);
      const data = await response.json();

      if (!response.ok) {
        // Display an error if the request failed
        popupBody.innerHTML = `<p style="color: black;">Error: ${data.error || "Could not find a path."}</p>`;
      } else {
        // Your PathFindingController returns a list of strings for the shortest path
        // Display the successful result
        const pathString = data.join(" → ");
        popupBody.innerHTML = `<p><strong>Shortest Path:</strong> ${pathString}</p>`;
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      popupBody.innerHTML =
        '<p style="color: red;">An unexpected error occurred.</p>';
    }
  });
});
