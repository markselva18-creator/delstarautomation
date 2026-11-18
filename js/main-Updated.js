/* =========================================================
   DELSTAR - MAIN JAVASCRIPT
   Project Gallery / Lightbox Controller
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
    initProjectLightbox();
});


/* =========================================================
   PROJECT LIGHTBOX
   ========================================================= */

let currentImages = [];
let currentIndex = 0;
let currentProjectCard = null;
let touchStartX = 0;
let touchEndX = 0;


/**
 * Initialize the project image lightbox.
 */
function initProjectLightbox() {
    const projectCards = document.querySelectorAll('.project-card');
    const modal = document.getElementById('projectLightbox');

    if (!modal || projectCards.length === 0) {
        return;
    }

    const closeButton = document.getElementById('lightboxClose');
    const previousButton = document.getElementById('lightboxPrev');
    const nextButton = document.getElementById('lightboxNext');

    /*
     * Open lightbox when a project card is clicked.
     */
    projectCards.forEach(card => {
        card.style.cursor = 'pointer';

        card.addEventListener('click', event => {
            /*
             * Prevent links/buttons inside the card from
             * accidentally triggering the gallery.
             */
            if (
                event.target.closest('a') ||
                event.target.closest('button')
            ) {
                return;
            }

            event.preventDefault();

            openProjectLightbox(card);
        });
    });


    /*
     * Close button.
     */
    if (closeButton) {
        closeButton.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();

            closeLightbox();
        });
    }


    /*
     * Previous button.
     */
    if (previousButton) {
        previousButton.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();

            showPreviousImage();
        });
    }


    /*
     * Next button.
     */
    if (nextButton) {
        nextButton.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();

            showNextImage();
        });
    }


    /*
     * Close when clicking the dark background.
     */
    modal.addEventListener('click', event => {
        if (event.target === modal) {
            closeLightbox();
        }
    });


    /*
     * Keyboard controls.
     *
     * Escape     = Close
     * Left Arrow = Previous
     * Right Arrow = Next
     */
    document.addEventListener('keydown', event => {
        if (!modal.classList.contains('is-open')) {
            return;
        }

        switch (event.key) {
            case 'Escape':
                closeLightbox();
                break;

            case 'ArrowLeft':
                event.preventDefault();
                showPreviousImage();
                break;

            case 'ArrowRight':
                event.preventDefault();
                showNextImage();
                break;
        }
    });


    /*
     * Mobile swipe support.
     */
    const imageContainer = document.querySelector(
        '.lightbox-image-container'
    );

    if (imageContainer) {

        imageContainer.addEventListener(
            'touchstart',
            event => {
                if (event.changedTouches.length === 0) {
                    return;
                }

                touchStartX = event.changedTouches[0].screenX;
            },
            { passive: true }
        );


        imageContainer.addEventListener(
            'touchend',
            event => {
                if (event.changedTouches.length === 0) {
                    return;
                }

                touchEndX = event.changedTouches[0].screenX;

                handleSwipe();
            },
            { passive: true }
        );
    }
}


/**
 * Open the project lightbox.
 *
 * @param {HTMLElement} card
 */
function openProjectLightbox(card) {
    const modal = document.getElementById('projectLightbox');

    if (!modal || !card) {
        return;
    }

    currentProjectCard = card;
    currentImages = [];


    /*
     * Read the gallery images from data-images.
     *
     * Example:
     *
     * data-images='[
     *   "images/image1.jpg",
     *   "images/image2.jpg",
     *   "images/image3.jpg"
     * ]'
     */
    const rawImages = card.getAttribute('data-images');

    if (rawImages) {
        try {
            const parsedImages = JSON.parse(rawImages);

            if (Array.isArray(parsedImages)) {
                currentImages = parsedImages.filter(
                    image => typeof image === 'string' && image.trim() !== ''
                );
            }
        } catch (error) {
            console.warn(
                'Unable to parse project gallery images:',
                error
            );

            currentImages = [];
        }
    }


    /*
     * If no data-images are specified,
     * use the main image from the project card.
     */
    if (currentImages.length === 0) {
        const cardImage = card.querySelector('img');

        if (cardImage) {
            const imageSource =
                cardImage.getAttribute('src') ||
                cardImage.src;

            if (imageSource) {
                currentImages = [imageSource];
            }
        }
    }


    /*
     * Nothing to display.
     */
    if (currentImages.length === 0) {
        console.warn(
            'No project images found for this project card.'
        );

        return;
    }


    /*
     * Start from the first image.
     */
    currentIndex = 0;


    /*
     * Update the lightbox.
     */
    updateLightboxImage();
    updateLightboxControls();


    /*
     * Show modal.
     */
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');


    /*
     * Prevent page scrolling while the lightbox is open.
     */
    document.body.classList.add('lightbox-open');


    /*
     * Reset touch position.
     */
    touchStartX = 0;
    touchEndX = 0;


    /*
     * Preload nearby images.
     */
    preloadAdjacentImages();


    /*
     * Move keyboard focus to Close button.
     */
    const closeButton = document.getElementById('lightboxClose');

    if (closeButton) {
        setTimeout(() => {
            closeButton.focus();
        }, 50);
    }
}


/**
 * Update the displayed lightbox image.
 */
