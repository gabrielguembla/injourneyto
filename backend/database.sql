CREATE DATABASE IF NOT EXISTS system_auth
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE system_auth;

CREATE TABLE IF NOT EXISTS user (
    id INT AUTO_INCREMENT PRIMARY KEY ,
    
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,

    role ENUM('admin', 'usuario') NOT NULL DEFAULT 'usuario',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

USE system_auth;

-- I was making some changes

ALTER TABLE user 
MODIFY COLUMN password VARCHAR(255) NULL,
-- Here I changed the word 'usuário' to 'user';
MODIFY COLUMN role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
-- RENAME COLUMN name TO first_name,
CHANGE name first_name VARCHAR(100) NOT NULL,
ADD COLUMN auth_provider ENUM('local', 'google') NOT NULL DEFAULT 'local' AFTER role,
ADD COLUMN google_id VARCHAR(255) UNIQUE AFTER auth_provider,
ADD COLUMN url_picture VARCHAR(250) NULL AFTER google_id,
-- Here I added the 'last_name' column to user table.
ADD COLUMN last_name VARCHAR(200) NOT NULL AFTER first_name,
ADD COLUMN cep VARCHAR(10) NOT NULL AFTER last_name,
ADD COLUMN logradouro VARCHAR(255) NOT NULL AFTER cep,        
ADD COLUMN numero VARCHAR(20) NOT NULL AFTER cep,             
ADD COLUMN complemento VARCHAR(255) AFTER numero,                
ADD COLUMN bairro VARCHAR(100) NOT NULL AFTER complemento,            
ADD COLUMN cidade VARCHAR(100) NOT NULL AFTER bairro,            
ADD COLUMN estado VARCHAR(2) NOT NULL AFTER cidade,               
ADD COLUMN ponto_referencia VARCHAR(255) AFTER estado;




-- Choose only one of the following two options. The first only works on the latest version of MySQl.
-- ALTER TABLE user RENAME COLUMN name TO first_name;
-- ALTER TABLE user CHANGE name first_name VARCHAR(100) NOT NULL;

ALTER TABLE user CHANGE url_picture photo_url VARCHAR(250) NULL;
SHOW CREATE TABLE `user`;
--  Delete table;
DROP TABLE user;

USE system_auth;
DESCRIBE user;

-- Here I was checking the MySQL version

SELECT VERSION();

SELECT @@version;

STATUS;

SHOW VARIABLES LIKE 'version%';




INSERT INTO user (first_name, last_name, email, password, role, auth_provider, google_id, url_picture) VALUES ();




DROP DATABASE system_auth;

