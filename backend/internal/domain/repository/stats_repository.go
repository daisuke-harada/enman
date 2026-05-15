package repository

import "context"

type ContributionItem struct {
	UserID   uint
	UserName string
	Category string
	Count    int
}

type StatsRepository interface {
	GetContributions(ctx context.Context, familyID uint) ([]*ContributionItem, error)
}
