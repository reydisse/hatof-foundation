<?php
/**
 * Plugin Name: HATOF Events
 * Description: Adds WordPress-managed events, homepage slides, and staff for the HATOF Foundation website.
 * Version: 1.4.0
 * Author: HATOF Foundation
 */

if (!defined('ABSPATH')) {
    exit;
}

function hatof_events_register_post_type() {
    register_post_type('event', array(
        'labels' => array(
            'name' => 'Events',
            'singular_name' => 'Event',
            'add_new_item' => 'Add New Event',
            'edit_item' => 'Edit Event',
            'new_item' => 'New Event',
            'view_item' => 'View Event',
            'search_items' => 'Search Events',
            'not_found' => 'No events found',
        ),
        'public' => true,
        'show_in_rest' => true,
        'rest_base' => 'event',
        'menu_icon' => 'dashicons-calendar-alt',
        'supports' => array('title', 'editor', 'excerpt', 'thumbnail', 'custom-fields'),
        'has_archive' => true,
        'rewrite' => array('slug' => 'events'),
    ));
}
add_action('init', 'hatof_events_register_post_type');

function hatof_events_register_meta() {
    $fields = array(
        'event_start' => 'string',
        'event_end' => 'string',
        'event_type' => 'string',
        'event_region' => 'string',
        'event_location' => 'string',
        'event_url' => 'string',
        'event_summary' => 'string',
    );

    foreach ($fields as $key => $type) {
        register_post_meta('event', $key, array(
            'type' => $type,
            'single' => true,
            'show_in_rest' => true,
            'sanitize_callback' => $key === 'event_url' ? 'esc_url_raw' : 'sanitize_text_field',
            'auth_callback' => '__return_true',
        ));
    }
}
add_action('init', 'hatof_events_register_meta');

function hatof_events_add_meta_box() {
    add_meta_box(
        'hatof-event-details',
        'Event Details',
        'hatof_events_render_meta_box',
        'event',
        'normal',
        'high'
    );
}
add_action('add_meta_boxes', 'hatof_events_add_meta_box');

function hatof_events_input_value($post_id, $key) {
    return esc_attr((string) get_post_meta($post_id, $key, true));
}

function hatof_events_datetime_value($post_id, $key) {
    $value = get_post_meta($post_id, $key, true);
    if (!$value) return '';

    try {
        return esc_attr((new DateTimeImmutable($value))->setTimezone(wp_timezone())->format('Y-m-d\TH:i'));
    } catch (Exception $exception) {
        return '';
    }
}

function hatof_events_render_meta_box($post) {
    wp_nonce_field('hatof_events_save_details', 'hatof_events_nonce');
    $type = get_post_meta($post->ID, 'event_type', true);
    $region = get_post_meta($post->ID, 'event_region', true);
    ?>
    <style>
        .hatof-event-fields { display:grid; grid-template-columns:1fr 1fr; gap:18px 24px; }
        .hatof-event-field label { display:block; margin-bottom:6px; font-weight:600; }
        .hatof-event-field input, .hatof-event-field select { width:100%; }
        .hatof-event-field--wide { grid-column:1 / -1; }
        @media (max-width:782px) { .hatof-event-fields { grid-template-columns:1fr; } .hatof-event-field--wide { grid-column:auto; } }
    </style>
    <div class="hatof-event-fields">
        <div class="hatof-event-field hatof-event-field--wide">
            <label for="event_summary">Short description *</label>
            <textarea id="event_summary" name="event_summary" rows="4" required style="width:100%;" placeholder="A short summary shown on the Events listing page."><?php echo esc_textarea((string) get_post_meta($post->ID, 'event_summary', true)); ?></textarea>
            <p class="description">Use the main WordPress editor above for the complete event write-up.</p>
        </div>
        <div class="hatof-event-field">
            <label for="event_start">Start date and time *</label>
            <input id="event_start" name="event_start" type="datetime-local" required value="<?php echo hatof_events_datetime_value($post->ID, 'event_start'); ?>">
        </div>
        <div class="hatof-event-field">
            <label for="event_end">End date and time</label>
            <input id="event_end" name="event_end" type="datetime-local" value="<?php echo hatof_events_datetime_value($post->ID, 'event_end'); ?>">
        </div>
        <div class="hatof-event-field">
            <label for="event_type">Event type *</label>
            <select id="event_type" name="event_type" required>
                <option value="">Select type</option>
                <?php foreach (array('Conference', 'Online Event', 'Summit', 'Webinar', 'Workshop') as $option) : ?>
                    <option value="<?php echo esc_attr($option); ?>" <?php selected($type, $option); ?>><?php echo esc_html($option); ?></option>
                <?php endforeach; ?>
            </select>
        </div>
        <div class="hatof-event-field">
            <label for="event_region">Region *</label>
            <select id="event_region" name="event_region" required>
                <option value="">Select region</option>
                <?php foreach (array('Africa', 'North America', 'Global') as $option) : ?>
                    <option value="<?php echo esc_attr($option); ?>" <?php selected($region, $option); ?>><?php echo esc_html($option); ?></option>
                <?php endforeach; ?>
            </select>
        </div>
        <div class="hatof-event-field hatof-event-field--wide">
            <label for="event_location">Location</label>
            <input id="event_location" name="event_location" type="text" value="<?php echo hatof_events_input_value($post->ID, 'event_location'); ?>" placeholder="Accra, Ghana or Online">
        </div>
        <div class="hatof-event-field hatof-event-field--wide">
            <label for="event_url">Registration or external event URL</label>
            <input id="event_url" name="event_url" type="url" value="<?php echo hatof_events_input_value($post->ID, 'event_url'); ?>" placeholder="https://">
        </div>
    </div>
    <?php
}

