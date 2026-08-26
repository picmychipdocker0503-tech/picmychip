import * as migration_20260717_084221_initial_schema from './20260717_084221_initial_schema';
import * as migration_20260720_061657_add_media_prefix from './20260720_061657_add_media_prefix';
import * as migration_20260721_092721_add_brands_reviews_product_fields from './20260721_092721_add_brands_reviews_product_fields';
import * as migration_20260721_100952_add_homepage_foundations from './20260721_100952_add_homepage_foundations';
import * as migration_20260721_102154_add_homepage_priority_blocks from './20260721_102154_add_homepage_priority_blocks';
import * as migration_20260721_103947_add_homepage_merchandising_blocks from './20260721_103947_add_homepage_merchandising_blocks';
import * as migration_20260721_113103_add_testimonials_trustbadges_blocks from './20260721_113103_add_testimonials_trustbadges_blocks';
import * as migration_20260721_121331_add_robu_redesign_content from './20260721_121331_add_robu_redesign_content';
import * as migration_20260724_045337_add_header_nav_dropdown from './20260724_045337_add_header_nav_dropdown';
import * as migration_20260724_072729_add_guide_author_byline from './20260724_072729_add_guide_author_byline';
import * as migration_20260724_085446_add_user_avatar from './20260724_085446_add_user_avatar';
import * as migration_20260724_101857_add_product_highlights_support_email from './20260724_101857_add_product_highlights_support_email';
import * as migration_20260724_103402_add_product_compare_at_price from './20260724_103402_add_product_compare_at_price';
import * as migration_20260724_111250_add_inr_currency_support from './20260724_111250_add_inr_currency_support';
import * as migration_20260724_111400_add_inr_currency_defaults from './20260724_111400_add_inr_currency_defaults';
import * as migration_20260724_111612_add_compare_at_price_per_currency from './20260724_111612_add_compare_at_price_per_currency';
import * as migration_20260724_112042_remove_legacy_compare_at_price from './20260724_112042_remove_legacy_compare_at_price';
import * as migration_20260724_134511_add_ecommerce_feature_batch from './20260724_134511_add_ecommerce_feature_batch';
import * as migration_20260724_144339_add_order_fraud_flag from './20260724_144339_add_order_fraud_flag';
import * as migration_20260804_103157_add_trust_badge_description from './20260804_103157_add_trust_badge_description';
import * as migration_20260804_132937_add_shipping_tax_reports from './20260804_132937_add_shipping_tax_reports';
import * as migration_20260804_142125_add_refunds_abandoned_cart from './20260804_142125_add_refunds_abandoned_cart';
import * as migration_20260805_105728_add_faq_design_fields from './20260805_105728_add_faq_design_fields';
import * as migration_20260810_120000_replace_stripe_with_razorpay from './20260810_120000_replace_stripe_with_razorpay';
import * as migration_20260810_130000_fix_razorpay_shipping_column from './20260810_130000_fix_razorpay_shipping_column';
import * as migration_20260810_140000_remove_usd_pricing from './20260810_140000_remove_usd_pricing';
import * as migration_20260810_150000_replace_razorpay_with_payu from './20260810_150000_replace_razorpay_with_payu';
import * as migration_20260810_163500_add_customer_interaction_block from './20260810_163500_add_customer_interaction_block';
import * as migration_20260811_123811_add_forms_upload_field from './20260811_123811_add_forms_upload_field';
import * as migration_20260811_130249_add_datasheets_upload_collection from './20260811_130249_add_datasheets_upload_collection';
import * as migration_20260811_180000_add_users_verify from './20260811_180000_add_users_verify';
import * as migration_20260811_190000_add_jobs_collection from './20260811_190000_add_jobs_collection';
import * as migration_20260813_043522_fix_users_verify_column from './20260813_043522_fix_users_verify_column';
import * as migration_20260813_062510_add_zoho_shiprocket_integration from './20260813_062510_add_zoho_shiprocket_integration';
import * as migration_20260813_101501_revert_verification_token_rename from './20260813_101501_revert_verification_token_rename';
import * as migration_20260814_104514_add_zoho_sales_order_tracking from './20260814_104514_add_zoho_sales_order_tracking';
import * as migration_20260814_123027_add_address_gstin from './20260814_123027_add_address_gstin';
import * as migration_20260818_061827_zoho_item_id from './20260818_061827_zoho_item_id';
import * as migration_20260818_093126_add_community_feedback from './20260818_093126_add_community_feedback';
import * as migration_20260818_121920_add_team_testimonials_and_culture_block from './20260818_121920_add_team_testimonials_and_culture_block';
import * as migration_20260819_044939_add_email_events from './20260819_044939_add_email_events';
import * as migration_20260819_072742_add_product_sale_pricing from './20260819_072742_add_product_sale_pricing';
import * as migration_20260819_075443_add_product_perf_indexes from './20260819_075443_add_product_perf_indexes';
import * as migration_20260819_120810_add_team_grid_and_story from './20260819_120810_add_team_grid_and_story';
import * as migration_20260819_143501_make_team_quote_optional from './20260819_143501_make_team_quote_optional';
import * as migration_20260819_195700_restore_customer_interaction_block from './20260819_195700_restore_customer_interaction_block';
import * as migration_20260819_120731_remove_customer_interaction_block from './20260819_120731_remove_customer_interaction_block';
import * as migration_20260819_131219_add_rfq_bom_section from './20260819_131219_add_rfq_bom_section';
import * as migration_20260819_140542_add_track_order_feature_flag from './20260819_140542_add_track_order_feature_flag';
import * as migration_20260819_212037_add_trusted_by_brands_feature_flag from './20260819_212037_add_trusted_by_brands_feature_flag';
import * as migration_20260820_043804_add_rewards_free_shipping_flags from './20260820_043804_add_rewards_free_shipping_flags';
import * as migration_20260820_072924_add_contact_info_block from './20260820_072924_add_contact_info_block';
import * as migration_20260820_074514_add_contact_info_map_query from './20260820_074514_add_contact_info_map_query';
import * as migration_20260820_114334_add_team_testimonials_linked_user from './20260820_114334_add_team_testimonials_linked_user';
import * as migration_20260820_130557_add_category_description from './20260820_130557_add_category_description';
import * as migration_20260820_131235_add_order_review_request from './20260820_131235_add_order_review_request';
import * as migration_20260820_134902_add_wishlists_collection from './20260820_134902_add_wishlists_collection';
import * as migration_20260820_183000_add_checkout_shipping_fields from './20260820_183000_add_checkout_shipping_fields';
import * as migration_20260821_090000_add_category_sequence from './20260821_090000_add_category_sequence';
import * as migration_20260821_093000_link_category_parents from './20260821_093000_link_category_parents';
import * as migration_20260824_122135_add_address_book_fields from './20260824_122135_add_address_book_fields';
import * as migration_20260824_171222_add_shipping_settings from './20260824_171222_add_shipping_settings';
import * as migration_20260824_194916_remove_shiprocket_fields from './20260824_194916_remove_shiprocket_fields';
import * as migration_20260824_221421_add_address_email from './20260824_221421_add_address_email';
import * as migration_20260824_221656_add_billing_address_email from './20260824_221656_add_billing_address_email';
import * as migration_20260825_103500_add_rfq_submissions from './20260825_103500_add_rfq_submissions';
import * as migration_20260825_113000_add_rfq_submissions_customer from './20260825_113000_add_rfq_submissions_customer';
import * as migration_20260825_164500_add_user_theme_preference from './20260825_164500_add_user_theme_preference';
import * as migration_20260826_191500_add_order_number_settings from './20260826_191500_add_order_number_settings';

