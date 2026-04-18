const CONFIG_PATH = "data/site-content.json";

const state = {
    content: null,
    particles: [],
    mouse: { x: null, y: null, radius: 150 },
};

document.addEventListener("DOMContentLoaded", () => {
    initializeApp().catch((error) => {
        console.error("Failed to initialize portfolio", error);
        renderLoadError();
    });
});

async function initializeApp() {
    const embeddedContent = readEmbeddedContent();
    if (embeddedContent) {
        state.content = embeddedContent;
    } else {
        const response = await fetch(CONFIG_PATH);
        if (!response.ok) {
            throw new Error(`Config request failed: ${response.status}`);
        }

        state.content = await response.json();
    }

    renderContent(state.content);
    bindEvents();
    initHeroCanvas();
    startScrollReveal();
    refreshIcons();
}

function renderContent(content) {
    document.title = content.meta.title;
    setText("nav-logo", content.nav.logo);
    renderNavLinks(content.nav.links);

    setText("hero-name", content.hero.name);
    setText("hero-title", content.hero.title);
    setText("resume-button-text", content.hero.resumeButtonLabel);
    setText("linkedin-text", content.hero.linkedinLabel);
    document.getElementById("linkedin-button").href = content.hero.linkedinUrl;

    setText("engineering-title", content.engineering.title);
    renderTimeline(content.engineering.timeline);
    setText("projects-subtitle", content.engineering.projectsTitle);
    renderProjects("projects-grid", content.engineering.projects);

    renderNarrativeSection("mobility", content.mobility, false);
    renderNarrativeSection("civic", content.civic, true);
    renderCareer(content.career);
    renderOther(content.other);
    renderResume(content.resume);
    renderVideoSection("pitch", content.pitch);
    renderVideoSection("retake", content.retake);
    setText("footer-text", content.footer);
}

function bindEvents() {
    document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    window.addEventListener("mousemove", (event) => {
        state.mouse.x = event.x;
        state.mouse.y = event.y;
    });
}

function renderNavLinks(links) {
    const container = document.getElementById("nav-links");
    container.innerHTML = links.map((link) => (
        `<a href="${escapeAttribute(link.href)}">${escapeHtml(link.label)}</a>`
    )).join("");
}

function renderTimeline(items) {
    const container = document.getElementById("engineering-timeline");
    container.innerHTML = items.map((item) => `
        <div class="timeline-item reveal">
            <div class="tm-date">${escapeHtml(item.date)}</div>
            <div class="tm-title">${escapeHtml(item.title)}</div>
            <div class="tm-loc">${escapeHtml(item.location)}</div>
            <ul class="tm-desc">
                ${item.description.map((line) => `
                    <li class="${line.highlight ? "highlight" : ""}">
                        ${line.icon ? `<i data-lucide="${escapeAttribute(line.icon)}" class="icon-sm"></i> ` : ""}
                        ${escapeHtml(line.text)}
                    </li>
                `).join("")}
            </ul>
        </div>
    `).join("");
}

