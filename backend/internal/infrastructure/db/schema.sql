CREATE TABLE families (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  invite_code VARCHAR(12) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_families_invite_code (invite_code)
);

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  family_id BIGINT UNSIGNED,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  icon_url VARCHAR(1024),
  email VARCHAR(255) NOT NULL,
  password_digest VARCHAR(255) NOT NULL,
  enman_point INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  CONSTRAINT fk_users_family_id FOREIGN KEY (family_id) REFERENCES families (id)
);

CREATE TABLE refresh_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expired_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_refresh_tokens_token_hash (token_hash),
  CONSTRAINT fk_refresh_tokens_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE task_templates (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE tasks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  family_id BIGINT UNSIGNED NOT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  done_by BIGINT UNSIGNED,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  done_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_tasks_family_status (family_id, status),
  CONSTRAINT fk_tasks_family_id FOREIGN KEY (family_id) REFERENCES families (id),
  CONSTRAINT fk_tasks_created_by FOREIGN KEY (created_by) REFERENCES users (id),
  CONSTRAINT fk_tasks_done_by FOREIGN KEY (done_by) REFERENCES users (id)
);

CREATE TABLE family_goals (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  family_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  target_points INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_family_goals_family (family_id),
  CONSTRAINT fk_family_goals_family FOREIGN KEY (family_id) REFERENCES families (id)
);

CREATE TABLE appreciations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  task_id BIGINT UNSIGNED NOT NULL,
  from_user_id BIGINT UNSIGNED NOT NULL,
  to_user_id BIGINT UNSIGNED NOT NULL,
  stamp_type VARCHAR(20) NOT NULL,
  message VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_appreciations_to_user (to_user_id),
  INDEX idx_appreciations_task (task_id),
  CONSTRAINT fk_appreciations_task FOREIGN KEY (task_id) REFERENCES tasks (id),
  CONSTRAINT fk_appreciations_from_user FOREIGN KEY (from_user_id) REFERENCES users (id),
  CONSTRAINT fk_appreciations_to_user FOREIGN KEY (to_user_id) REFERENCES users (id)
);
