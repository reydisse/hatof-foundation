class HomepageSlides {
    constructor(options) {
        this.baseUrl = options.baseUrl || 'https://wp.picturethisproduction.ca/wp-json/wp/v2/home_slide';
        this.slider = document.querySelector('.homepage-swiper');
        this.wrapper = this.slider ? this.slider.querySelector('.swiper-wrapper') : null;
    }

    async fetchSlides() {
        var controller = new AbortController();
        var timeout = setTimeout(function () { controller.abort(); }, 6000);
        var response;
        try {
            response = await fetch(this.baseUrl + '?_embed&per_page=20&orderby=menu_order&order=asc', { signal: controller.signal });
        } finally {
            clearTimeout(timeout);
        }
        if (!response.ok) throw new Error('Homepage slides endpoint returned HTTP ' + response.status);
        return await response.json();
    }

    applyMedia(slide, index) {
        var existingSlide = this.wrapper.children[index];
        if (!existingSlide) return;

        var meta = slide.meta || {};
        var media = slide._embedded && slide._embedded['wp:featuredmedia'];
        var image = media && media[0] ? media[0].source_url : '';
        var isVideo = meta.slide_media_type === 'video' && meta.slide_video_url;
        var background = existingSlide.querySelector('.image-layer');
        var oldVideo = existingSlide.querySelector('.homepage-slide-video');

        if (image && background) background.style.backgroundImage = 'url("' + image.replace(/"/g, '%22') + '")';
        if (oldVideo) oldVideo.remove();

        if (isVideo) {
            var video = document.createElement('video');
            video.className = 'homepage-slide-video';
            video.autoplay = true;
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            if (image) video.poster = image;

            var source = document.createElement('source');
            source.src = meta.slide_video_url;
            source.type = 'video/mp4';
            video.appendChild(source);
            existingSlide.insertBefore(video, existingSlide.firstChild ? existingSlide.firstChild.nextSibling : null);
        }
    }

    initSwiper() {
        if (!this.slider || typeof Swiper === 'undefined') return;
        new Swiper(this.slider, JSON.parse(this.slider.dataset.swiperOptions));
    }

    async render() {
        if (!this.wrapper) return;
        try {
            var slides = await this.fetchSlides();
            slides.forEach(this.applyMedia.bind(this));
        } catch (error) {
            console.warn('Using built-in homepage slides.', error);
        }
        this.initSwiper();
    }
}

document.addEventListener('DOMContentLoaded', function () { new HomepageSlides({}).render(); });
