const imageElement = document.getElementById("maisie-image");
const images = [
    'maisie1.jpg',
    'maisie2.jpg',
    'maisie3.jpg',
    'maisie4.jpg',
    'maisie5.jpg'
];

let currentMaisie = 1;

setInterval( () => {
  imageElement.src = "images/" + images[currentMaisie];
  currentMaisie += 1;
  if (currentMaisie === images.length) {
    currentMaisie = 0;
  }
}, 2000 );