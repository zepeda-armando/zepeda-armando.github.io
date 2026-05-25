const revealTargets = document.querySelectorAll("[data-reveal]");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

revealTargets.forEach((section, index) => {
  section.style.transitionDelay = `${index * 90}ms`;
  revealObserver.observe(section);
});

const yearNode = document.getElementById("year");
if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}

const initHeroVideoLoop = () => {
  const heroVideo = document.querySelector(".hero-video");
  if (!heroVideo) {
    return;
  }

  const clipStartOffsetSeconds = 24;
  const clipEndOffsetSeconds = 5;
  let clipStartTime = 0;
  let clipEndTime = 0;

  const updateClipWindow = () => {
    if (!Number.isFinite(heroVideo.duration) || heroVideo.duration <= 0) {
      return;
    }

    clipStartTime = Math.max(0, heroVideo.duration - clipStartOffsetSeconds);
    clipEndTime = Math.max(clipStartTime, heroVideo.duration - clipEndOffsetSeconds);

    if (heroVideo.currentTime < clipStartTime || heroVideo.currentTime >= clipEndTime || heroVideo.currentTime === 0) {
      heroVideo.currentTime = clipStartTime;
    }
  };

  heroVideo.addEventListener("loadedmetadata", updateClipWindow);

  heroVideo.addEventListener("timeupdate", () => {
    if (clipEndTime > clipStartTime && heroVideo.currentTime >= clipEndTime) {
      heroVideo.currentTime = clipStartTime;
      void heroVideo.play().catch(() => {});
    }
  });

  heroVideo.addEventListener("ended", () => {
    heroVideo.currentTime = clipStartTime;
    void heroVideo.play().catch(() => {});
  });
};

initHeroVideoLoop();

const initLayeredShowcase = ({
  showcaseSelector,
  cardSelector,
  prevSelector,
  nextSelector,
  stateClasses,
  durationMs = 820,
}) => {
  const showcase = document.querySelector(showcaseSelector);
  if (!showcase) {
    return;
  }

  const cards = Array.from(showcase.querySelectorAll(cardSelector));
  const prevBtn = document.querySelector(prevSelector);
  const nextBtn = document.querySelector(nextSelector);

  if (cards.length === 0 || !prevBtn || !nextBtn) {
    return;
  }

  const { active, prev, next, hiddenLeft, hiddenRight } = stateClasses;
  let currentIndex = 0;
  let isAnimating = false;

  const getWrappedIndex = (index) => {
    const total = cards.length;
    return (index + total) % total;
  };

  const applyState = (activeIndex) => {
    const prevIndex = getWrappedIndex(activeIndex - 1);
    const nextIndex = getWrappedIndex(activeIndex + 1);

    cards.forEach((card, index) => {
      card.classList.remove(active, prev, next, hiddenLeft, hiddenRight);
      card.setAttribute("aria-hidden", "true");

      if (index === activeIndex) {
        card.classList.add(active);
        card.setAttribute("aria-hidden", "false");
      } else if (index === prevIndex) {
        card.classList.add(prev);
      } else if (index === nextIndex) {
        card.classList.add(next);
      } else {
        const isOnLeftArc =
          index < activeIndex
            ? activeIndex - index <= Math.floor(cards.length / 2)
            : index - activeIndex > Math.floor(cards.length / 2);

        card.classList.add(isOnLeftArc ? hiddenLeft : hiddenRight);
      }
    });

    cards.forEach((card, index) => {
      const mediaVideo = card.querySelector("video");
      if (!mediaVideo) {
        return;
      }

      if (index === activeIndex) {
        void mediaVideo.play().catch(() => {});
      } else {
        mediaVideo.pause();
        mediaVideo.currentTime = 0;
      }
    });
  };

  const navigate = (direction) => {
    if (isAnimating) {
      return;
    }

    isAnimating = true;
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    currentIndex = getWrappedIndex(currentIndex + direction);
    applyState(currentIndex);

    window.setTimeout(() => {
      isAnimating = false;
      prevBtn.disabled = false;
      nextBtn.disabled = false;
    }, durationMs);
  };

  prevBtn.addEventListener("click", () => {
    navigate(-1);
  });

  nextBtn.addEventListener("click", () => {
    navigate(1);
  });

  showcase.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      navigate(-1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      navigate(1);
    }
  });

  applyState(currentIndex);
};

