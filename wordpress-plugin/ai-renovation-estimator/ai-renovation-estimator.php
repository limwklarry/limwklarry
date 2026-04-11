<?php
/**
 * Plugin Name: AI Renovation Estimator
 * Plugin URI:  https://github.com/limwklarry/limwklarry
 * Description: Interactive AI-powered renovation cost estimator for lead generation. Use shortcode [renovation_estimator] on any page or post.
 * Version:     1.0.0
 * Author:      limwklarry
 * License:     GPL v2 or later
 * Text Domain: ai-renovation-estimator
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

define('AIRE_PLUGIN_VERSION', '1.0.0');
define('AIRE_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('AIRE_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Register CSS and JS assets (only loads when shortcode is used)
 */
function aire_register_assets() {
    wp_register_style(
        'aire-styles',
        AIRE_PLUGIN_URL . 'assets/styles.css',
        array(),
        AIRE_PLUGIN_VERSION
    );

    wp_register_script(
        'aire-app',
        AIRE_PLUGIN_URL . 'assets/app.js',
        array(),
        AIRE_PLUGIN_VERSION,
        true
    );

    // Pass data to JS (AJAX URL, nonce, etc.)
    wp_localize_script('aire-app', 'aireConfig', array(
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce'   => wp_create_nonce('aire_submit_lead'),
    ));
}
add_action('wp_enqueue_scripts', 'aire_register_assets');

/**
 * Shortcode: [renovation_estimator]
 */
function aire_shortcode_handler($atts) {
    // Enqueue the assets only when shortcode is rendered
    wp_enqueue_style('aire-styles');
    wp_enqueue_script('aire-app');

    ob_start();
    include AIRE_PLUGIN_DIR . 'templates/estimator.php';
    return ob_get_clean();
}
add_shortcode('renovation_estimator', 'aire_shortcode_handler');

/**
 * AJAX handler to capture lead submissions
 * Saves submissions as a custom post type "aire_lead"
 */
function aire_handle_lead_submission() {
    check_ajax_referer('aire_submit_lead', 'nonce');

    $name      = sanitize_text_field($_POST['name'] ?? '');
    $email     = sanitize_email($_POST['email'] ?? '');
    $whatsapp  = sanitize_text_field($_POST['whatsapp'] ?? '');
    $property  = sanitize_text_field($_POST['property'] ?? '');
    $scopes    = isset($_POST['scopes']) ? array_map('sanitize_text_field', (array) $_POST['scopes']) : array();
    $styles    = isset($_POST['styles']) ? array_map('sanitize_text_field', (array) $_POST['styles']) : array();
    $total     = intval($_POST['total'] ?? 0);

    if (empty($name) || empty($email) || empty($whatsapp)) {
        wp_send_json_error(array('message' => 'Missing required fields.'));
    }

    $post_id = wp_insert_post(array(
        'post_type'   => 'aire_lead',
        'post_title'  => $name . ' - ' . $property,
        'post_status' => 'publish',
        'meta_input'  => array(
            '_aire_name'     => $name,
            '_aire_email'    => $email,
            '_aire_whatsapp' => $whatsapp,
            '_aire_property' => $property,
            '_aire_scopes'   => $scopes,
            '_aire_styles'   => $styles,
            '_aire_total'    => $total,
            '_aire_date'     => current_time('mysql'),
        ),
    ));

    if (is_wp_error($post_id)) {
        wp_send_json_error(array('message' => 'Failed to save lead.'));
    }

    // Email notification to site admin
    $admin_email = get_option('admin_email');
    $subject     = 'New Renovation Estimator Lead: ' . $name;
    $body        = "A new lead was submitted through the Renovation Estimator:\n\n"
                 . "Name: {$name}\n"
                 . "Email: {$email}\n"
                 . "WhatsApp: +65 {$whatsapp}\n"
                 . "Property Type: {$property}\n"
                 . "Estimated Total: \${$total}\n"
                 . "Scopes: " . implode(', ', $scopes) . "\n"
                 . "Styles: " . implode(', ', $styles) . "\n";
    wp_mail($admin_email, $subject, $body);

    wp_send_json_success(array('message' => 'Lead captured successfully.', 'id' => $post_id));
}
add_action('wp_ajax_aire_submit_lead', 'aire_handle_lead_submission');
add_action('wp_ajax_nopriv_aire_submit_lead', 'aire_handle_lead_submission');

/**
 * Register "Leads" custom post type so submissions show up in wp-admin
 */
function aire_register_lead_cpt() {
    register_post_type('aire_lead', array(
        'labels' => array(
            'name'          => 'Renovation Leads',
            'singular_name' => 'Renovation Lead',
            'menu_name'     => 'Reno Leads',
        ),
        'public'       => false,
        'show_ui'      => true,
        'show_in_menu' => true,
        'menu_icon'    => 'dashicons-clipboard',
        'supports'     => array('title', 'custom-fields'),
        'capabilities' => array(
            'create_posts' => 'do_not_allow',
        ),
        'map_meta_cap' => true,
    ));
}
add_action('init', 'aire_register_lead_cpt');
