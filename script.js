const revealItems = document.querySelectorAll("[data-reveal]");

revealItems.forEach((item) => item.classList.add("reveal"));

const observer = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
);

revealItems.forEach((item) => observer.observe(item));

const observeReveal = (items) => {
  if (!items || !items.forEach) {
    return;
  }
  items.forEach((item) => {
    item.classList.add("reveal");
    observer.observe(item);
  });
};

const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isOpen));
    navLinks.classList.toggle("is-open");
  });
}

const year = document.querySelector("#year");
if (year) {
  year.textContent = new Date().getFullYear();
}

const contactForm = document.querySelector("#contact-form");
const formStatus = document.querySelector(".form-status");
const submitButton = contactForm
  ? contactForm.querySelector("button[type=\"submit\"]")
  : null;
const submitLabel = submitButton ? submitButton.textContent : "Enviar solicitud";

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!contactForm.reportValidity()) {
      return;
    }

    const formData = new FormData(contactForm);
    const action = contactForm.getAttribute("action") || "contacto.php";

    if (formStatus) {
      formStatus.textContent = "Enviando mensaje...";
      formStatus.classList.add("is-visible");
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Enviando...";
    }

    try {
      const response = await fetch(action, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data || !data.ok) {
        const message = data && data.message ? data.message : "";
        throw new Error(message || "No se pudo enviar el mensaje.");
      }

      contactForm.reset();

      if (formStatus) {
        formStatus.textContent =
          "Tu mensaje se enviará automáticamente a nuestro equipo.";
      }
    } catch (error) {
      if (formStatus) {
        formStatus.textContent =
          "No se pudo enviar. Intenta de nuevo o llámanos.";
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = submitLabel;
      }
    }
  });

  contactForm.addEventListener("input", () => {
    if (formStatus) {
      formStatus.textContent = "";
      formStatus.classList.remove("is-visible");
    }
  });
}

const projectsContainer = document.querySelector("[data-projects]");
const paginationContainer = document.querySelector("[data-projects-pagination]");
const PROJECTS_PER_PAGE = 12;
let projectsData = [];
let currentProjectsPage = 1;

const normalizeProjectImages = (images) => {
  if (!Array.isArray(images)) {
    return [];
  }
  return images
    .map((image) => {
      if (typeof image === "string") {
        return { src: image, alt: "" };
      }
      if (image && typeof image === "object" && image.src) {
        return { src: image.src, alt: image.alt || "" };
      }
      return null;
    })
    .filter(Boolean);
};

const buildCover = (image, title) => {
  const cover = document.createElement("div");
  cover.className = "project-cover";

  if (!image || !image.src) {
    const empty = document.createElement("div");
    empty.className = "cover-empty";
    empty.textContent = "Sin imagen de portada";
    cover.appendChild(empty);
    return cover;
  }

  const img = document.createElement("img");
  img.src = image.src;
  img.alt = image.alt || title || "Proyecto";
  img.loading = "lazy";
  cover.appendChild(img);
  return cover;
};

const buildCarousel = (images, title) => {
  const carousel = document.createElement("div");
  carousel.className = "project-carousel";

  if (!images.length) {
    const empty = document.createElement("div");
    empty.className = "carousel-empty";
    empty.textContent = "Sin imágenes disponibles";
    carousel.appendChild(empty);
    return carousel;
  }

  const track = document.createElement("div");
  track.className = "carousel-track";

  images.forEach((image, imageIndex) => {
    const slide = document.createElement("div");
    slide.className = "carousel-slide";
    if (imageIndex === 0) {
      slide.classList.add("is-active");
    }

    const img = document.createElement("img");
    img.src = image.src;
    img.alt = image.alt || title || "Proyecto";
    img.loading = "lazy";
    slide.appendChild(img);
    track.appendChild(slide);
  });

  carousel.appendChild(track);

  if (images.length > 1) {
    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "carousel-btn prev";
    prev.setAttribute("aria-label", "Imagen anterior");
    prev.innerHTML = "&lsaquo;";

    const next = document.createElement("button");
    next.type = "button";
    next.className = "carousel-btn next";
    next.setAttribute("aria-label", "Imagen siguiente");
    next.innerHTML = "&rsaquo;";

    const counter = document.createElement("div");
    counter.className = "carousel-counter";
    counter.textContent = `1 / ${images.length}`;

    carousel.appendChild(prev);
    carousel.appendChild(next);
    carousel.appendChild(counter);
  }

  return carousel;
};

const initCarousels = (container) => {
  const carousels = container.querySelectorAll(".project-carousel");

  carousels.forEach((carousel) => {
    const slides = carousel.querySelectorAll(".carousel-slide");
    if (slides.length <= 1) {
      return;
    }

    let currentIndex = 0;
    const counter = carousel.querySelector(".carousel-counter");

    const updateSlides = () => {
      slides.forEach((slide, index) => {
        slide.classList.toggle("is-active", index === currentIndex);
      });
      if (counter) {
        counter.textContent = `${currentIndex + 1} / ${slides.length}`;
      }
    };

    const prev = carousel.querySelector(".carousel-btn.prev");
    const next = carousel.querySelector(".carousel-btn.next");

    if (prev) {
      prev.addEventListener("click", () => {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        updateSlides();
      });
    }

    if (next) {
      next.addEventListener("click", () => {
        currentIndex = (currentIndex + 1) % slides.length;
        updateSlides();
      });
    }
  });
};

