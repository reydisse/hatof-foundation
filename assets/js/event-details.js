class HatofEventDetails {
    constructor(options) {
        this.baseUrl = options.baseUrl || 'https://wp.picturethisproduction.ca/wp-json/wp/v2/event';
        this.container = document.querySelector('#event-detail');
    }

    identifier() {
        var params = new URLSearchParams(window.location.search);
        if (params.get('slug')) return { type: 'slug', value: params.get('slug') };
        if (params.get('id')) return { type: 'id', value: params.get('id') };
        var match = window.location.pathname.match(/\/events\/([a-zA-Z0-9-_]+)\/?$/);
        return match ? { type: 'slug', value: match[1] } : null;
    }

    async load() {
        var identifier = this.identifier();
        if (!identifier) return this.showError('No event was specified.');

        try {
            var url = identifier.type === 'id'
                ? this.baseUrl + '/' + encodeURIComponent(identifier.value) + '?_embed'
                : this.baseUrl + '?slug=' + encodeURIComponent(identifier.value) + '&_embed';
            var response = await fetch(url);
            if (!response.ok) throw new Error('Event not found');
            var data = await response.json();
            var event = Array.isArray(data) ? data[0] : data;
            if (!event) throw new Error('Event not found');
            this.render(event);
        } catch (error) {
            console.error('Event detail error:', error);
            this.showError('This event could not be loaded.');
        }
    }

    plainText(html) {
        var element = document.createElement('div');
        element.innerHTML = html || '';
        return element.textContent.trim();
    }

    escape(value) {
        var element = document.createElement('div');
        element.textContent = value || '';
        return element.innerHTML;
    }

    formatDate(value) {
        if (!value) return 'To be announced';
        return new Date(value).toLocaleString('en-GH', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
        });
    }

    render(event) {
        var meta = event.meta || {};
        var media = event._embedded && event._embedded['wp:featuredmedia'];
        var image = media && media[0] ? media[0].source_url : '';
        var title = this.plainText(event.title && event.title.rendered);
        var closingDate = meta.event_end || meta.event_start;
        var hasEnded = closingDate && new Date(closingDate) < new Date();
        var registration = '';
        if (hasEnded) {
            registration = '<span class="thm-btn event-detail__register event-detail__register--closed" aria-disabled="true">Registration Closed</span>';
        } else if (meta.event_url) {
            registration = '<a class="thm-btn event-detail__register" href="' + this.escape(meta.event_url) + '" target="_blank" rel="noopener noreferrer">Register for this Event</a>';
        }

        this.container.innerHTML =
            '<article class="event-detail">' +
                (image ? '<div class="event-detail__hero"><img src="' + this.escape(image) + '" alt="' + this.escape(title) + '"></div>' : '') +
                '<div class="event-detail__layout">' +
                    '<div class="event-detail__main"><a class="event-detail__back" href="/events.html"><i class="fas fa-arrow-left"></i> All Events</a>' +
                    '<h1>' + this.escape(title) + '</h1>' +
                    '<div class="event-detail__content">' + (event.content ? event.content.rendered : '') + '</div></div>' +
                    '<aside class="event-detail__sidebar"><h2>Event Information</h2>' +
                        '<dl><div><dt><i class="far fa-calendar-alt"></i> Starts</dt><dd>' + this.formatDate(meta.event_start) + '</dd></div>' +
                        (meta.event_end ? '<div><dt><i class="far fa-calendar-check"></i> Ends</dt><dd>' + this.formatDate(meta.event_end) + '</dd></div>' : '') +
                        '<div><dt><i class="far fa-bookmark"></i> Event Type</dt><dd>' + this.escape(meta.event_type || 'Event') + '</dd></div>' +
                        '<div><dt><i class="fas fa-globe-africa"></i> Region</dt><dd>' + this.escape(meta.event_region || 'Global') + '</dd></div>' +
                        '<div><dt><i class="fas fa-map-marker-alt"></i> Location</dt><dd>' + this.escape(meta.event_location || 'To be announced') + '</dd></div></dl>' +
                        registration +
                    '</aside>' +
                '</div>' +
            '</article>';

        document.title = title + ' || HATOF Foundation';
    }

    showError(message) {
        this.container.innerHTML = '<div class="event-detail-error"><i class="far fa-calendar-times"></i><h1>Event unavailable</h1><p>' + this.escape(message) + '</p><a class="thm-btn" href="/events.html">Back to Events</a></div>';
    }
}

document.addEventListener('DOMContentLoaded', function () { new HatofEventDetails({}).load(); });
