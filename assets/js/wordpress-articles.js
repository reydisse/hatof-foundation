class WordPressArticles {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || "https://wp.picturethisproduction.ca/wp-json/wp/v2";
    this.postsPerPage = options.postsPerPage || 3;
    this.container = options.container || ".latest-articles .row";
    this.debug = options.debug || false;

    // Add the category ID for "News and Updates"
    // Replace this number with your actual "News and Updates" category ID
    this.newsUpdatesCategoryId = options.categoryId || 1; // Change this to your actual category ID
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("en-GH", { month: "short" });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  async fetchLatestPosts() {
    try {
      // Modified URL to include category filter
      const url = `${this.baseUrl}/posts?_embed&per_page=${this.postsPerPage}&categories=${this.newsUpdatesCategoryId}`;

      if (this.debug) {
        console.log("Fetching posts from:", url);
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching posts:", error);
      return [];
    }
  }

  createPostHTML(post) {
    const featuredImage =
      post._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
      "assets/images/blog/placeholder.jpg";
    const formattedDate = this.formatDate(post.date);

    return `
        <div class="col-xl-4 col-lg-4 wow fadeInUp" data-wow-delay="100ms">
            <div class="article-card">
                <div class="article-card__image">
                    <img src="${featuredImage}" alt="${post.title.rendered}" style="width: 100%; height: 100%; object-fit: cover;">
                    <a href="/news/${post.slug}/">
                        <span class="article-card__plus"></span>
                    </a>
                    <div class="article-card__date">
                        <p>${formattedDate}</p>
                    </div>
                </div>
                <div class="article-card__content">
                    <h3 class="article-card__title">
                        <a href="/news/${post.slug}/">${post.title.rendered}</a>
                    </h3>
                    <div class="article-card__footer">
                        <a href="/news/${post.slug}/" class="article-card__btn">Read More</a>
                        <a href="/news/${post.slug}/" class="article-card__arrow">
                            <span class="icon-right-arrow"></span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
  }

  async renderPosts() {
    const container = document.querySelector(this.container);
    if (!container) return;

    try {
      const posts = await this.fetchLatestPosts();

      if (posts.length === 0) {
        throw new Error("No posts found");
      }

      container.innerHTML = posts
        .map((post) => this.createPostHTML(post))
        .join("");

      // Reinitialize wow animations
      if (typeof WOW !== "undefined") {
        new WOW().init();
      }
    } catch (error) {
      console.error("Error:", error);
      // Fallback content
      container.innerHTML = this.getFallbackContent();
    }
  }

  getFallbackContent() {
    return `
          <div class="col-xl-4 col-lg-4 wow fadeInUp" data-wow-delay="100ms">
              <div class="article-card">
                  <div class="article-card__image">
                      <img src="assets/images/blog/wgdsi.jpg" alt="WGDSI-2" style="width: 100%; height: 100%; object-fit: cover;">
                      <a href="Story-update-3.html">
                          <span class="article-card__plus"></span>
                      </a>
                      <div class="article-card__date">
                          <p>14 Aug 2024</p>
                      </div>
                  </div>
                  <div class="article-card__content">
                      <h3 class="article-card__title">
                          <a href="Story-update-3.html">HATOF Foundation at WGDSI-2: Advancing Benefit-Sharing Mechanisms</a>
                      </h3>
                      <div class="article-card__footer">
                          <a href="Story-update-3.html" class="article-card__btn">Read More</a>
                          <a href="Story-update-3.html" class="article-card__arrow">
                              <span class="icon-right-arrow"></span>
                          </a>
                      </div>
                  </div>
              </div>
          </div>
          <!-- Add more fallback articles as needed -->
      `;
  }
}
