document.addEventListener('DOMContentLoaded', function() {
  // Get all list items
  const songItems = document.querySelectorAll('.song-list li');
  const albumArtElement = document.querySelector('#right-content img');

  // For debugging - check if elements are found
  console.log('Song items found:', songItems.length);
  console.log('Album art element found:', albumArtElement);

  // Add click event listener to each item
  songItems.forEach(item => {
    item.addEventListener('click', function() {
      // Remove active class from all items
      songItems.forEach(song => {
        song.classList.remove('active');
      });

      // Add active class to clicked item
      this.classList.add('active');

      // Get the song title from the clicked item (removing the artist part)
      const fullText = this.textContent.trim();
      // Extract just the song name (everything before the first dash)
      const songTitle = fullText.split('-')[0].trim();

      console.log('Selected song:', songTitle);

      // Update the album art based on the song title
      updateAlbumArt(songTitle);  // <-- UNCOMMENTED THIS LINE
    });
  });

  function updateAlbumArt(songTitle) {
    console.log('Updating album art for:', songTitle);

    const albumArtMap = {
      'Mad Rush': '../img/cover/mad-rush.png',
      'Kyoko\'s House': '../img/cover/kyokos-house.png',
      'Lament': '../img/cover/lament.png',
      'Safe In Your Skin': '../img/cover/safe-in-your-skin.png',
      'Do You Know': '../img/cover/do-you-know.png'
    };

    console.log('Path from map:', albumArtMap[songTitle]);

    // Update the image source using the mapping (with fallback)
    albumArtElement.src = albumArtMap[songTitle] || '../img/cover/mad-rush.png';
    albumArtElement.alt = songTitle + ' Album Cover';

    console.log('Set image src to:', albumArtElement.src);
  }
});
