/**
 * WordPress Staff Integration
 * Fetches staff members from a "staff" custom post type and renders them
 * grouped by their staff_category taxonomy (Management, National Service, Intern, Volunteer, etc.)
 */
class WordPressStaff {
    constructor(options) {
        this.baseUrl = options.baseUrl || 'https://wp.picturethisproduction.ca/wp-json/wp/v2';
        this.container = document.querySelector(options.container);
        this.debug = options.debug || false;
    }

    async fetchStaff() {
        try {
            // Fetch all staff members with embedded featured image and taxonomy terms
            var url = this.baseUrl + '/staff?_embed&per_page=100&orderby=menu_order&order=asc';
            if (this.debug) console.log('Fetching staff from:', url);

            var response = await fetch(url);
            if (!response.ok) throw new Error('HTTP ' + response.status);

            return await response.json();
        } catch (error) {
            console.error('Error fetching staff:', error);
            return [];
        }
    }

    getCategory(member) {
        // Extract staff_category from embedded taxonomy terms
        if (member._embedded && member._embedded['wp:term']) {
            for (var i = 0; i < member._embedded['wp:term'].length; i++) {
                var terms = member._embedded['wp:term'][i];
                for (var j = 0; j < terms.length; j++) {
                    if (terms[j].taxonomy === 'staff_category') {
                        return terms[j].name;
                    }
                }
            }
        }
        return 'Staff';
    }

    getCategoryOrder(category) {
        var order = {
            'Management Team': 1,
            'Management': 1,
            'National Service Personnel': 2,
            'National Service': 2,
            'Intern': 3,
            'Volunteer': 4
        };
        return order[category] || 99;
    }

    getPhoto(member) {
        if (member._embedded && member._embedded['wp:featuredmedia'] && member._embedded['wp:featuredmedia'][0]) {
            return member._embedded['wp:featuredmedia'][0].source_url;
        }
        return 'assets/images/team/placeholder.jpg';
    }

    createMemberHTML(member) {
        var photo = this.getPhoto(member);
        var name = member.title.rendered;
        var bio = member.content.rendered;

        // Split bio into visible and hidden parts at roughly 500 characters
        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = bio;
        var fullText = tempDiv.textContent.trim();

        var visibleBio = '';
        var hiddenBio = '';

        if (fullText.length > 500) {
            // Find a good split point (end of sentence near 500 chars)
            var splitAt = fullText.indexOf('.', 400);
            if (splitAt === -1 || splitAt > 600) splitAt = 500;
            splitAt += 1;

            visibleBio = '<p class="profile-text">' + fullText.substring(0, splitAt) + '</p>';
            hiddenBio = '<p class="profile-text hidden">' + fullText.substring(splitAt).trim() + '</p>';
        } else {
            visibleBio = '<p class="profile-text">' + fullText + '</p>';
        }

        var html = '<div class="profile-container">';
        html += '  <div class="profile-image">';
        html += '    <img src="' + photo + '" alt="' + name + '">';
        html += '    <h4 class="profile-name">' + name + '</h4>';
        html += '  </div>';
        html += '  <div class="profile-content">';
        html += '    <div class="profile-info">';
        html += visibleBio;
        html += hiddenBio;
        if (hiddenBio) {
            html += '      <button class="show-more-btn thm-btn contact-one__btn">Show More</button>';
        }
        html += '    </div>';
        html += '  </div>';
        html += '</div>';

        return html;
    }

    async render() {
        if (!this.container) {
            console.error('Staff container not found');
            return;
        }

        this.container.innerHTML = '<div class="text-center" style="padding:60px 0;"><p style="color:#fff;font-size:18px;">Loading staff...</p></div>';

        var staff = await this.fetchStaff();

        if (staff.length === 0) {
            this.container.innerHTML = '<div class="text-center" style="padding:60px 0;"><p style="color:#fff;">Unable to load staff. Please try again later.</p></div>';
            return;
        }

        // Group by category
        var groups = {};
        for (var i = 0; i < staff.length; i++) {
            var cat = this.getCategory(staff[i]);
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(staff[i]);
        }

        // Sort groups by predefined order
        var self = this;
        var sortedCategories = Object.keys(groups).sort(function(a, b) {
            return self.getCategoryOrder(a) - self.getCategoryOrder(b);
        });

        // Render
        var html = '';
        for (var c = 0; c < sortedCategories.length; c++) {
            var category = sortedCategories[c];
            var members = groups[category];

            html += '<div class="container">';
            html += '  <div class="row align-items-justify">';
            html += '    <div class="staff_section-title text-center">';
            html += '      <h5 class="staff_section-title__title">' + category + '</h5>';
            html += '    </div>';

            for (var m = 0; m < members.length; m++) {
                html += this.createMemberHTML(members[m]);
            }

            html += '  </div>';
            html += '</div>';
        }

        this.container.innerHTML = html;

        // Re-attach show more/less toggle
        this.initShowMore();
    }

    initShowMore() {
        var containers = document.querySelectorAll('.profile-container');
        containers.forEach(function(container) {
            var btn = container.querySelector('.show-more-btn');
            if (!btn) return;

            var hiddenText = container.querySelectorAll('.profile-text.hidden');
            hiddenText.forEach(function(text) {
                text.style.height = '0';
            });

            btn.addEventListener('click', function() {
                hiddenText.forEach(function(text) {
                    if (text.style.height === '0px' || text.style.height === '') {
                        text.style.height = text.scrollHeight + 'px';
                        text.style.padding = '';
                        text.style.margin = '';
                        btn.textContent = 'Show Less';
                    } else {
                        text.style.height = '0';
                        text.style.padding = '0';
                        text.style.margin = '0';
                        btn.textContent = 'Show More';
                    }
                });
            });
        });
    }
}