export const migrations = [
  {
    up: migration_20260717_084221_initial_schema.up,
    down: migration_20260717_084221_initial_schema.down,
    name: '20260717_084221_initial_schema',
  },
  {
    up: migration_20260720_061657_add_media_prefix.up,
    down: migration_20260720_061657_add_media_prefix.down,
    name: '20260720_061657_add_media_prefix',
  },
  {
    up: migration_20260721_092721_add_brands_reviews_product_fields.up,
    down: migration_20260721_092721_add_brands_reviews_product_fields.down,
    name: '20260721_092721_add_brands_reviews_product_fields',
  },
  {
    up: migration_20260721_100952_add_homepage_foundations.up,
    down: migration_20260721_100952_add_homepage_foundations.down,
    name: '20260721_100952_add_homepage_foundations',
  },
  {
    up: migration_20260721_102154_add_homepage_priority_blocks.up,
    down: migration_20260721_102154_add_homepage_priority_blocks.down,
    name: '20260721_102154_add_homepage_priority_blocks',
  },
  {
    up: migration_20260721_103947_add_homepage_merchandising_blocks.up,
    down: migration_20260721_103947_add_homepage_merchandising_blocks.down,
    name: '20260721_103947_add_homepage_merchandising_blocks',
  },
  {
    up: migration_20260721_113103_add_testimonials_trustbadges_blocks.up,
    down: migration_20260721_113103_add_testimonials_trustbadges_blocks.down,
    name: '20260721_113103_add_testimonials_trustbadges_blocks',
  },
  {
    up: migration_20260721_121331_add_robu_redesign_content.up,
    down: migration_20260721_121331_add_robu_redesign_content.down,
    name: '20260721_121331_add_robu_redesign_content',
  },
  {
    up: migration_20260724_045337_add_header_nav_dropdown.up,
    down: migration_20260724_045337_add_header_nav_dropdown.down,
    name: '20260724_045337_add_header_nav_dropdown',
  },
  {
    up: migration_20260724_072729_add_guide_author_byline.up,
    down: migration_20260724_072729_add_guide_author_byline.down,
    name: '20260724_072729_add_guide_author_byline',
  },
  {
    up: migration_20260724_085446_add_user_avatar.up,
    down: migration_20260724_085446_add_user_avatar.down,
    name: '20260724_085446_add_user_avatar',
  },
  {
    up: migration_20260724_101857_add_product_highlights_support_email.up,
    down: migration_20260724_101857_add_product_highlights_support_email.down,
    name: '20260724_101857_add_product_highlights_support_email',
  },
  {
    up: migration_20260724_103402_add_product_compare_at_price.up,
    down: migration_20260724_103402_add_product_compare_at_price.down,
    name: '20260724_103402_add_product_compare_at_price',
  },
  {
    up: migration_20260724_111250_add_inr_currency_support.up,
    down: migration_20260724_111250_add_inr_currency_support.down,
    name: '20260724_111250_add_inr_currency_support',
  },
  {
    up: migration_20260724_111400_add_inr_currency_defaults.up,
    down: migration_20260724_111400_add_inr_currency_defaults.down,
    name: '20260724_111400_add_inr_currency_defaults',
  },
  {
    up: migration_20260724_111612_add_compare_at_price_per_currency.up,
    down: migration_20260724_111612_add_compare_at_price_per_currency.down,
    name: '20260724_111612_add_compare_at_price_per_currency',
  },
  {
    up: migration_20260724_112042_remove_legacy_compare_at_price.up,
    down: migration_20260724_112042_remove_legacy_compare_at_price.down,
    name: '20260724_112042_remove_legacy_compare_at_price',
  },
  {
    up: migration_20260724_134511_add_ecommerce_feature_batch.up,
    down: migration_20260724_134511_add_ecommerce_feature_batch.down,
    name: '20260724_134511_add_ecommerce_feature_batch',
  },
  {
    up: migration_20260724_144339_add_order_fraud_flag.up,
    down: migration_20260724_144339_add_order_fraud_flag.down,
    name: '20260724_144339_add_order_fraud_flag',
  },
  {
    up: migration_20260804_103157_add_trust_badge_description.up,
    down: migration_20260804_103157_add_trust_badge_description.down,
    name: '20260804_103157_add_trust_badge_description',
  },
  {
    up: migration_20260804_132937_add_shipping_tax_reports.up,
    down: migration_20260804_132937_add_shipping_tax_reports.down,
    name: '20260804_132937_add_shipping_tax_reports',
  },
  {
    up: migration_20260804_142125_add_refunds_abandoned_cart.up,
    down: migration_20260804_142125_add_refunds_abandoned_cart.down,
    name: '20260804_142125_add_refunds_abandoned_cart',
  },
  {
    up: migration_20260805_105728_add_faq_design_fields.up,
    down: migration_20260805_105728_add_faq_design_fields.down,
    name: '20260805_105728_add_faq_design_fields',
  },
  {
    up: migration_20260810_120000_replace_stripe_with_razorpay.up,
    down: migration_20260810_120000_replace_stripe_with_razorpay.down,
    name: '20260810_120000_replace_stripe_with_razorpay',
  },
  {
    up: migration_20260810_130000_fix_razorpay_shipping_column.up,
    down: migration_20260810_130000_fix_razorpay_shipping_column.down,
    name: '20260810_130000_fix_razorpay_shipping_column',
  },
  {
    up: migration_20260810_140000_remove_usd_pricing.up,
    down: migration_20260810_140000_remove_usd_pricing.down,
    name: '20260810_140000_remove_usd_pricing',
  },
  {
    up: migration_20260810_150000_replace_razorpay_with_payu.up,
    down: migration_20260810_150000_replace_razorpay_with_payu.down,
    name: '20260810_150000_replace_razorpay_with_payu',
  },
  {
    up: migration_20260810_163500_add_customer_interaction_block.up,
    down: migration_20260810_163500_add_customer_interaction_block.down,
    name: '20260810_163500_add_customer_interaction_block',
  },
  {
    up: migration_20260811_123811_add_forms_upload_field.up,
    down: migration_20260811_123811_add_forms_upload_field.down,
    name: '20260811_123811_add_forms_upload_field',
  },
  {
    up: migration_20260811_130249_add_datasheets_upload_collection.up,
    down: migration_20260811_130249_add_datasheets_upload_collection.down,
    name: '20260811_130249_add_datasheets_upload_collection',
  },
  {
    up: migration_20260811_180000_add_users_verify.up,
    down: migration_20260811_180000_add_users_verify.down,
    name: '20260811_180000_add_users_verify',
  },
  {
    up: migration_20260811_190000_add_jobs_collection.up,
    down: migration_20260811_190000_add_jobs_collection.down,
    name: '20260811_190000_add_jobs_collection',
  },
  {
    up: migration_20260813_043522_fix_users_verify_column.up,
    down: migration_20260813_043522_fix_users_verify_column.down,
    name: '20260813_043522_fix_users_verify_column',
  },
  {
    up: migration_20260813_062510_add_zoho_shiprocket_integration.up,
    down: migration_20260813_062510_add_zoho_shiprocket_integration.down,
    name: '20260813_062510_add_zoho_shiprocket_integration',
  },
  {
    up: migration_20260813_101501_revert_verification_token_rename.up,
    down: migration_20260813_101501_revert_verification_token_rename.down,
    name: '20260813_101501_revert_verification_token_rename',
  },
  {
    up: migration_20260814_104514_add_zoho_sales_order_tracking.up,
    down: migration_20260814_104514_add_zoho_sales_order_tracking.down,
    name: '20260814_104514_add_zoho_sales_order_tracking',
  },
  {
    up: migration_20260814_123027_add_address_gstin.up,
    down: migration_20260814_123027_add_address_gstin.down,
    name: '20260814_123027_add_address_gstin',
  },
  {
    up: migration_20260818_061827_zoho_item_id.up,
    down: migration_20260818_061827_zoho_item_id.down,
    name: '20260818_061827_zoho_item_id',
  },
  {
    up: migration_20260818_093126_add_community_feedback.up,
    down: migration_20260818_093126_add_community_feedback.down,
    name: '20260818_093126_add_community_feedback',
  },
  {
    up: migration_20260818_121920_add_team_testimonials_and_culture_block.up,
    down: migration_20260818_121920_add_team_testimonials_and_culture_block.down,
    name: '20260818_121920_add_team_testimonials_and_culture_block',
  },
  {
    up: migration_20260819_044939_add_email_events.up,
    down: migration_20260819_044939_add_email_events.down,
    name: '20260819_044939_add_email_events',
  },
  {
    up: migration_20260819_072742_add_product_sale_pricing.up,
    down: migration_20260819_072742_add_product_sale_pricing.down,
    name: '20260819_072742_add_product_sale_pricing',
  },
  {
    up: migration_20260819_075443_add_product_perf_indexes.up,
    down: migration_20260819_075443_add_product_perf_indexes.down,
    name: '20260819_075443_add_product_perf_indexes',
  },
  {
    up: migration_20260819_120810_add_team_grid_and_story.up,
    down: migration_20260819_120810_add_team_grid_and_story.down,
    name: '20260819_120810_add_team_grid_and_story',
  },
  {
    up: migration_20260819_143501_make_team_quote_optional.up,
    down: migration_20260819_143501_make_team_quote_optional.down,
    name: '20260819_143501_make_team_quote_optional',
  },
  {
    up: migration_20260819_195700_restore_customer_interaction_block.up,
    down: migration_20260819_195700_restore_customer_interaction_block.down,
    name: '20260819_195700_restore_customer_interaction_block',
  },
  {
    up: migration_20260819_120731_remove_customer_interaction_block.up,
    down: migration_20260819_120731_remove_customer_interaction_block.down,
    name: '20260819_120731_remove_customer_interaction_block',
  },
  {
    up: migration_20260819_131219_add_rfq_bom_section.up,
    down: migration_20260819_131219_add_rfq_bom_section.down,
    name: '20260819_131219_add_rfq_bom_section',
  },
  {
    up: migration_20260819_140542_add_track_order_feature_flag.up,
    down: migration_20260819_140542_add_track_order_feature_flag.down,
    name: '20260819_140542_add_track_order_feature_flag',
  },
  {
    up: migration_20260819_212037_add_trusted_by_brands_feature_flag.up,
    down: migration_20260819_212037_add_trusted_by_brands_feature_flag.down,
    name: '20260819_212037_add_trusted_by_brands_feature_flag',
  },
  {
    up: migration_20260820_043804_add_rewards_free_shipping_flags.up,
    down: migration_20260820_043804_add_rewards_free_shipping_flags.down,
    name: '20260820_043804_add_rewards_free_shipping_flags',
  },
  {
    up: migration_20260820_072924_add_contact_info_block.up,
    down: migration_20260820_072924_add_contact_info_block.down,
    name: '20260820_072924_add_contact_info_block',
  },
  {
    up: migration_20260820_074514_add_contact_info_map_query.up,
    down: migration_20260820_074514_add_contact_info_map_query.down,
    name: '20260820_074514_add_contact_info_map_query',
  },
  {
    up: migration_20260820_114334_add_team_testimonials_linked_user.up,
    down: migration_20260820_114334_add_team_testimonials_linked_user.down,
    name: '20260820_114334_add_team_testimonials_linked_user',
  },
  {
    up: migration_20260820_130557_add_category_description.up,
    down: migration_20260820_130557_add_category_description.down,
    name: '20260820_130557_add_category_description',
  },
  {
    up: migration_20260820_131235_add_order_review_request.up,
    down: migration_20260820_131235_add_order_review_request.down,
    name: '20260820_131235_add_order_review_request',
  },
  {
    up: migration_20260820_134902_add_wishlists_collection.up,
    down: migration_20260820_134902_add_wishlists_collection.down,
    name: '20260820_134902_add_wishlists_collection',
  },
  {
    up: migration_20260820_183000_add_checkout_shipping_fields.up,
    down: migration_20260820_183000_add_checkout_shipping_fields.down,
    name: '20260820_183000_add_checkout_shipping_fields',
  },
  {
    up: migration_20260821_090000_add_category_sequence.up,
    down: migration_20260821_090000_add_category_sequence.down,
    name: '20260821_090000_add_category_sequence',
  },
  {
    up: migration_20260821_093000_link_category_parents.up,
    down: migration_20260821_093000_link_category_parents.down,
    name: '20260821_093000_link_category_parents',
  },
  {
    up: migration_20260824_122135_add_address_book_fields.up,
    down: migration_20260824_122135_add_address_book_fields.down,
    name: '20260824_122135_add_address_book_fields',
  },
  {
    up: migration_20260824_171222_add_shipping_settings.up,
    down: migration_20260824_171222_add_shipping_settings.down,
    name: '20260824_171222_add_shipping_settings',
  },
  {
    up: migration_20260824_194916_remove_shiprocket_fields.up,
    down: migration_20260824_194916_remove_shiprocket_fields.down,
    name: '20260824_194916_remove_shiprocket_fields',
  },
  {
    up: migration_20260824_221421_add_address_email.up,
    down: migration_20260824_221421_add_address_email.down,
    name: '20260824_221421_add_address_email',
  },
  {
    up: migration_20260824_221656_add_billing_address_email.up,
    down: migration_20260824_221656_add_billing_address_email.down,
    name: '20260824_221656_add_billing_address_email',
  },
  {
    up: migration_20260825_103500_add_rfq_submissions.up,
    down: migration_20260825_103500_add_rfq_submissions.down,
    name: '20260825_103500_add_rfq_submissions',
  },
  {
    up: migration_20260825_113000_add_rfq_submissions_customer.up,
    down: migration_20260825_113000_add_rfq_submissions_customer.down,
    name: '20260825_113000_add_rfq_submissions_customer',
  },
  {
    up: migration_20260825_164500_add_user_theme_preference.up,
    down: migration_20260825_164500_add_user_theme_preference.down,
    name: '20260825_164500_add_user_theme_preference',
  },
  {
    up: migration_20260826_191500_add_order_number_settings.up,
    down: migration_20260826_191500_add_order_number_settings.down,
    name: '20260826_191500_add_order_number_settings',
  },
];
