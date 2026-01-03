const track = document.querySelector('.carousel__track');
const slides = Array.from(track.children);
const nextButton = document.querySelector('.carousel__next');
const prevButton = document.querySelector('.carousel__prev');
const dotsNav = document.querySelector('.carousel__pagination');
const dots = Array.from(dotsNav.children);

const slideWidth = slides[0].getBoundingClientRect().width;

// Arrange the slides next to one another
const setSlidePosition = (slide, index) => {
//   slide.style.left = slideWidth * index + 'px';
};
slides.forEach(setSlidePosition);

const moveToSlide = (track, currentSlide, targetSlide) => {
  const targetIndex = slides.findIndex(slide => slide === targetSlide);
  const amountToMove = slideWidth * targetIndex;

  track.style.transition = 'transform 0.5s ease-in-out';
  track.style.transform = 'translateX(-' + amountToMove + 'px)';

  currentSlide.classList.remove('current-slide');
  targetSlide.classList.add('current-slide');

  // Add zoom-in effect
  const currentImage = currentSlide.querySelector('img');
  const targetImage = targetSlide.querySelector('img');
  if (currentImage) currentImage.classList.remove('zoom-in');
  if (targetImage) targetImage.classList.add('zoom-in');
};

// Initial setup
slides[0].classList.add('current-slide');
slides[0].querySelector('img').classList.add('zoom-in');
dots[0].querySelector('button').classList.add('carousel__pagination-button--active');

const updateDots = (currentDot, targetDot) => {
  currentDot.classList.remove('carousel__pagination-button--active');
  targetDot.classList.add('carousel__pagination-button--active');
};

// Move to the next slide function
const moveToNextSlide = () => {
  const currentSlide = track.querySelector('.current-slide');
  let nextSlide = currentSlide.nextElementSibling;

  if (!nextSlide) {
    nextSlide = slides[0]; // Wrap around to the first slide
  }

  const currentDot = dotsNav.querySelector('.carousel__pagination-button--active');
  let nextDot = currentDot.parentElement.nextElementSibling?.querySelector('button');
  if (!nextDot) {
    nextDot = dots[0].querySelector('button');
  }

  moveToSlide(track, currentSlide, nextSlide);
  updateDots(currentDot, nextDot);
};

// Autoplay functionality
let autoplayInterval = setInterval(moveToNextSlide, 5000); // Change 5000 to your desired autoplay speed (in milliseconds)

// Pause autoplay when interacting
const pauseAutoplay = () => clearInterval(autoplayInterval);
const resumeAutoplay = () => autoplayInterval = setInterval(moveToNextSlide, 5000);

// Attach pause/resume to user interactions
nextButton.addEventListener('click', () => {
  pauseAutoplay();
  moveToNextSlide();
  resumeAutoplay();
});

prevButton.addEventListener('click', () => {
  pauseAutoplay();
  const currentSlide = track.querySelector('.current-slide');
  let prevSlide = currentSlide.previousElementSibling;

  if (!prevSlide) {
    prevSlide = slides[slides.length - 1]; // Wrap around to the last slide
  }

  const currentDot = dotsNav.querySelector('.carousel__pagination-button--active');
  let prevDot = currentDot.parentElement.previousElementSibling?.querySelector('button');
  if (!prevDot) {
    prevDot = dots[dots.length - 1].querySelector('button');
  }

  moveToSlide(track, currentSlide, prevSlide);
  updateDots(currentDot, prevDot);
  resumeAutoplay();
});

dotsNav.addEventListener('click', e => {
  const targetDot = e.target.closest('button');

  if (!targetDot) return;

  pauseAutoplay();

  const currentSlide = track.querySelector('.current-slide');
  const currentDot = dotsNav.querySelector('.carousel__pagination-button--active');
  const targetIndex = dots.findIndex(dot => dot === targetDot.parentElement);
  const targetSlide = slides[targetIndex];

  moveToSlide(track, currentSlide, targetSlide);
  updateDots(currentDot, targetDot);

  resumeAutoplay();
});
