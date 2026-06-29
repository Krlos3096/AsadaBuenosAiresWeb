-- Comprehensive Migration Script for ASADA Buenos Aires Website
-- Includes schema and initial data
-- Compatible with SQLite and Cloudflare D1

-- =====================================================
-- DATA INSERTION
-- =====================================================

-- Insert admin users
-- Production admin (change password in production!)
INSERT OR REPLACE INTO admins (username, password_hash) VALUES 
('prodadmin', 'XsZhHsf14C59qvfaVVQ9oMA5RTX3q38ZsyDFwNabNf4Y20Fw1BxTNApwLwc');

-- Staging admin (change password in production!)
INSERT OR REPLACE INTO admins (username, password_hash) VALUES 
('stageadmin', 'o9MDNxnSct4ozkcCkeXdur6qs+TWPfO/a9rhmp1V4TL3deLbKtC1Lw8RBKrma/CP');

-- Insert contacts (single row)
INSERT OR REPLACE INTO contacts (id, whatsapp_phone_info, whatsapp_phone_support, facebook_url)
VALUES (1, '+50611111111', '+50611111111', 'https://es-la.facebook.com/ASADAdeBuenosAires#');

-- Insert home slides
INSERT INTO home_slides (image, title, subtitle, description, sort_order) VALUES
('https://scontent.fsyq1-1.fna.fbcdn.net/v/t39.30808-6/487061724_1059880886164831_3580490612165758808_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=2a1932&_nc_ohc=f23BbXDP5f4Q7kNvwGO73fw&_nc_oc=Adq-kRX_HkGl4B6BvZIVqnjz02wv35Ucs2ZZ5URd4MD3a7fA_XLg_u8T42SEYCfqt20&_nc_zt=23&_nc_ht=scontent.fsyq1-1.fna&_nc_gid=QVQPYSZxk_Q265Nn1MsOsA&_nc_ss=7b289&oh=00_Af6kVabxF0nCq6ioZ0uXetCg9_aNv3tT8Cn8vQhnuRTv9w&oe=69FEC6BE',
 'Bienvenidos a ASADA Buenos Aires',
 'Agua potable para toda la comunidad',
 'Brindamos agua segura y confiable para toda la comunidad de Buenos Aires',
 0);

-- Insert stats
INSERT INTO stats (number, label, sort_order) VALUES
('2,500+', 'Usuarios Conectados', 0),
('29', 'Años de Servicio', 1),
('15', 'Kilómetros de Red', 2),
('99.5%', 'Calidad del Agua', 3);

-- Insert about content (mission)
INSERT OR REPLACE INTO about_content (content_type, title, content) VALUES
('mission', 'Misión', 'Proporcionar agua potable de calidad a todos los habitantes de la comunidad de Buenos Aires, garantizando un servicio eficiente, sostenible y a precios accesibles, contribuyendo al mejoramiento de la calidad de vida de nuestros usuarios.');

-- Insert about content (vision)
INSERT OR REPLACE INTO about_content (content_type, title, content) VALUES
('vision', 'Visión', 'Ser una ASADA modelo en la gestión sostenible del recurso hídrico, reconocida por su excelencia en el servicio, su compromiso con el medio ambiente y su contribución al desarrollo comunitario.');

-- =====================================================
-- NOTES
-- =====================================================
-- 
-- Cards and timeline items are empty initially (can be added via the admin panel)
-- 
-- IMPORTANT: Change the admin passwords in production!
-- Use node seed-admin.ts to generate new password hashes
-- 
-- To apply this migration to Cloudflare D1:
-- wrangler d1 execute <DATABASE_NAME> --remote --file=migration-with-data.sql --env <environment>
-- 
-- For local development:
-- wrangler d1 execute <DATABASE_NAME> --local --file=migration-with-data.sql
