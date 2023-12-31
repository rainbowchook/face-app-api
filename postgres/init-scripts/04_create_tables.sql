\connect "${DB_NAME}" "${DB_USER}"

CREATE TABLE "${SCHEMA}".users (
  id serial PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email text UNIQUE NOT NULL,
  entries BIGINT DEFAULT 0,
  joined TIMESTAMP NOT NULL
);

CREATE TABLE "${SCHEMA}".login (
  id serial PRIMARY KEY,
  email text UNIQUE NOT NULL,
  hash VARCHAR(100) NOT NULL
);