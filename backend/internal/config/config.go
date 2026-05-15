package config

import (
	"log/slog"
	"sync"
	"time"

	"github.com/kelseyhightower/envconfig"
)

var (
	once sync.Once
	cfg  *Config
)

type Config struct {
	DB     DBConfig
	JWT    JWTConfig
	Server ServerConfig
}

type ServerConfig struct {
	Port string `envconfig:"SERVER_PORT" default:"1099"`
}

type JWTConfig struct {
	SecretKey string `envconfig:"JWT_SECRET_KEY" required:"true"`
}

type DBConfig struct {
	Host     string `envconfig:"DB_HOST" required:"true"`
	Port     int    `envconfig:"DB_PORT" default:"3306"`
	User     string `envconfig:"DB_USER" required:"true"`
	Password string `envconfig:"DB_PASSWORD" required:"true"`
	Name     string `envconfig:"DB_NAME" required:"true"`
	TLS      bool   `envconfig:"DB_TLS" default:"false"`
	// Connection pool settings
	MaxOpenConns    int           `envconfig:"DB_MAX_OPEN_CONNS" default:"25"`
	MaxIdleConns    int           `envconfig:"DB_MAX_IDLE_CONNS" default:"25"`
	ConnMaxLifetime time.Duration `envconfig:"DB_CONN_MAX_LIFETIME" default:"5m"`
}

func Get() *Config {
	once.Do(func() {
		cfg = &Config{}
		if e := envconfig.Process("", &cfg.DB); e != nil {
			slog.Error("failed to process environment db", "err", e)
		}
		if e := envconfig.Process("", &cfg.JWT); e != nil {
			slog.Error("failed to process environment jwt", "err", e)
		}
		if e := envconfig.Process("", &cfg.Server); e != nil {
			slog.Error("failed to process environment server", "err", e)
		}
	})

	return cfg
}