initLayeredShowcase({
  showcaseSelector: "[data-photo-book]",
  cardSelector: "[data-photo-book-card]",
  prevSelector: "[data-photo-book-prev]",
  nextSelector: "[data-photo-book-next]",
  stateClasses: {
    active: "is-active",
    prev: "is-prev",
    next: "is-next",
    hiddenLeft: "is-hidden-left",
    hiddenRight: "is-hidden-right",
  },
});

initLayeredShowcase({
  showcaseSelector: "[data-trident-reel]",
  cardSelector: "[data-trident-card]",
  prevSelector: "[data-trident-prev]",
  nextSelector: "[data-trident-next]",
  stateClasses: {
    active: "is-active",
    prev: "is-prev",
    next: "is-next",
    hiddenLeft: "is-hidden-left",
    hiddenRight: "is-hidden-right",
  },
});

const initProjectLineup = () => {
  const lineup = document.querySelector("[data-project-lineup]");
  if (!lineup) {
    return;
  }

  const track = lineup.querySelector(".project-lineup-track");
  const cards = Array.from(lineup.querySelectorAll("[data-lineup-card]"));
  const prevBtn = lineup.querySelector("[data-lineup-prev]");
  const nextBtn = lineup.querySelector("[data-lineup-next]");

  if (!track || cards.length === 0 || !prevBtn || !nextBtn) {
    return;
  }

  let activeIndex = 0;
  let touchStartX = null;

  const getWrappedIndex = (index) => {
    const total = cards.length;
    return (index + total) % total;
  };

  const setCardImage = (card, nextImageIndex) => {
    const media = Array.from(card.querySelectorAll(".lineup-media"));
    const dots = Array.from(card.querySelectorAll(".lineup-dot"));
    if (media.length === 0 || nextImageIndex < 0 || nextImageIndex >= media.length) {
      return;
    }

    media.forEach((item, index) => {
      item.classList.toggle("is-active", index === nextImageIndex);
      item.setAttribute("aria-hidden", String(index !== nextImageIndex));
    });

    dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === nextImageIndex);
      dot.setAttribute("aria-selected", String(index === nextImageIndex));
    });

    card.dataset.activeImage = String(nextImageIndex);
  };

  const toggleCardDetails = (card, button) => {
    const details = card.querySelector(".lineup-card-details");
    if (!details || !button) {
      return;
    }

    const isOpen = !details.hidden;
    details.hidden = isOpen;
    button.setAttribute("aria-expanded", String(!isOpen));
  };

  const updateTrackPosition = () => {
    const activeCard = cards[activeIndex];
    if (!activeCard) {
      return;
    }

    const lineupRect = lineup.getBoundingClientRect();
    const centerOffset = lineupRect.width / 2 - (activeCard.offsetLeft + activeCard.offsetWidth / 2);
    track.style.transform = `translate3d(${centerOffset}px, 0, 0)`;
  };

  const applyCardStates = () => {
    cards.forEach((card, index) => {
      const isActive = index === activeIndex;
      const isPrev = getWrappedIndex(activeIndex - 1) === index;
      const isNext = getWrappedIndex(activeIndex + 1) === index;

      card.classList.toggle("is-active", isActive);
      card.classList.toggle("is-neighbor", !isActive && (isPrev || isNext));
      card.setAttribute("aria-hidden", String(!isActive));
    });

    updateTrackPosition();
  };

  const navigate = (direction) => {
    activeIndex = getWrappedIndex(activeIndex + direction);
    applyCardStates();
  };

  cards.forEach((card) => {
    const media = Array.from(card.querySelectorAll(".lineup-media"));
    media.forEach((item, index) => {
      item.setAttribute("aria-hidden", String(index !== 0));
    });

    const dots = Array.from(card.querySelectorAll(".lineup-dot"));
    dots.forEach((dot, index) => {
      dot.setAttribute("aria-selected", String(index === 0));
      dot.addEventListener("click", () => {
        setCardImage(card, index);
      });
    });

    const nextImageBtn = card.querySelector("[data-lineup-next-image]");
    if (nextImageBtn) {
      nextImageBtn.addEventListener("click", () => {
        const currentImage = Number(card.dataset.activeImage || "0");
        const nextImage = (currentImage + 1) % media.length;
        setCardImage(card, nextImage);
      });
    }

    const toggleDetailsBtn = card.querySelector("[data-lineup-toggle-details]");
    if (toggleDetailsBtn) {
      toggleDetailsBtn.addEventListener("click", () => {
        toggleCardDetails(card, toggleDetailsBtn);
      });
    }

    card.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (target.closest("button")) {
        return;
      }

      activeIndex = cards.indexOf(card);
      applyCardStates();
    });

    card.dataset.activeImage = "0";
  });

  prevBtn.addEventListener("click", () => {
    navigate(-1);
  });

  nextBtn.addEventListener("click", () => {
    navigate(1);
  });

  lineup.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      navigate(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      navigate(1);
    }
  });

  lineup.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].clientX;
  });

  lineup.addEventListener("touchend", (event) => {
    if (touchStartX === null) {
      return;
    }

    const delta = event.changedTouches[0].clientX - touchStartX;
    touchStartX = null;

    if (Math.abs(delta) < 36) {
      return;
    }

    navigate(delta < 0 ? 1 : -1);
  });

  window.addEventListener("resize", updateTrackPosition);
  applyCardStates();
};