function updateLightboxImage() {
    const imageElement = document.getElementById('lightboxImg');
    const captionElement = document.getElementById('lightboxCaption');

    if (!imageElement || currentImages.length === 0) {
        return;
    }


    const imageSource = currentImages[currentIndex];

    /*
     * Update image.
     */
    imageElement.src = imageSource;


    /*
     * Try to obtain a useful alt/caption from the
     * current project card.
     */
    let caption = '';


    if (currentProjectCard) {

        const titleElement =
            currentProjectCard.querySelector(
                '.project-title, h3, h4'
            );

        if (titleElement) {
            caption = titleElement.textContent.trim();
        }


        /*
         * If there is no title, use the image alt text.
         */
        if (!caption) {
            const cardImage =
                currentProjectCard.querySelector('img');

            if (cardImage) {
                caption =
                    cardImage.getAttribute('alt') || '';
            }
        }
    }


    /*
     * Add image number when multiple images exist.
     */
    if (currentImages.length > 1) {
        const imageNumber =
            `${currentIndex + 1} / ${currentImages.length}`;

        if (caption) {
            captionElement.textContent =
                `${caption} — ${imageNumber}`;
        } else {
            captionElement.textContent = imageNumber;
        }
    } else {
        captionElement.textContent = caption;
    }


    /*
     * Update accessibility information.
     */
    if (caption) {
        imageElement.alt = caption;
    } else {
        imageElement.alt = 'Project image';
    }


    /*
     * Make sure the image starts from its normal position.
     */
    imageElement.style.opacity = '1';
}


/**
 * Update Previous / Next button visibility.
 */
function updateLightboxControls() {
    const previousButton =
        document.getElementById('lightboxPrev');

    const nextButton =
        document.getElementById('lightboxNext');


    /*
     * If there is only one image,
     * there is nothing to navigate.
     */
    const hasMultipleImages =
        currentImages.length > 1;


    if (previousButton) {
        previousButton.style.display =
            hasMultipleImages ? 'flex' : 'none';

        previousButton.disabled =
            !hasMultipleImages;
    }


    if (nextButton) {
        nextButton.style.display =
            hasMultipleImages ? 'flex' : 'none';

        nextButton.disabled =
            !hasMultipleImages;
    }
}


/**
 * Show previous image.
 */
function showPreviousImage() {
    if (currentImages.length <= 1) {
        return;
    }


    currentIndex--;

    /*
     * Loop to the last image when moving backward
     * from the first image.
     */
    if (currentIndex < 0) {
        currentIndex = currentImages.length - 1;
    }


    updateLightboxImage();
    preloadAdjacentImages();
}


/**
 * Show next image.
 */
function showNextImage() {
    if (currentImages.length <= 1) {
        return;
    }


    currentIndex++;

    /*
     * Loop back to the first image when moving forward
     * from the last image.
     */
    if (currentIndex >= currentImages.length) {
        currentIndex = 0;
    }


    updateLightboxImage();
    preloadAdjacentImages();
}


/**
 * Close the lightbox.
 */
function closeLightbox() {
    const modal = document.getElementById('projectLightbox');

    if (!modal) {
        return;
    }


    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');


    /*
     * Restore page scrolling.
     */
    document.body.classList.remove('lightbox-open');


    /*
     * Clear gallery state.
     */
    currentImages = [];
    currentIndex = 0;
    currentProjectCard = null;


    /*
     * Reset touch state.
     */
    touchStartX = 0;
    touchEndX = 0;


    /*
     * Clear image source after the closing animation.
     */
    const imageElement =
        document.getElementById('lightboxImg');

    if (imageElement) {
        setTimeout(() => {
            if (!modal.classList.contains('is-open')) {
                imageElement.src = '';
            }
        }, 200);
    }
}


/**
 * Preload the previous and next images.
 *
 * This makes navigation feel faster because the
 * adjacent images are loaded in advance.
 */
function preloadAdjacentImages() {
    if (currentImages.length <= 1) {
        return;
    }


    const previousIndex =
        (currentIndex - 1 + currentImages.length) %
        currentImages.length;


    const nextIndex =
        (currentIndex + 1) %
        currentImages.length;


    const previousImage = new Image();
    previousImage.src = currentImages[previousIndex];


    const nextImage = new Image();
    nextImage.src = currentImages[nextIndex];
}


/**
 * Handle touch swipe gestures.
 */
function handleSwipe() {
    if (currentImages.length <= 1) {
        return;
    }


    const swipeDistance =
        touchEndX - touchStartX;


    /*
     * Ignore very small movements.
     */
    const minimumSwipeDistance = 50;


    if (Math.abs(swipeDistance) < minimumSwipeDistance) {
        return;
    }


    /*
     * Swipe left = Next image.
     */
    if (swipeDistance < 0) {
        showNextImage();
    }


    /*
     * Swipe right = Previous image.
     */
    else {
        showPreviousImage();
    }


    /*
     * Reset touch positions.
     */
    touchStartX = 0;
    touchEndX = 0;
}


/* =========================================================
   OPTIONAL BACKWARD-COMPATIBILITY FUNCTION
   =========================================================
   
   If any older HTML still contains:

       onclick="openLightbox(this)"

   it will continue to work.
   ========================================================= */

function openLightbox(card) {
    openProjectLightbox(card);
}