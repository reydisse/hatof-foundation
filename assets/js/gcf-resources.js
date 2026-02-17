class GCFResourcesGallery {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || "https://wp.picturethisproduction.ca/wp-json/wp/v2";
    this.container = options.container || ".media-grid";
    this.perPage = options.perPage || 9;
    this.currentTab = "photos";

    this.init();
  }

  init() {
    this.container = document.querySelector(this.container);
    if (!this.container) {
      console.error("Container not found");
      return;
    }

    this.setupEventListeners();
    this.loadContent("photos");
  }

  setupEventListeners() {
    document.querySelectorAll(".tab-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const type = e.target.dataset.tab;
        this.switchTab(type);
      });
    });
  }

  async loadContent(type) {
    try {
      this.container.innerHTML = '<div class="loading">Loading...</div>';

      const url = `${this.baseUrl}/gcf_resource?resource_type=${type}&_embed&per_page=${this.perPage}`;
      const response = await fetch(url);

      if (!response.ok) throw new Error("Network response was not ok");

      const resources = await response.json();
      this.renderContent(resources);
    } catch (error) {
      console.error("Error loading content:", error);
      this.container.innerHTML =
        '<div class="error">Error loading content. Please try again.</div>';
    }
  }

  renderContent(resources) {
    if (!resources.length) {
      this.container.innerHTML =
        '<div class="no-content">No content available.</div>';
      return;
    }

    this.container.innerHTML = resources
      .map((resource) => {
        const imageUrl = resource.image_url || "path/to/placeholder.jpg";
        const title = resource.title.rendered;
        const date = resource.meta_data.event_date;
        const location = resource.meta_data.location;

        return `
                <div class="media-item">
                    <img src="${imageUrl}" alt="${title}">
                    <div class="media-item__overlay">
                        <h3>${title}</h3>
                        ${date ? `<p>Date: ${date}</p>` : ""}
                        ${location ? `<p>Location: ${location}</p>` : ""}
                    </div>
                </div>
            `;
      })
      .join("");
  }

  switchTab(type) {
    this.currentTab = type;

    // Update active tab
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === type);
    });

    this.loadContent(type);
  }
}