initProjectLineup();

const initPcbCarousel = (carousel) => {
  const viewport = carousel.querySelector(".pcb-carousel-viewport");
  const track = carousel.querySelector(".pcb-carousel-track");
  const prevBtn = carousel.querySelector(".pcb-nav.prev");
  const nextBtn = carousel.querySelector(".pcb-nav.next");
  const dotsWrapper = carousel.querySelector(".pcb-dots");

  if (!viewport || !track || !prevBtn || !nextBtn || !dotsWrapper) {
    return;
  }

  const slides = Array.from(track.children);
  if (slides.length === 0) {
    return;
  }

  const hint = carousel.querySelector(".pcb-hint");
  if (slides.length === 1) {
    prevBtn.hidden = true;
    nextBtn.hidden = true;
    dotsWrapper.hidden = true;
    if (hint) {
      hint.hidden = true;
    }
    slides[0].setAttribute("aria-hidden", "false");
    return;
  }

  let currentIndex = 0;

  const dots = slides.map((_, index) => {
    const dot = document.createElement("button");
    dot.className = "pcb-dot";
    dot.type = "button";
    dot.role = "tab";
    dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
    dot.addEventListener("click", () => {
      updateSlide(index);
    });
    dotsWrapper.appendChild(dot);
    return dot;
  });

  const updateSlide = (index) => {
    const lastIndex = slides.length - 1;
    if (index < 0) {
      currentIndex = lastIndex;
    } else if (index > lastIndex) {
      currentIndex = 0;
    } else {
      currentIndex = index;
    }

    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    dots.forEach((dot, dotIndex) => {
      dot.setAttribute("aria-selected", String(dotIndex === currentIndex));
    });

    slides.forEach((slide, slideIndex) => {
      slide.setAttribute("aria-hidden", String(slideIndex !== currentIndex));
    });
  };

  prevBtn.addEventListener("click", () => {
    updateSlide(currentIndex - 1);
  });

  nextBtn.addEventListener("click", () => {
    updateSlide(currentIndex + 1);
  });

  viewport.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      updateSlide(currentIndex + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      updateSlide(currentIndex - 1);
    }
  });

  updateSlide(0);
};

document.querySelectorAll("[data-carousel]").forEach((carousel) => {
  initPcbCarousel(carousel);
});

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    const targetId = anchor.getAttribute("href");
    if (!targetId || targetId === "#") {
      return;
    }

    const targetElement = document.querySelector(targetId);
    if (!targetElement) {
      return;
    }

    event.preventDefault();
    targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});
