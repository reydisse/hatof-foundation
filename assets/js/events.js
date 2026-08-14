class HatofEvents {
    constructor(options) {
        this.dataUrl = options.dataUrl || '/assets/data/events.json';
        this.wordpressUrl = options.wordpressUrl || 'https://wp.picturethisproduction.ca/wp-json/wp/v2/event';
        this.results = document.querySelector('#events-results');
        this.summary = document.querySelector('#events-summary');
        this.emptyState = document.querySelector('#events-empty');
        this.searchInput = document.querySelector('#events-search');
        this.sortSelect = document.querySelector('#events-sort');
        this.pastButton = document.querySelector('#events-past-toggle');
        this.clearButton = document.querySelector('#events-clear');
        this.filters = document.querySelectorAll('[data-event-filter]');
        this.allEvents = [];
        this.showPast = false;
        this.page = 1;
        this.perPage = 6;
        this.bindEvents();
    }

    bindEvents() {
        var self = this;
        if (this.searchInput) this.searchInput.addEventListener('input', function () { self.page = 1; self.render(); });
        if (this.sortSelect) this.sortSelect.addEventListener('change', function () { self.render(); });
        if (this.pastButton) this.pastButton.addEventListener('click', function () {
            self.showPast = !self.showPast;
            self.page = 1;
            self.pastButton.classList.toggle('is-active', self.showPast);
            self.pastButton.innerHTML = self.showPast
                ? '<i class="far fa-calendar-alt"></i> View Upcoming Events'
                : '<i class="fas fa-history"></i> Revisit Past Events';
            self.render();
        });
        this.filters.forEach(function (filter) {
            filter.addEventListener('change', function () { self.page = 1; self.render(); });
        });
        if (this.clearButton) this.clearButton.addEventListener('click', function () {
            self.filters.forEach(function (filter) { filter.checked = false; });
            self.searchInput.value = '';
            self.sortSelect.value = 'date-asc';
            self.page = 1;
            self.render();
        });
    }

    async load() {
        try {
            this.allEvents = await this.loadWordPressEvents();
            this.render();
        } catch (error) {
            console.warn('WordPress events unavailable; using local events data.', error);
            try {
                var response = await fetch(this.dataUrl, { cache: 'no-store' });
                if (!response.ok) throw new Error('Unable to load local events');
                this.allEvents = await response.json();
            } catch (fallbackError) {
                console.error('Events error:', fallbackError);
                this.allEvents = [];
            }
            this.render();
        }
    }

    async loadWordPressEvents() {
        var response = await fetch(this.wordpressUrl + '?_embed&per_page=100');
        if (!response.ok) throw new Error('WordPress Events endpoint returned HTTP ' + response.status);
        var posts = await response.json();
        var self = this;

        return posts.map(function (post) {
            var meta = post.meta || {};
            var media = post._embedded && post._embedded['wp:featuredmedia'];
            var summaryHtml = post.excerpt && post.excerpt.rendered
                ? post.excerpt.rendered
                : (post.content && post.content.rendered ? post.content.rendered : '');
            return {
                id: post.id,
                slug: post.slug,
                title: self.plainText(post.title && post.title.rendered),
                startDate: meta.event_start,
                endDate: meta.event_end,
                eventType: meta.event_type,
                region: meta.event_region,
                location: meta.event_location,
                summary: meta.event_summary || self.plainText(summaryHtml),
                image: media && media[0] ? media[0].source_url : '',
                registrationUrl: meta.event_url || '',
                url: self.eventDetailUrl(post)
            };
        });
    }

    eventDetailUrl(event) {
        if (event.slug && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            return '/events/' + encodeURIComponent(event.slug) + '/';
        }

        var identifier = event.slug
            ? 'slug=' + encodeURIComponent(event.slug)
            : 'id=' + encodeURIComponent(event.id);
        return '/event-details.html?' + identifier;
    }

    plainText(html) {
        var element = document.createElement('div');
        element.innerHTML = html || '';
        return element.textContent.trim();
    }

    selectedValues(name) {
        return Array.from(document.querySelectorAll('[data-event-filter="' + name + '"]:checked'))
            .map(function (filter) { return filter.value; });
    }

    filteredEvents() {
        var now = new Date();
        var query = (this.searchInput.value || '').trim().toLowerCase();
        var types = this.selectedValues('type');
        var regions = this.selectedValues('region');
        var showPast = this.showPast;

        var events = this.allEvents.filter(function (event) {
            if (!event || !event.title || !event.startDate) return false;
            var eventDate = new Date(event.endDate || event.startDate);
            var isPast = eventDate < now;
            var text = [event.title, event.summary, event.location, event.eventType, event.region].join(' ').toLowerCase();
            return isPast === showPast &&
                (!query || text.includes(query)) &&
                (!types.length || types.includes(event.eventType)) &&
                (!regions.length || regions.includes(event.region));
        });

        var sort = this.sortSelect.value;
        events.sort(function (a, b) {
            var difference = new Date(a.startDate) - new Date(b.startDate);
            if (sort === 'date-desc') return -difference;
            if (sort === 'title') return a.title.localeCompare(b.title);
            return difference;
        });
        return events;
    }

    escape(value) {
        var element = document.createElement('div');
        element.textContent = value || '';
        return element.innerHTML;
    }

    eventUrl(event) { return event.url || this.eventDetailUrl(event); }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-GH', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    }

    renderCard(event) {
        var image = event.image || '/assets/images/resources/work-together-img-1.jpg';
        return '<article class="event-card">' +
            '<a class="event-card__image" href="' + this.escape(this.eventUrl(event)) + '">' +
                '<img src="' + this.escape(image) + '" alt="' + this.escape(event.title) + '" loading="lazy">' +
            '</a>' +
            '<div class="event-card__body">' +
                '<div class="event-card__meta">' +
                    '<span><i class="far fa-calendar-alt"></i>' + this.formatDate(event.startDate) + '</span>' +
                    '<span><i class="far fa-bookmark"></i>' + this.escape(event.eventType || 'Event') + '</span>' +
                    '<span><i class="fas fa-globe-africa"></i>' + this.escape(event.region || 'Global') + '</span>' +
                '</div>' +
                '<h2><a href="' + this.escape(this.eventUrl(event)) + '">' + this.escape(event.title) + '</a></h2>' +
                '<p>' + this.escape(event.summary || '') + '</p>' +
                '<div class="event-card__footer">' +
                    '<span><i class="fas fa-map-marker-alt"></i>' + this.escape(event.location || 'Location to be announced') + '</span>' +
                    '<a href="' + this.escape(this.eventUrl(event)) + '">View Event Details <i class="fas fa-arrow-right"></i></a>' +
                '</div>' +
            '</div>' +
        '</article>';
    }

    renderPagination(total) {
        var pages = Math.ceil(total / this.perPage);
        if (pages <= 1) return '';
        var html = '<nav class="events-pagination" aria-label="Events pages">';
        for (var i = 1; i <= pages; i++) {
            html += '<button type="button" data-events-page="' + i + '" class="' + (i === this.page ? 'is-current' : '') + '">' + i + '</button>';
        }
        return html + '</nav>';
    }

    render() {
        var self = this;
        var events = this.filteredEvents();
        var noun = events.length === 1 ? 'event' : 'events';
        this.summary.textContent = events.length + ' ' + (this.showPast ? 'past ' : 'upcoming ') + noun + ' found';
        document.querySelector('#events-heading').textContent = this.showPast ? 'Past Events' : 'Current and Upcoming Events';

        if (!events.length) {
            this.results.innerHTML = '';
            this.emptyState.hidden = false;
            return;
        }

        this.emptyState.hidden = true;
        var start = (this.page - 1) * this.perPage;
        this.results.innerHTML = events.slice(start, start + this.perPage).map(function (event) {
            return self.renderCard(event);
        }).join('') + this.renderPagination(events.length);

        this.results.querySelectorAll('[data-events-page]').forEach(function (button) {
            button.addEventListener('click', function () {
                self.page = Number(button.dataset.eventsPage);
                self.render();
                document.querySelector('.events-catalogue').scrollIntoView({ behavior: 'smooth' });
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', function () { new HatofEvents({}).load(); });
