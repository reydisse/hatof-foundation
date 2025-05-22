// assets/js/wordpress-integration.js

class WordPressIntegration {
  constructor(options = {}) {
    this.baseUrl =
      options.baseUrl || "https://wp.picturethisproduction.ca/wp-json/wp/v2";
    this.postsPerPage = options.postsPerPage || 9; // Set to 9 posts (3 rows of 3)
    this.categories = options.categories || ""; // Will be set to "1" when initialized
    this.container = options.container || ".news-page .row";
    this.currentPage = 1;
    this.debug = options.debug || false;
  }

  async fetchPosts(page = 1) {
    try {
      const url = `${this.baseUrl}/posts?_embed&status=publish&per_page=${
        this.postsPerPage
      }&page=${page}${this.categories ? "&categories=" + this.categories : ""}`;

      if (this.debug) {
        console.log("Fetching posts from URL:", url);
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Network response was not ok: ${response.status} ${response.statusText}`
        );
      }

      const totalPages =
        parseInt(response.headers.get("X-WP-TotalPages"), 10) || 1;
      const totalPosts = parseInt(response.headers.get("X-WP-Total"), 10) || 0;

      if (this.debug) {
        console.log("Total posts available:", totalPosts);
        console.log("Total pages available:", totalPages);
      }

      const posts = await response.json();

      if (this.debug) {
        console.log("Posts retrieved:", posts.length);
        if (posts.length > 0) {
          console.log("Post data sample:", posts[0]);
        }
      }

      return {
        posts,
        totalPages,
        totalPosts,
      };
    } catch (error) {
      console.error("Error fetching WordPress posts:", error);
      return { posts: [], totalPages: 0, totalPosts: 0 };
    }
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("en-GH", { month: "short" });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  createPostHTML(post) {
    // Get the featured image if available
    const featuredImage =
      post._embedded &&
      post._embedded["wp:featuredmedia"] &&
      post._embedded["wp:featuredmedia"][0]
        ? post._embedded["wp:featuredmedia"][0].source_url
        : "assets/images/blog/placeholder.jpg";

    // Extract post date
    const formattedDate = this.formatDate(post.date);

    return `
    <div class="col-xl-4 col-lg-4 wow fadeInUp" data-wow-delay="100ms">
        <div class="news-one__single">
            <div class="news-one__img">
                <img src="${featuredImage}" alt="${post.title.rendered}">
                <a href="post-details.html?id=${post.id}">
                    <span class="news-one__plus"></span>
                </a>
                <div class="news-one__date">
                    <p>${formattedDate}</p>
                </div>
            </div>
            <div class="news-one__content">
                <h3 class="news-one__title">
                    <a href="post-details.html?id=${post.id}">${post.title.rendered}</a>
                </h3>
                <div class="news-one__bottom">
                    <a href="post-details.html?id=${post.id}" class="news-one__btn">Read More</a>
                    <a href="post-details.html?id=${post.id}" class="news-one__arrow"><span class="icon-right-arrow"></span></a>
                </div>
            </div>
        </div>
    </div>
    `;
  }

  async renderPosts(page = 1) {
    const container = document.querySelector(this.container);
    if (!container) {
      console.error(`Container ${this.container} not found`);
      return { success: false };
    }

    // Show loading state
    container.innerHTML =
      '<div class="col-12 text-center"><p>Loading posts...</p></div>';

    try {
      const { posts, totalPages, totalPosts } = await this.fetchPosts(page);

      // Clear container
      container.innerHTML = "";

      if (posts.length === 0) {
        // If no posts found from WordPress, show fallback content
        if (this.debug) {
          console.log("No posts found from WordPress, using fallback content");
        }
        this.renderFallbackContent(container);
      } else {
        // We have WordPress posts, check if we need to add fallback posts to reach the desired count
        if (posts.length < this.postsPerPage && page === 1) {
          // Only add fallback content to the first page if we don't have enough posts
          if (this.debug) {
            console.log(
              `Only ${posts.length} posts found from WordPress, adding fallback content to reach ${this.postsPerPage}`
            );
          }

          // Render WordPress posts first
          posts.forEach((post) => {
            const postHTML = this.createPostHTML(post);
            container.innerHTML += postHTML;
          });

          // Add fallback content to fill up to desired count
          this.addFallbackPosts(container, posts.length);
        } else {
          // If we have enough WordPress posts, render them all
          posts.forEach((post) => {
            const postHTML = this.createPostHTML(post);
            container.innerHTML += postHTML;
          });
        }
      }

      // Reinitialize wow animations if needed
      if (typeof WOW !== "undefined") {
        new WOW().init();
      }

      return { success: true, totalPages, totalPosts };
    } catch (error) {
      console.error("Error rendering posts:", error);

      // Display fallback static content on error
      this.renderFallbackContent(container);

      // Reinitialize wow animations with fallback content
      if (typeof WOW !== "undefined") {
        new WOW().init();
      }

      return { success: false, error };
    }
  }

  renderFallbackContent(container) {
    container.innerHTML = `
            <div class="col-xl-4 col-lg-4 wow fadeInUp" data-wow-delay="100ms">
                <div class="news-one__single">
                    <div class="news-one__img">
                        <img src="assets/images/blog/wgdsi.jpg" alt="Dr Dotse as Special Envoy on Climate Change">
                        <a href="Story-update-3.html">
                            <span class="news-one__plus"></span>
                        </a>
                        <div class="news-one__date">
                            <p>14 Aug 2024</p>
                        </div>
                    </div>
                    <div class="news-one__content">
                        <h3 class="news-one__title">
                            <a href="Story-update-3.html">HATOF Foundation at WGDSI-2: Advancing Benefit-Sharing
                                Mechanisms For Digital Sequence Information</a>
                        </h3>
                        <div class="news-one__bottom">
                            <a href="Story-update-3.html" class="news-one__btn">Read More</a>
                            <a href="Story-update-3.html" class="news-one__arrow"><span
                                    class="icon-right-arrow"></span></a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-xl-4 col-lg-4 wow fadeInUp" data-wow-delay="200ms">
                <div class="news-one__single">
                    <div class="news-one__img">
                        <img src="assets/images/blog/methane.jpg" alt="Dr Dotse as Special Envoy on Climate Change">
                        <a href="Story-update-2.html">
                            <span class="news-one__plus"></span>
                        </a>
                        <div class="news-one__date">
                            <p>07 Aug 2024</p>
                        </div>
                    </div>
                    <div class="news-one__content">
                        <h3 class="news-one__title">
                            <a href="Story-update-2.html">HATOF Foundation and Partners Launch Campaign Against
                                Methane Emission in Ghana (CAMEG)</a>
                        </h3>
                        <div class="news-one__bottom">
                            <a href="Story-update-2.html" class="news-one__btn">Read More</a>
                            <a href="Story-update-2.html" class="news-one__arrow"><span
                                    class="icon-right-arrow"></span></a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-xl-4 col-lg-4 wow fadeInUp" data-wow-delay="300ms">
                <div class="news-one__single">
                    <div class="news-one__img">
                        <img src="assets/images/blog/parliament.jpg" alt="Dr Dotse as Special Envoy on Climate Change">
                        <a href="Story-update.html">
                            <span class="news-one__plus"></span>
                        </a>
                        <div class="news-one__date">
                            <p>30 Jul 2024</p>
                        </div>
                    </div>
                    <div class="news-one__content">
                        <h3 class="news-one__title">
                            <a href="Story-update.html">Dr. Samuel Dotse pledges HATOF's support to the Ghana
                                Parliamentary Caucus on Climate Change.</a>
                        </h3>
                        <div class="news-one__bottom">
                            <a href="Story-update.html" class="news-one__btn">Read More</a>
                            <a href="Story-update.html" class="news-one__arrow"><span
                                    class="icon-right-arrow"></span></a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-xl-4 col-lg-4 wow fadeInUp" data-wow-delay="100ms">
                <div class="news-one__single">
                    <div class="news-one__img">
                        <img src="assets/images/blog/dr-dotseblog.png" alt="Dr Dotse as Special Envoy on Climate Change">
                        <a href="drdotse.html">
                            <span class="news-one__plus"></span>
                        </a>
                        <div class="news-one__date">
                            <p>09 Feb 2023</p>
                        </div>
                    </div>
                    <div class="news-one__content">
                        <h3 class="news-one__title">
                            <a href="drdotse.html">Dr Dotse as Special Envoy on Climate Change</a>
                        </h3>
                        <div class="news-one__bottom">
                            <a href="drdotse.html" class="news-one__btn">Read More</a>
                            <a href="drdotse.html" class="news-one__arrow"><span
                                    class="icon-right-arrow"></span></a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-xl-4 col-lg-4 wow fadeInUp" data-wow-delay="200ms">
                <div class="news-one__single">
                    <div class="news-one__img">
                        <img src="assets/images/blog/hatof-cop.png" alt="HATOF Foundations holds an official side event on Climate Finance at COP27">
                        <a href="cop27.html">
                            <span class="news-one__plus"></span>
                        </a>
                        <div class="news-one__date">
                            <p>17 Nov 2023</p>
                        </div>
                    </div>
                    <div class="news-one__content">
                        <h3 class="news-one__title">
                            <a href="cop27.html">HATOF Foundations holds an official side event on
                                Climate Finance at COP27</a>
                        </h3>
                        <div class="news-one__bottom">
                            <a href="cop27.html" class="news-one__btn">Read More</a>
                            <a href="cop27.html" class="news-one__arrow"><span
                                    class="icon-right-arrow"></span></a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-xl-4 col-lg-4 wow fadeInUp" data-wow-delay="300ms">
                <div class="news-one__single">
                    <div class="news-one__img">
                        <img src="assets/images/blog/gcf.png" alt="Green Climate Fund">
                        <a href="gcf.html">
                            <span class="news-one__plus"></span>
                        </a>
                        <div class="news-one__date">
                            <p>18 Dec 2021</p>
                        </div>
                    </div>
                    <div class="news-one__content">
                        <h3 class="news-one__title">
                            <a href="gcf.html">GREEN CLIMATE FUND APPROVES USD 442,968 FOR HATOF
                                Foundation's READINESS PROPOSAL</a>
                        </h3>
                        <div class="news-one__bottom">
                            <a href="gcf.html" class="news-one__btn">Read More</a>
                            <a href="gcf.html" class="news-one__arrow"><span
                                    class="icon-right-arrow"></span></a>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  addFallbackPosts(container, wordpressPostCount) {
    // Add fallback content to fill up to desired count
    const fallbackPosts = [
      {
        image: "assets/images/blog/wgdsi.jpg",
        date: "14 Aug 2024",
        title:
          "HATOF Foundation at WGDSI-2: Advancing Benefit-Sharing Mechanisms For Digital Sequence Information",
        link: "Story-update-3.html",
      },
      {
        image: "assets/images/blog/methane.jpg",
        date: "07 Aug 2024",
        title:
          "HATOF Foundation and Partners Launch Campaign Against Methane Emission in Ghana (CAMEG)",
        link: "Story-update-2.html",
      },
      {
        image: "assets/images/blog/parliament.jpg",
        date: "30 Jul 2024",
        title:
          "Dr. Samuel Dotse pledges HATOF's support to the Ghana Parliamentary Caucus on Climate Change.",
        link: "Story-update.html",
      },
      {
        image: "assets/images/blog/dr-dotseblog.png",
        date: "09 Feb 2023",
        title: "Dr Dotse as Special Envoy on Climate Change",
        link: "drdotse.html",
      },
      {
        image: "assets/images/blog/hatof-cop.png",
        date: "17 Nov 2023",
        title:
          "HATOF Foundations holds an official side event on Climate Finance at COP27",
        link: "cop27.html",
      },
      {
        image: "assets/images/blog/gcf.png",
        date: "18 Dec 2021",
        title:
          "GREEN CLIMATE FUND APPROVES USD 442,968 FOR HATOF Foundation's READINESS PROPOSAL",
        link: "gcf.html",
      },
    ];

    // Calculate how many fallback posts we need
    const neededFallbacks = Math.min(
      this.postsPerPage - wordpressPostCount,
      fallbackPosts.length
    );

    // Add the necessary fallback posts
    for (let i = 0; i < neededFallbacks; i++) {
      const fallback = fallbackPosts[i];
      container.innerHTML += `
                <div class="col-xl-4 col-lg-4 wow fadeInUp" data-wow-delay="${
                  (i + 1) * 100
                }ms">
                    <div class="news-one__single">
                        <div class="news-one__img">
                            <img src="${fallback.image}" alt="${
        fallback.title
      }">
                            <a href="${fallback.link}">
                                <span class="news-one__plus"></span>
                            </a>
                            <div class="news-one__date">
                                <p>${fallback.date}</p>
                            </div>
                        </div>
                        <div class="news-one__content">
                            <h3 class="news-one__title">
                                <a href="${fallback.link}">${fallback.title}</a>
                            </h3>
                            <div class="news-one__bottom">
                                <a href="${
                                  fallback.link
                                }" class="news-one__btn">Read More</a>
                                <a href="${
                                  fallback.link
                                }" class="news-one__arrow"><span
                                        class="icon-right-arrow"></span></a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
    }
  }

  async setupPagination() {
    try {
      const { totalPages } = await this.fetchPosts(1);

      if (totalPages <= 1) return;

      // Create pagination container if it doesn't exist
      let paginationContainer = document.querySelector(".post-pagination");
      if (!paginationContainer) {
        paginationContainer = document.createElement("div");
        paginationContainer.className = "post-pagination text-center";

        const newsPageSection = document.querySelector(".news-page");
        if (newsPageSection) {
          newsPageSection.appendChild(paginationContainer);
        } else {
          const container = document.querySelector(this.container);
          container.parentNode.appendChild(paginationContainer);
        }
      }

      // Generate pagination HTML
      let paginationHTML = '<ul class="pagination-box list-unstyled">';

      for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `<li${
          i === 1 ? ' class="active"' : ""
        }><a href="#" data-page="${i}">${i}</a></li>`;
      }

      paginationHTML += "</ul>";
      paginationContainer.innerHTML = paginationHTML;

      // Add event listeners to pagination links
      const links = paginationContainer.querySelectorAll("a");
      links.forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const page = parseInt(e.target.getAttribute("data-page"), 10);
          this.loadPage(page);

          // Update active class
          links.forEach((l) => l.parentNode.classList.remove("active"));
          e.target.parentNode.classList.add("active");
        });
      });
    } catch (error) {
      console.error("Error setting up pagination:", error);
    }
  }

  async loadPage(page) {
    this.currentPage = page;
    await this.renderPosts(page);

    // Scroll to top of the posts section
    const container = document.querySelector(this.container);
    if (container) {
      container.scrollIntoView({ behavior: "smooth" });
    }
  }
}