function hatof_events_normalize_datetime($value) {
    if (!$value) return '';
    try {
        return (new DateTimeImmutable(sanitize_text_field($value), wp_timezone()))->format(DATE_ATOM);
    } catch (Exception $exception) {
        return '';
    }
}

function hatof_events_save_details($post_id) {
    if (!isset($_POST['hatof_events_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['hatof_events_nonce'])), 'hatof_events_save_details')) return;
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!current_user_can('edit_post', $post_id)) return;

    $text_fields = array('event_type', 'event_region', 'event_location', 'event_summary');
    foreach ($text_fields as $field) {
        $value = isset($_POST[$field]) ? sanitize_text_field(wp_unslash($_POST[$field])) : '';
        update_post_meta($post_id, $field, $value);
    }

    foreach (array('event_start', 'event_end') as $field) {
        $value = isset($_POST[$field]) ? hatof_events_normalize_datetime(wp_unslash($_POST[$field])) : '';
        update_post_meta($post_id, $field, $value);
    }

    $url = isset($_POST['event_url']) ? esc_url_raw(wp_unslash($_POST['event_url'])) : '';
    update_post_meta($post_id, 'event_url', $url);
}
add_action('save_post_event', 'hatof_events_save_details');

function hatof_slides_register_post_type() {
    register_post_type('home_slide', array(
        'labels' => array(
            'name' => 'Homepage Slides',
            'singular_name' => 'Homepage Slide',
            'add_new_item' => 'Add New Homepage Slide',
            'edit_item' => 'Edit Homepage Slide',
            'new_item' => 'New Homepage Slide',
            'search_items' => 'Search Homepage Slides',
            'not_found' => 'No homepage slides found',
        ),
        'public' => false,
        'publicly_queryable' => true,
        'exclude_from_search' => true,
        'show_ui' => true,
        'show_in_rest' => true,
        'rest_base' => 'home_slide',
        'menu_icon' => 'dashicons-images-alt2',
        'supports' => array('title', 'thumbnail', 'page-attributes'),
    ));
}
add_action('init', 'hatof_slides_register_post_type');

function hatof_slides_register_meta() {
    $fields = array('slide_media_type', 'slide_video_url');
    foreach ($fields as $field) {
        register_post_meta('home_slide', $field, array(
            'type' => 'string',
            'single' => true,
            'show_in_rest' => true,
            'sanitize_callback' => $field === 'slide_video_url'
                ? 'esc_url_raw'
                : 'sanitize_text_field',
            'auth_callback' => '__return_true',
        ));
    }
}
add_action('init', 'hatof_slides_register_meta');

function hatof_slides_add_meta_box() {
    add_meta_box('hatof-slide-details', 'Slide Details', 'hatof_slides_render_meta_box', 'home_slide', 'normal', 'high');
}
add_action('add_meta_boxes', 'hatof_slides_add_meta_box');

function hatof_slides_render_meta_box($post) {
    wp_nonce_field('hatof_slides_save_details', 'hatof_slides_nonce');
    $media_type = get_post_meta($post->ID, 'slide_media_type', true) ?: 'image';
    ?>
    <style>
        .hatof-slide-fields { display:grid; grid-template-columns:1fr 1fr; gap:18px 24px; }
        .hatof-slide-field label { display:block; margin-bottom:6px; font-weight:600; }
        .hatof-slide-field input, .hatof-slide-field select, .hatof-slide-field textarea { width:100%; }
        .hatof-slide-field--wide { grid-column:1 / -1; }
        .hatof-media-row { display:flex; gap:8px; }
        @media (max-width:782px) { .hatof-slide-fields { grid-template-columns:1fr; } .hatof-slide-field--wide { grid-column:auto; } }
    </style>
    <div class="hatof-slide-fields">
        <div class="hatof-slide-field">
            <label for="slide_media_type">Background type</label>
            <select id="slide_media_type" name="slide_media_type">
                <option value="image" <?php selected($media_type, 'image'); ?>>Image</option>
                <option value="video" <?php selected($media_type, 'video'); ?>>Video</option>
            </select>
            <p class="description">For an image slide, set the Featured Image.</p>
        </div>
        <div class="hatof-slide-field">
            <label for="slide_video_url">Background video</label>
            <div class="hatof-media-row"><input id="slide_video_url" name="slide_video_url" type="url" value="<?php echo hatof_events_input_value($post->ID, 'slide_video_url'); ?>" placeholder="MP4 URL"><button type="button" class="button hatof-choose-video">Choose Video</button></div>
        </div>
    </div>
    <p><strong>The title is only an internal label.</strong> It does not change any homepage text. Use names such as “Slide 1”.</p>
    <p><strong>Slide position:</strong> use the Order field in Page Attributes. The lowest number replaces the first homepage background, the next replaces the second, and so on.</p>
    <script>
    jQuery(function($) {
        $('.hatof-choose-video').on('click', function(event) {
            event.preventDefault();
            var frame = wp.media({ title:'Choose Background Video', button:{ text:'Use this video' }, library:{ type:'video' }, multiple:false });
            frame.on('select', function() { $('#slide_video_url').val(frame.state().get('selection').first().toJSON().url); });
            frame.open();
        });
    });
    </script>
    <?php
}

function hatof_slides_admin_media($hook) {
    global $post_type;
    if ($post_type === 'home_slide' && in_array($hook, array('post.php', 'post-new.php'), true)) wp_enqueue_media();
}
add_action('admin_enqueue_scripts', 'hatof_slides_admin_media');

function hatof_slides_save_details($post_id) {
    if (!isset($_POST['hatof_slides_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['hatof_slides_nonce'])), 'hatof_slides_save_details')) return;
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!current_user_can('edit_post', $post_id)) return;

    update_post_meta($post_id, 'slide_media_type', isset($_POST['slide_media_type']) ? sanitize_text_field(wp_unslash($_POST['slide_media_type'])) : 'image');
    update_post_meta($post_id, 'slide_video_url', isset($_POST['slide_video_url']) ? esc_url_raw(wp_unslash($_POST['slide_video_url'])) : '');
}
add_action('save_post_home_slide', 'hatof_slides_save_details');

function hatof_staff_register_content_types() {
    register_post_type('staff', array(
        'labels' => array(
            'name' => 'Staff',
            'singular_name' => 'Staff Member',
            'add_new_item' => 'Add New Staff Member',
            'edit_item' => 'Edit Staff Member',
            'search_items' => 'Search Staff',
            'not_found' => 'No staff members found',
        ),
        'public' => false,
        'publicly_queryable' => true,
        'exclude_from_search' => true,
        'show_ui' => true,
        'show_in_rest' => true,
        'rest_base' => 'staff',
        'menu_icon' => 'dashicons-groups',
        'supports' => array('title', 'editor', 'thumbnail', 'page-attributes'),
    ));

    register_taxonomy('staff_category', array('staff'), array(
        'labels' => array(
            'name' => 'Staff Categories',
            'singular_name' => 'Staff Category',
        ),
        'public' => false,
        'show_ui' => true,
        'show_admin_column' => true,
        'show_in_rest' => true,
        'rest_base' => 'staff_category',
        'hierarchical' => true,
    ));
}
add_action('init', 'hatof_staff_register_content_types');

function hatof_staff_import_menu() {
    add_submenu_page(
        'edit.php?post_type=staff',
        'Import Current Staff',
        'Import Current Staff',
        'manage_options',
        'hatof-import-staff',
        'hatof_staff_import_page'
    );
}
add_action('admin_menu', 'hatof_staff_import_menu');

function hatof_staff_clean_text($value) {
    return trim((string) preg_replace('/\s+/u', ' ', $value));
}

function hatof_staff_import_current() {
    $response = wp_remote_get('https://hatof.org/staff.html', array('timeout' => 30));
    if (is_wp_error($response)) return $response;
    if (wp_remote_retrieve_response_code($response) !== 200) {
        return new WP_Error('hatof_staff_source', 'The current staff page could not be downloaded.');
    }

    $document = new DOMDocument();
    $previous = libxml_use_internal_errors(true);
    $loaded = $document->loadHTML(wp_remote_retrieve_body($response));
    libxml_clear_errors();
    libxml_use_internal_errors($previous);
    if (!$loaded) return new WP_Error('hatof_staff_html', 'The current staff page could not be read.');

    $xpath = new DOMXPath($document);
    $profiles = $xpath->query('//*[@id="staff-fallback"]//div[contains(concat(" ", normalize-space(@class), " "), " profile-container ")]');
    if (!$profiles || !$profiles->length) return new WP_Error('hatof_staff_empty', 'No profiles were found on the current staff page.');

    $created = 0;
    $skipped = 0;
    $order = 0;
    foreach ($profiles as $profile) {
        $name_node = $xpath->query('.//*[contains(concat(" ", normalize-space(@class), " "), " profile-name ")]', $profile)->item(0);
        $image_node = $xpath->query('.//img', $profile)->item(0);
        $category_node = $xpath->query('ancestor::div[contains(concat(" ", normalize-space(@class), " "), " container ")][1]//*[contains(concat(" ", normalize-space(@class), " "), " staff_section-title__title ")]', $profile)->item(0);
        $paragraphs = $xpath->query('.//*[contains(concat(" ", normalize-space(@class), " "), " profile-info ")]//p', $profile);
        $name = $name_node ? hatof_staff_clean_text($name_node->textContent) : '';
        if (!$name) continue;

        $key = sanitize_title($name);
        $existing = get_posts(array(
            'post_type' => 'staff',
            'post_status' => 'any',
            'meta_key' => '_hatof_staff_import_key',
            'meta_value' => $key,
            'fields' => 'ids',
            'posts_per_page' => 1,
        ));
        if ($existing) {
            $skipped++;
            continue;
        }

        $bio_parts = array();
        foreach ($paragraphs as $paragraph) {
            $text = hatof_staff_clean_text($paragraph->textContent);
            if ($text) $bio_parts[] = $text;
        }
        $post_id = wp_insert_post(array(
            'post_type' => 'staff',
            'post_status' => 'publish',
            'post_title' => $name,
            'post_content' => implode("\n\n", $bio_parts),
            'menu_order' => $order++,
        ), true);
        if (is_wp_error($post_id)) continue;

        update_post_meta($post_id, '_hatof_staff_import_key', $key);
        $category = $category_node ? hatof_staff_clean_text($category_node->textContent) : 'Staff';
        wp_set_object_terms($post_id, $category, 'staff_category');

        if ($image_node && $image_node->hasAttribute('src')) {
            $src = ltrim($image_node->getAttribute('src'), '/');
            $image_url = 'https://hatof.org/' . $src;
            require_once ABSPATH . 'wp-admin/includes/media.php';
            require_once ABSPATH . 'wp-admin/includes/file.php';
            require_once ABSPATH . 'wp-admin/includes/image.php';
            $attachment_id = media_sideload_image($image_url, $post_id, $name, 'id');
            if (!is_wp_error($attachment_id)) set_post_thumbnail($post_id, $attachment_id);
        }
        $created++;
    }

    return array('created' => $created, 'skipped' => $skipped);
}

function hatof_staff_import_page() {
    if (!current_user_can('manage_options')) return;
    $result = null;
    if (isset($_POST['hatof_staff_import'])) {
        check_admin_referer('hatof_staff_import_current');
        $result = hatof_staff_import_current();
    }
    ?>
    <div class="wrap">
        <h1>Import Current Staff</h1>
        <p>This imports the profiles and photographs currently displayed on hatof.org into WordPress. Existing imports are skipped, so the button is safe to run again.</p>
        <?php if (is_wp_error($result)) : ?>
            <div class="notice notice-error"><p><?php echo esc_html($result->get_error_message()); ?></p></div>
        <?php elseif (is_array($result)) : ?>
            <div class="notice notice-success"><p><?php echo esc_html(sprintf('Import complete: %d added, %d already present.', $result['created'], $result['skipped'])); ?></p></div>
        <?php endif; ?>
        <form method="post">
            <?php wp_nonce_field('hatof_staff_import_current'); ?>
            <input type="hidden" name="hatof_staff_import" value="1">
            <?php submit_button('Import Current Staff'); ?>
        </form>
    </div>
    <?php
}

function hatof_events_activate() {
    hatof_events_register_post_type();
    hatof_slides_register_post_type();
    hatof_staff_register_content_types();
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'hatof_events_activate');

function hatof_events_deactivate() {
    flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, 'hatof_events_deactivate');
