class ThemeLatestStories {
    constructor(options) {
        this.baseUrl = options.baseUrl || 'https://wp.picturethisproduction.ca/wp-json/wp/v2';
        this.themeSlug = options.themeSlug;
        this.slots = document.querySelectorAll(options.slots || '.theme-story-slot');
    }

    getPostUrl(post) {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return '/post-details.html?slug=' + encodeURIComponent(post.slug);
        }

        return '/news/' + post.slug + '/';
    }

    getFeaturedImage(post) {
        var media = post._embedded && post._embedded['wp:featuredmedia'];
        return media && media[0] ? media[0].source_url : '';
    }

    getPlainText(html) {
        var element = document.createElement('div');
        element.innerHTML = html || '';
        return element.textContent.trim();
    }

    async fetchStories() {
        var tagResponse = await fetch(this.baseUrl + '/tags?slug=' + encodeURIComponent(this.themeSlug));
        if (!tagResponse.ok) throw new Error('Unable to load theme');

        var tags = await tagResponse.json();
        if (!tags.length) return [];

        var postsUrl = this.baseUrl + '/posts?_embed&per_page=2&categories=1&tags=' + tags[0].id;
        var postsResponse = await fetch(postsUrl);
        if (!postsResponse.ok) throw new Error('Unable to load theme stories');

        return await postsResponse.json();
    }

    renderStory(slot, post) {
        var imageUrl = this.getFeaturedImage(post);
        if (!imageUrl) return;

        var title = this.getPlainText(post.title && post.title.rendered);
        var link = document.createElement('a');
        link.className = 'theme-story-link';
        link.href = this.getPostUrl(post);
        link.setAttribute('aria-label', 'Read ' + title);

        var image = document.createElement('img');
        image.src = imageUrl;
        image.alt = title;
        image.loading = 'lazy';

        var caption = document.createElement('span');
        caption.className = 'theme-story-caption';
        caption.textContent = title;

        link.appendChild(image);
        link.appendChild(caption);
        slot.replaceChildren(link);
    }

    async render() {
        if (!this.themeSlug || !this.slots.length) return;

        try {
            var stories = await this.fetchStories();
            for (var i = 0; i < stories.length && i < this.slots.length; i++) {
                this.renderStory(this.slots[i], stories[i]);
            }
        } catch (error) {
            console.error('Theme stories error:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    var themeSlug = document.body.dataset.newsTheme;
    if (!themeSlug) return;

    new ThemeLatestStories({ themeSlug: themeSlug }).render();
});
