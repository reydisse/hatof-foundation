/**
 * SUPER SAIYAN WordPress Integration v4.0
 * Clean URLs are HARDCODED - no options needed
 */
class WordPressIntegration {
    constructor(options) {
        this.baseUrl = options.baseUrl || 'https://wp.picturethisproduction.ca/wp-json/wp/v2';
        this.postsPerPage = options.postsPerPage || 9;
        this.categories = options.categories || '';
        this.container = document.querySelector(options.container);
        this.debug = options.debug || false;
        this.currentPage = 1;
        this.totalPages = 1;
        this.totalPosts = 0;

        console.log('🔥 SUPER SAIYAN MODE ACTIVATED 🔥');
        console.log('Clean URLs: ALWAYS ON');
    }

    getPostUrl(post) {
        // HARDCODED CLEAN URL - NO OPTIONS, NO EXCUSES
        var url = '/news/' + post.slug + '/';
        console.log('URL Generated:', url);
        return url;
    }

    async fetchPosts(page) {
        if (!page) page = 1;
        try {
            var url = this.baseUrl + '/posts?_embed&per_page=' + this.postsPerPage + '&page=' + page;
            if (this.categories) {
                url = url + '&categories=' + this.categories;
            }
            if (this.debug) console.log('Fetching:', url);

            var response = await fetch(url);
            if (!response.ok) throw new Error('HTTP ' + response.status);

            this.totalPages = parseInt(response.headers.get('X-WP-TotalPages')) || 1;
            this.totalPosts = parseInt(response.headers.get('X-WP-Total')) || 0;

            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            return [];
        }
    }

    createPostCard(post) {
        var featuredImage = '/assets/images/blog/news-1-1.jpg';
        if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) {
            featuredImage = post._embedded['wp:featuredmedia'][0].source_url;
        }

        var authorName = 'HATOF Foundation';
        if (post._embedded && post._embedded.author && post._embedded.author[0]) {
            authorName = post._embedded.author[0].name;
        }

        var date = new Date(post.date);
        var day = date.getDate();
        var month = date.toLocaleDateString('en-US', { month: 'short' });

        var excerpt = '';
        if (post.excerpt && post.excerpt.rendered) {
            excerpt = post.excerpt.rendered.replace(/<[^>]*>/g, '').trim();
            if (excerpt.length > 150) excerpt = excerpt.substring(0, 150) + '...';
        }

        // 🔥 CLEAN URL - HARDCODED 🔥
        var postUrl = this.getPostUrl(post);

        var html = '<div class="col-xl-4 col-lg-6 col-md-6 wow fadeInUp" data-wow-delay="100ms">';
        html += '<div class="news-one__single">';
        html += '<div class="news-one__img">';
        html += '<img src="' + featuredImage + '" alt="' + post.title.rendered + '">';
        html += '<a href="' + postUrl + '"><span class="news-one__plus"></span></a>';
        html += '<div class="news-one__date"><p>' + day + ' <span>' + month + '</span></p></div>';
        html += '</div>';
        html += '<div class="news-one__content">';
        html += '<ul class="list-unstyled news-one__meta">';
        html += '<li><a href="' + postUrl + '"><i class="far fa-user-circle"></i> ' + authorName + '</a></li>';
        html += '</ul>';
        html += '<h3 class="news-one__title"><a href="' + postUrl + '">' + post.title.rendered + '</a></h3>';
        html += '<p class="news-one__text">' + excerpt + '</p>';
        html += '<div class="news-one__read-more"><a href="' + postUrl + '">Read More <span class="icon-right-arrow"></span></a></div>';
        html += '</div></div></div>';

        return html;
    }

    async renderPosts(page) {
        if (!page) page = 1;
        if (!this.container) {
            console.error('Container not found!');
            return;
        }

        this.currentPage = page;
        this.container.innerHTML = '<div class="col-12 text-center py-5"><p>Loading...</p></div>';

        var posts = await this.fetchPosts(page);

        if (posts.length === 0) {
            this.container.innerHTML = '<div class="col-12 text-center py-5"><h3>No Articles Found</h3></div>';
            return;
        }

        var html = '';
        for (var i = 0; i < posts.length; i++) {
            html += this.createPostCard(posts[i]);
        }
        this.container.innerHTML = html;

        if (typeof WOW !== 'undefined') new WOW().init();
    }

    createPagination() {
        if (this.totalPages <= 1) return '';
        var html = '<div class="col-12"><div class="news-page__pagination"><ul class="pg-pagination list-unstyled">';
        
        if (this.currentPage > 1) {
            html += '<li class="prev"><a href="#" data-page="' + (this.currentPage - 1) + '"><i class="fa fa-angle-left"></i></a></li>';
        }
        
        for (var i = 1; i <= this.totalPages; i++) {
            var cls = (i === this.currentPage) ? 'active' : '';
            html += '<li class="' + cls + '"><a href="#" data-page="' + i + '">' + i + '</a></li>';
        }
        
        if (this.currentPage < this.totalPages) {
            html += '<li class="next"><a href="#" data-page="' + (this.currentPage + 1) + '"><i class="fa fa-angle-right"></i></a></li>';
        }
        
        html += '</ul></div></div>';
        return html;
    }

    setupPagination() {
        var existing = document.querySelector('.news-page__pagination');
        if (existing && existing.closest('.col-12')) {
            existing.closest('.col-12').remove();
        }

        var paginationHtml = this.createPagination();
        if (paginationHtml && this.container) {
            this.container.insertAdjacentHTML('beforeend', paginationHtml);
            var self = this;
            var links = this.container.querySelectorAll('.pg-pagination a[data-page]');
            for (var i = 0; i < links.length; i++) {
                links[i].addEventListener('click', function(e) {
                    e.preventDefault();
                    var pg = parseInt(this.getAttribute('data-page'));
                    var sec = document.querySelector('.news-page');
                    if (sec) sec.scrollIntoView({ behavior: 'smooth' });
                    self.renderPosts(pg).then(function() { self.setupPagination(); });
                });
            }
        }
    }
}