function renderProjects(targetId, projects) {
    const container = document.getElementById(targetId);
    container.innerHTML = projects.map((project) => `
        <article class="project-card reveal ${project.static ? "static-card" : ""}">
            <div>
                ${project.date ? `<p class="card-date">${escapeHtml(project.date)}</p>` : ""}
                <h4>${escapeHtml(project.title)}</h4>
                <p>${escapeHtml(project.description)}</p>
            </div>
            ${project.tags?.length ? `
                <div class="tag-row">
                    ${project.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
                </div>
            ` : ""}
        </article>
    `).join("");
}

function renderNarrativeSection(targetId, section, iconFirst) {
    const container = document.getElementById(targetId);
    const textContent = `
        <div class="narrative-content reveal">
            <div class="section-header">
                <h2>${escapeHtml(section.title)}</h2>
            </div>
            ${section.heading ? `<h3>${escapeHtml(section.heading)}</h3>` : ""}
            <p>${escapeHtml(section.body)}</p>
            ${section.tags?.length ? `
                <div class="tag-row">
                    ${section.tags.map((tag) => `<span class="tag tag-inverse">${escapeHtml(tag)}</span>`).join("")}
                </div>
            ` : ""}
        </div>
    `;
    const visualItems = (section.visualItems ?? []).map((item) => `
        <span class="visual-chip">${escapeHtml(item)}</span>
    `).join("");
    const iconContent = `
        <div class="visual-panel reveal">
            <div class="visual-orb visual-orb-a"></div>
            <div class="visual-orb visual-orb-b"></div>
            ${section.illustrationUrl ? `
                <div class="visual-illustration-wrap">
                    <img
                        class="visual-illustration"
                        src="${escapeAttribute(section.illustrationUrl)}"
                        alt="${escapeAttribute(section.illustrationAlt ?? section.title)}"
                        loading="lazy"
                    >
                </div>
            ` : ""}
            <div class="visual-card">
                <div class="visual-copy">
                    <span class="visual-kicker">${escapeHtml(section.title)}</span>
                    ${section.heading ? `<strong>${escapeHtml(section.heading)}</strong>` : ""}
                </div>
            </div>
            <div class="visual-chip-grid">
                ${visualItems}
            </div>
        </div>
    `;

    container.innerHTML = `
        <div class="narrative-card">
            ${iconFirst ? iconContent + textContent : textContent + iconContent}
        </div>
    `;
}

function renderCareer(section) {
    const container = document.getElementById("career");
    container.innerHTML = `
        <div class="section-header">
            <h2>${escapeHtml(section.title)}</h2>
        </div>
        <div class="project-grid" id="career-grid"></div>
    `;
    renderProjects("career-grid", section.items);
}

function renderOther(section) {
    const container = document.getElementById("other");
    container.innerHTML = `
        <div class="section-header">
            <h2>${escapeHtml(section.title)}</h2>
        </div>
        <div class="project-grid" id="other-grid"></div>
    `;
    renderProjects("other-grid", section.items);
}

function renderResume(section) {
    const container = document.getElementById("cv");
    container.innerHTML = `
        <div class="section-header">
            <h2>${escapeHtml(section.title)}</h2>
        </div>
        <div class="cv-grid">
            ${section.files.map((file) => `
                <div class="reveal">
                    <div class="browser">
                        <div class="browser-header">
                            <div class="dot"></div>
                            <div class="dot"></div>
                            <div class="dot"></div>
                        </div>
                        <iframe class="pdf" src="${escapeAttribute(file.path)}#toolbar=0" title="${escapeAttribute(file.language)} resume"></iframe>
                    </div>
                    <div class="cv-meta">
                        <span class="cv-language">${escapeHtml(file.language)}</span>
                        <a href="${escapeAttribute(file.path)}" download class="btn btn-dark btn-sm">${escapeHtml(file.downloadLabel)}</a>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

function renderVideoSection(targetId, section) {
    const container = document.getElementById(targetId);
    const videoContent = section.videoUrl
        ? `<iframe width="100%" height="100%" src="${escapeAttribute(section.videoUrl)}" title="${escapeAttribute(section.title)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`
        : `<div class="video-placeholder">${escapeHtml(section.placeholder ?? "Video coming soon.")}</div>`;

    container.innerHTML = `
        <div class="section-header">
            <h2>${escapeHtml(section.title)}</h2>
        </div>
        <div class="browser reveal pitch-frame">
            ${videoContent}
        </div>
    `;
}

function toggleTheme() {
    const body = document.body;
    const icon = document.getElementById("theme-icon");
    const isLight = body.getAttribute("data-theme") === "light";
    body.setAttribute("data-theme", isLight ? "dark" : "light");
    icon.setAttribute("data-lucide", isLight ? "sun" : "moon");
    refreshIcons();
}

function updateScrollProgress() {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    document.getElementById("scroll-progress").style.width = `${(winScroll / height) * 100}%`;
}

function initHeroCanvas() {
    const canvas = document.getElementById("hero-canvas");
    const ctx = canvas.getContext("2d");

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.size = 2;
            this.density = (Math.random() * 30) + 1;
        }

        draw() {
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--text-light");
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > canvas.width) {
                this.vx *= -1;
            }
            if (this.y < 0 || this.y > canvas.height) {
                this.vy *= -1;
            }

            const dx = state.mouse.x - this.x;
            const dy = state.mouse.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0 && distance < state.mouse.radius) {
                const force = (state.mouse.radius - distance) / state.mouse.radius;
                this.x -= (dx / distance) * force * this.density * 0.5;
                this.y -= (dy / distance) * force * this.density * 0.5;
            }
        }
    }

    function initParticles() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        state.particles = [];
        for (let index = 0; index < 80; index += 1) {
            state.particles.push(new Particle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < state.particles.length; i += 1) {
            const current = state.particles[i];
            current.draw();
            current.update();

            for (let j = i; j < state.particles.length; j += 1) {
                const other = state.particles[j];
                const dx = current.x - other.x;
                const dy = current.y - other.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 150) {
                    ctx.strokeStyle = `rgba(150, 150, 150, ${1 - distance / 150})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(current.x, current.y);
                    ctx.lineTo(other.x, other.y);
                    ctx.stroke();
                }
            }
        }

        window.requestAnimationFrame(animate);
    }

    window.addEventListener("resize", initParticles);
    initParticles();
    animate();
}

function startScrollReveal() {
    if (typeof ScrollReveal === "function") {
        ScrollReveal().reveal(".reveal", {
            distance: "40px",
            duration: 1000,
            origin: "bottom",
            interval: 100,
            easing: "ease-out",
        });
    }
}

function refreshIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function readEmbeddedContent() {
    const element = document.getElementById("site-content");
    if (!element?.textContent.trim()) {
        return null;
    }

    return JSON.parse(element.textContent);
}

function renderLoadError() {
    const app = document.getElementById("app");
    app.innerHTML = `
        <div class="load-error">
            <h1>Content failed to load</h1>
            <p>Check the embedded JSON config or <code>${CONFIG_PATH}</code>.</p>
        </div>
    `;
}

function setText(id, value) {
    document.getElementById(id).textContent = value;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
    return escapeHtml(value);
}