const modal = document.querySelector("[data-project-modal]");
const modalCarousel = modal ? modal.querySelector("[data-modal-carousel]") : null;
const modalTitle = modal ? modal.querySelector("#project-modal-title") : null;
const modalDescription = modal ? modal.querySelector("[data-modal-description]") : null;
const modalTag = modal ? modal.querySelector("[data-modal-tag]") : null;

const openModal = (project, index) => {
  if (!modal || !modalCarousel || !modalTitle || !modalDescription) {
    return;
  }

  modalCarousel.innerHTML = "";
  const images = normalizeProjectImages(project.images);
  modalCarousel.appendChild(buildCarousel(images, project.title));
  initCarousels(modalCarousel);

  modalTitle.textContent = project.title || "Proyecto";
  modalDescription.textContent = project.description || "Descripción pendiente.";
  if (modalTag) {
    modalTag.textContent = `Proyecto ${String(index + 1).padStart(2, "0")}`;
  }

  modal.classList.add("is-open");
  modal.removeAttribute("aria-hidden");
  document.body.style.overflow = "hidden";
};

const closeModal = () => {
  if (!modal) {
    return;
  }
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
};

if (modal) {
  modal.addEventListener("click", (event) => {
    if (event.target && event.target.matches("[data-modal-close]")) {
      closeModal();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });
}

const renderProjects = (projects) => {
  if (!projectsContainer) {
    return;
  }

  if (!projects.length) {
    projectsContainer.innerHTML = "<div class=\"case-empty\" data-reveal>Aún no hay proyectos cargados.</div>";
    observeReveal(projectsContainer.querySelectorAll("[data-reveal]"));
    if (paginationContainer) {
      paginationContainer.innerHTML = "";
    }
    return;
  }

  projectsContainer.innerHTML = "";
  const fragment = document.createDocumentFragment();

  projects.forEach((project, index) => {
    const card = document.createElement("article");
    card.className = "case-card project-card";
    card.setAttribute("data-reveal", "");

    const tag = document.createElement("span");
    tag.className = "case-tag";
    tag.textContent = `Proyecto ${String(index + 1).padStart(2, "0")}`;

    const images = normalizeProjectImages(project.images);
    const cover = buildCover(images[0], project.title);

    const title = document.createElement("h3");
    title.textContent = project.title || "Proyecto";

    const desc = document.createElement("p");
    desc.textContent = project.description || "Descripción pendiente.";

    const meta = document.createElement("div");
    meta.className = "project-meta";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-ghost";
    button.textContent = "Ver detalles";
    button.addEventListener("click", () => openModal(project, index));
    meta.appendChild(title);
    meta.appendChild(desc);
    meta.appendChild(button);

    card.appendChild(tag);
    card.appendChild(cover);
    card.appendChild(meta);
    fragment.appendChild(card);
  });

  projectsContainer.appendChild(fragment);
  observeReveal(projectsContainer.querySelectorAll("[data-reveal]"));
  initCarousels(projectsContainer);
};

if (projectsContainer) {
  fetch("data/projects.json", { cache: "no-store" })
    .then((response) => response.json())
    .then((data) => {
      projectsData = data && Array.isArray(data.projects) ? data.projects : [];
      currentProjectsPage = 1;
      renderProjectsPage();
    })
    .catch(() => {
      projectsContainer.innerHTML =
        "<div class=\"case-empty\" data-reveal>No se pudieron cargar los proyectos.</div>";
      observeReveal(projectsContainer.querySelectorAll("[data-reveal]"));
    });
}

const renderPagination = () => {
  if (!paginationContainer) {
    return;
  }

  const totalPages = Math.ceil(projectsData.length / PROJECTS_PER_PAGE);
  if (totalPages <= 1) {
    paginationContainer.innerHTML = "";
    return;
  }

  paginationContainer.innerHTML = "";
  const pager = document.createElement("div");
  pager.className = "pagination";

  const createButton = (label, page, isActive = false, disabled = false) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.className = "pagination-btn";
    if (isActive) {
      btn.classList.add("is-active");
    }
    if (disabled) {
      btn.disabled = true;
    }
    btn.addEventListener("click", () => {
      if (page === currentProjectsPage || page < 1 || page > totalPages) {
        return;
      }
      currentProjectsPage = page;
      renderProjectsPage();
      const section = document.querySelector("#proyectos");
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    return btn;
  };

  pager.appendChild(
    createButton("←", currentProjectsPage - 1, false, currentProjectsPage === 1)
  );

  for (let i = 1; i <= totalPages; i += 1) {
    pager.appendChild(createButton(String(i), i, i === currentProjectsPage));
  }

  pager.appendChild(
    createButton("→", currentProjectsPage + 1, false, currentProjectsPage === totalPages)
  );

  paginationContainer.appendChild(pager);
};

const renderProjectsPage = () => {
  const start = (currentProjectsPage - 1) * PROJECTS_PER_PAGE;
  const end = start + PROJECTS_PER_PAGE;
  renderProjects(projectsData.slice(start, end));
  renderPagination();
};

