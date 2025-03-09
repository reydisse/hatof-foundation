class WordPressPostDetail {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || "https://yourdomain.com/wp-json/wp/v2";
    this.postContainer = options.postContainer || ".news-details__left";
    this.relatedPostsContainer =
      options.relatedPostsContainer || ".sidebar__post-list";
    this.titleContainer = options.titleContainer || ".page-header__inner h2";
    this.debug = options.debug || false;

    // Get post ID from URL parameter
    this.postId = this.getPostIdFromUrl();
    this.postSlug = this.getPostSlugFromUrl();
  }

  extractPostIdFromPath(path) {
    const match = path.match(/[^\/]+-(\d+)\/?$/);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  }

  getPostIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get("id");

    if (idParam) {
      return idParam;
    }

    return this.extractPostIdFromPath(window.location.pathname);
  }

  getPostSlugFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("slug");
  }

  async getPostById(id) {
    try {
      const url = `${this.baseUrl}/posts/${id}?_embed&_fields=id,date,title,content,excerpt,author,author_data,author_name,_embedded`;

      if (this.debug) {
        console.log("Fetching post by ID from:", url);
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Network response was not ok: ${response.status} ${response.statusText}`
        );
      }

      const post = await response.json();

      if (this.debug) {
        console.log("Post data received:", post);
        console.log("Author data:", {
          author_data: post.author_data,
          author_name: post.author_name,
          embedded_author: post._embedded?.author?.[0],
        });
      }

      return post;
    } catch (error) {
      console.error("Error fetching post by ID:", error);
      return null;
    }
  }

  async getPostBySlug(slug) {
    try {
      const url = `${this.baseUrl}/posts?slug=${slug}&_embed`;

      if (this.debug) {
        console.log("Fetching post by slug from:", url);
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Network response was not ok: ${response.status} ${response.statusText}`
        );
      }

      const posts = await response.json();

      if (posts.length === 0) {
        throw new Error(`No post found with slug: ${slug}`);
      }

      return posts[0];
    } catch (error) {
      console.error("Error fetching post by slug:", error);
      return null;
    }
  }

  async getRecentPosts(count = 3, excludeId = null) {
    try {
      let url = `${this.baseUrl}/posts?_embed&per_page=${count}`;

      if (excludeId) {
        url += `&exclude=${excludeId}`;
      }

      if (this.debug) {
        console.log("Fetching recent posts from:", url);
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Network response was not ok: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching recent posts:", error);
      return [];
    }
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("en-GH", { month: "long" });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  getAuthorName(post) {
    if (this.debug) {
      console.log("Checking author data:", {
        author_data: post.author_data,
        author_name: post.author_name,
        embedded_author: post._embedded?.author?.[0],
      });
    }

    try {
      // Try to get author name from our custom field first
      if (post.author_name) {
        return post.author_name;
      }

      // Try author_data from our custom endpoint
      if (post.author_data?.name) {
        return post.author_data.name;
      }

      // Try embedded author data
      if (post._embedded?.author?.[0]?.name) {
        return post._embedded.author[0].name;
      }

      // If we have an author object but no name
      if (post._embedded?.author?.[0] && !post._embedded.author[0].code) {
        return post._embedded.author[0].slug
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }

      // Default fallback
      return "HATOF Foundation";
    } catch (error) {
      console.error("Error getting author name:", error);
      return "HATOF Foundation";
    }
  }

  getFeaturedImage(post) {
    if (
      post._embedded &&
      post._embedded["wp:featuredmedia"] &&
      post._embedded["wp:featuredmedia"][0]
    ) {
      return post._embedded["wp:featuredmedia"][0].source_url;
    }
    return "assets/images/blog/placeholder.jpg";
  }

  getCategories(post) {
    if (post._embedded && post._embedded["wp:term"]) {
      const categories = post._embedded["wp:term"][0] || [];
      return categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
      }));
    }
    return [];
  }

  getTags(post) {
    if (
      post._embedded &&
      post._embedded["wp:term"] &&
      post._embedded["wp:term"][1]
    ) {
      const tags = post._embedded["wp:term"][1] || [];
      return tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
      }));
    }
    return [];
  }

  createCategoryLinks(categories) {
    if (!categories || categories.length === 0) {
      return "";
    }

    return categories
      .map(
        (cat) =>
          `<a href="news.html?category=${cat.id}" class="news-details__tag">${cat.name}</a>`
      )
      .join(" ");
  }

  createTagLinks(tags) {
    if (!tags || tags.length === 0) {
      return "";
    }

    return tags
      .map(
        (tag) =>
          `<a href="news.html?tag=${tag.id}" class="news-details__tag">${tag.name}</a>`
      )
      .join(" ");
  }

  renderPost(post) {
    if (!post) {
      this.renderErrorMessage();
      return;
    }

    const container = document.querySelector(this.postContainer);
    if (!container) {
      console.error(`Post container ${this.postContainer} not found`);
      return;
    }

    // Update page title
    document.title = post.title.rendered + " || HATOF Foundation";

    // Update header title
    const titleContainer = document.querySelector(this.titleContainer);
    if (titleContainer) {
      titleContainer.textContent = post.title.rendered;
    }

    // Get post details
    const featuredImage = this.getFeaturedImage(post);
    const date = this.formatDate(post.date);
    const author = this.getAuthorName(post);
    const categories = this.getCategories(post);
    const tags = this.getTags(post);

    const categoryIds = categories.map((cat) => cat.id);
    const categoryLinks = this.createCategoryLinks(categories);
    const tagLinks = this.createTagLinks(tags);

    // Render post content
    container.innerHTML = `
            <div class="news-details__img">
                <img src="${featuredImage}" alt="${post.title.rendered}">
                <div class="news-details__date-box">
                    <p>${date}</p>
                </div>
            </div>
            <div class="news-details__content">
                <ul class="list-unstyled news-details__meta">
                    <li><a href="#"><i class="far fa-user-circle"></i> ${author}</a></li>
                    ${
                      categories.length > 0
                        ? `<li><i></i>
                       
                         </li>`
                        : ""
                    }
                </ul>
                <h3 class="news-details__title">${post.title.rendered}</h3>
                <div class="news-details__text">
                    ${post.content.rendered}
                </div>
                ${
                  tags.length > 0
                    ? `
                <div class="news-details__tags">
                    <span>Tags:</span>
                    ${tagLinks}
                </div>`
                    : ""
                }
            </div>
            <div class="news-details__bottom">
                <div class="news-details__social-list">
                    <a href="https://twitter.com/share?url=${
                      window.location.href
                    }&text=${encodeURIComponent(
      post.title.rendered
    )}" target="_blank"><i class="fab fa-twitter"></i></a>
                    <a href="https://www.facebook.com/sharer/sharer.php?u=${
                      window.location.href
                    }" target="_blank"><i class="fab fa-facebook"></i></a>
                    <a href="https://www.linkedin.com/sharing/share-offsite/?url=${
                      window.location.href
                    }" target="_blank"><i class="fab fa-linkedin-in"></i></a>
                    <a href="mailto:?subject=${encodeURIComponent(
                      post.title.rendered
                    )}&body=${encodeURIComponent(
      window.location.href
    )}" target="_blank"><i class="fas fa-envelope"></i></a>
                </div>
            </div>
        `;

    // Load related posts
    this.renderRelatedPosts(post.id, categoryIds);
  }

  async renderRelatedPosts(currentPostId, categoryIds) {
    const container = document.querySelector(this.relatedPostsContainer);
    if (!container) {
      console.error(
        `Related posts container ${this.relatedPostsContainer} not found`
      );
      return;
    }

    const recentPosts = await this.getRecentPosts(3, currentPostId);

    if (recentPosts.length === 0) {
      container.innerHTML =
        '<li class="text-center"><p>No related posts found</p></li>';
      return;
    }

    // Clear container
    container.innerHTML = "";

    // Render recent posts
    recentPosts.forEach((post) => {
      const featuredImage = this.getFeaturedImage(post);
      const slug = post.slug || "";

      const postHtml = `
                <li>
                    <div class="sidebar__post-image">
                        <img src="${featuredImage}" alt="${post.title.rendered}">
                    </div>
                    <div class="sidebar__post-content">
                        <h3>
                            <a href="post-details.html?id=${post.id}&slug=${slug}">${post.title.rendered}</a>
                        </h3>
                    </div>
                </li>
            `;

      container.innerHTML += postHtml;
    });
  }

  renderErrorMessage() {
    const container = document.querySelector(this.postContainer);
    if (!container) {
      console.error(`Post container ${this.postContainer} not found`);
      return;
    }

    container.innerHTML = `
            <div class="news-details__content">
                <h3 class="news-details__title">Post Not Found</h3>
                <p class="news-details__text-1">We couldn't find the post you're looking for. It may have been removed or you may have followed an invalid link.</p>
                <p><a href="news.html" class="thm-btn">Back to News</a></p>
            </div>
        `;

    // Update page title
    document.title = "Post Not Found || HATOF Foundation";

    // Update header title
    const titleContainer = document.querySelector(this.titleContainer);
    if (titleContainer) {
      titleContainer.textContent = "Post Not Found";
    }

    // Still load recent posts in the sidebar
    this.renderRelatedPosts(null, []);
  }

  async loadPost() {
    let post = null;

    // First try to get the post by ID if available
    if (this.postId) {
      post = await this.getPostById(this.postId);
    }
    // Otherwise try to get by slug if available
    else if (this.postSlug) {
      post = await this.getPostBySlug(this.postSlug);
    }

    // If no post found and no ID/slug provided, show error
    if (!post && !this.postId && !this.postSlug) {
      this.renderErrorMessage();
      return;
    }

    // If post was found, render it
    if (post) {
      this.renderPost(post);
    } else {
      // Otherwise show error
      this.renderErrorMessage();
    }
  }
}
