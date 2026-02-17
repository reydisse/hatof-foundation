/**
 * SUPER SAIYAN WordPress Post Detail v4.0
 * Clean URLs HARDCODED
 */
class WordPressPostDetail {
    constructor(options) {
        this.baseUrl = options.baseUrl || 'https://wp.picturethisproduction.ca/wp-json/wp/v2';
        this.postContainer = document.querySelector(options.postContainer);
        this.relatedPostsContainer = document.querySelector(options.relatedPostsContainer);
        this.titleContainer = document.querySelector(options.titleContainer);
        this.categoryId = options.categoryId || null;
        this.debug = options.debug || false;

        console.log('🔥 SUPER SAIYAN POST DETAIL v4.0 🔥');
        console.log('URL:', window.location.href);
        console.log('Path:', window.location.pathname);
    }

    getPostIdentifier() {
        var path = window.location.pathname;
        var search = window.location.search;

        console.log('Parsing path:', path);

        // Try clean URL: /news/slug/ or /news/slug
        var match = path.match(/\/news\/([a-zA-Z0-9-_]+)\/?$/);
        if (match && match[1]) {
            console.log('Found SLUG from clean URL:', match[1]);
            return { type: 'slug', value: match[1] };
        }

        // Try query params
        var params = new URLSearchParams(search);
        
        var slug = params.get('slug');
        if (slug) {
            console.log('Found SLUG from query:', slug);
            return { type: 'slug', value: slug };
        }

        var id = params.get('id');
        if (id) {
            console.log('Found ID from query:', id);
            return { type: 'id', value: id };
        }

        console.log('NO IDENTIFIER FOUND!');
        return null;
    }

    getPostUrl(post) {
        return '/news/' + post.slug + '/';
    }

    async loadPost() {
        var identifier = this.getPostIdentifier();

        if (!identifier) {
            this.showError('No post specified');
            return;
        }

        try {
            var post;
            var url;

            if (identifier.type === 'id') {
                url = this.baseUrl + '/posts/' + identifier.value + '?_embed';
                console.log('Fetching by ID:', url);
                var resp = await fetch(url);
                if (!resp.ok) throw new Error('Not found');
                post = await resp.json();
            } else {
                url = this.baseUrl + '/posts?slug=' + identifier.value + '&_embed';
                console.log('Fetching by slug:', url);
                var resp = await fetch(url);
                if (!resp.ok) throw new Error('Not found');
                var posts = await resp.json();
                if (!posts || posts.length === 0) throw new Error('Post not found');
                post = posts[0];
            }

            console.log('Post loaded:', post.title.rendered);

            this.renderPost(post);
            this.loadRelatedPosts(post.id);

            // Update URL to clean format
            var cleanUrl = '/news/' + post.slug + '/';
            if (window.location.pathname !== cleanUrl) {
                window.history.replaceState({}, '', cleanUrl);
                console.log('URL updated to:', cleanUrl);
            }

            document.title = post.title.rendered + ' | HATOF Foundation';

            // Update Open Graph meta tags for social sharing
            var ogTitle = post.title.rendered + ' — HATOF Foundation';
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = post.excerpt ? post.excerpt.rendered : post.content.rendered;
            var ogDesc = tempDiv.textContent.trim().substring(0, 200);
            var ogImage = (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0])
                ? post._embedded['wp:featuredmedia'][0].source_url
                : 'https://hatof.org/assets/images/logo-light-hatof.png';

            var metaUpdates = {
                'og-title': ogTitle, 'og-description': ogDesc, 'og-image': ogImage,
                'og-url': window.location.href,
                'tw-title': ogTitle, 'tw-description': ogDesc, 'tw-image': ogImage
            };
            for (var key in metaUpdates) {
                var el = document.getElementById(key);
                if (el) el.setAttribute('content', metaUpdates[key]);
            }

        } catch (error) {
            console.error('Error:', error);
            this.showError('Failed to load post');
        }
    }

    renderPost(post) {
        var featuredImage = '';
        if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) {
            featuredImage = post._embedded['wp:featuredmedia'][0].source_url;
        }

        var authorName = 'HATOF Foundation';
        if (post._embedded && post._embedded.author && post._embedded.author[0] && post._embedded.author[0].name) {
            authorName = post._embedded.author[0].name;
        }

        var date = new Date(post.date);
        var dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        var html = '';
        if (featuredImage) {
            html += '<div class="news-details__img"><img src="' + featuredImage + '" alt=""></div>';
        }
        html += '<div class="news-details__content">';
        html += '<ul class="list-unstyled news-details__meta">';
        html += '<li><a href="#"><i class="far fa-user-circle"></i> ' + authorName + '</a></li>';
        html += '<li><a href="#"><i class="far fa-calendar"></i> ' + dateStr + '</a></li>';
        html += '</ul>';
        html += '<h3 class="news-details__title">' + post.title.rendered + '</h3>';
        html += '<div class="news-details__text">' + post.content.rendered + '</div>';
        html += '</div>';

        this.postContainer.innerHTML = html;

        if (this.titleContainer) {
            this.titleContainer.textContent = post.title.rendered.replace(/<[^>]*>/g, '');
        }
    }

    async loadRelatedPosts(excludeId) {
        try {
            var url = this.baseUrl + '/posts?_embed&per_page=5&exclude=' + excludeId;
            if (this.categoryId) url += '&categories=' + this.categoryId;

            var resp = await fetch(url);
            var posts = await resp.json();

            var html = '';
            for (var i = 0; i < posts.length; i++) {
                var p = posts[i];
                var thumb = '/assets/images/blog/lp-1-1.jpg';
                if (p._embedded && p._embedded['wp:featuredmedia'] && p._embedded['wp:featuredmedia'][0]) {
                    if (p._embedded['wp:featuredmedia'][0].media_details && p._embedded['wp:featuredmedia'][0].media_details.sizes && p._embedded['wp:featuredmedia'][0].media_details.sizes.thumbnail) {
                        thumb = p._embedded['wp:featuredmedia'][0].media_details.sizes.thumbnail.source_url;
                    } else {
                        thumb = p._embedded['wp:featuredmedia'][0].source_url;
                    }
                }
                var d = new Date(p.date);
                var ds = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                
                // 🔥 CLEAN URL 🔥
                var pUrl = '/news/' + p.slug + '/';

                html += '<li>';
                html += '<div class="sidebar__post-image"><img src="' + thumb + '" alt=""></div>';
                html += '<div class="sidebar__post-content">';
                html += '<h3><a href="' + pUrl + '">' + p.title.rendered + '</a></h3>';
                html += '<span class="sidebar__post-date">' + ds + '</span>';
                html += '</div></li>';
            }

            if (this.relatedPostsContainer) {
                this.relatedPostsContainer.innerHTML = html;
            }
        } catch (error) {
            console.error('Related posts error:', error);
        }
    }

    showError(message) {
        if (this.postContainer) {
            this.postContainer.innerHTML = '<div class="text-center py-5"><h3>Error</h3><p>' + message + '</p><a href="/news.html" class="thm-btn">Back to News</a></div>';
        }
    }
}
