--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'test2@example.com', '$2a$10$PUnyyLqJnv4N0OnBhjvpMu/6RuFLfhKWbWVPPaZDxzmvOULPGF18C', '2025-07-27 05:26:32.513991+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2025-07-27 05:26:32.513991+00', '2025-07-27 05:26:32.513991+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) VALUES ('00000000-0000-0000-0000-000000000000', '963d5af6-ad61-425d-88e6-ce7668948a33', 'authenticated', 'authenticated', 'test@example.com', '$2a$10$NRVvxeCHbt4tJfGrL1euOeFTch8DpjshqTBxD.0WzO1CkJvc/s7vi', '2025-07-27 05:26:59.456127+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-07-27 05:33:03.48814+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2025-07-27 05:26:59.434144+00', '2025-07-27 05:33:03.490279+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '{"sub": "00000000-0000-0000-0000-000000000002", "email": "test2@example.com", "email_verified": false, "phone_verified": false}', 'email', '2025-07-27 05:26:32.513991+00', '2025-07-27 05:26:32.513991+00', '2025-07-27 05:26:32.513991+00', 'a586e58e-a5e4-4052-87d1-7f8c1c227efe');
INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) VALUES ('963d5af6-ad61-425d-88e6-ce7668948a33', '963d5af6-ad61-425d-88e6-ce7668948a33', '{"sub": "963d5af6-ad61-425d-88e6-ce7668948a33", "email": "test@example.com", "email_verified": false, "phone_verified": false}', 'email', '2025-07-27 05:26:59.444292+00', '2025-07-27 05:26:59.444356+00', '2025-07-27 05:26:59.444356+00', '957609be-e77a-4d17-81ed-6048480c5fba');


--
-- PostgreSQL database dump complete
--

