CREATE TABLE api_keys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  api_key VARCHAR(100) NOT NULL UNIQUE, -- Réduction de la taille à 100
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  rate_limit INT DEFAULT 100,
  calls_made INT DEFAULT 0,
  renewal_token VARCHAR(255)
);


