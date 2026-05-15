package persistence

import (
	"context"

	"github.com/daisuke-harada/enman/internal/domain/repository"
	"gorm.io/gorm"
)

type statsRepository struct {
	db *gorm.DB
}

func NewStatsRepository(db *gorm.DB) repository.StatsRepository {
	return &statsRepository{db: db}
}

func (r *statsRepository) GetContributions(ctx context.Context, familyID uint) ([]*repository.ContributionItem, error) {
	type row struct {
		UserID   uint
		UserName string
		Category *string
		Count    int
	}

	var rows []row
	err := r.db.WithContext(ctx).Raw(`
		SELECT u.id AS user_id, u.name AS user_name, t.category, COUNT(*) AS count
		FROM tasks t
		JOIN users u ON t.done_by = u.id
		WHERE t.family_id = ? AND t.status = 'done'
		GROUP BY u.id, u.name, t.category
		ORDER BY u.id, count DESC
	`, familyID).Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	items := make([]*repository.ContributionItem, len(rows))
	for i, r := range rows {
		cat := "その他"
		if r.Category != nil && *r.Category != "" {
			cat = *r.Category
		}
		items[i] = &repository.ContributionItem{
			UserID:   r.UserID,
			UserName: r.UserName,
			Category: cat,
			Count:    r.Count,
		}
	}
	return items, nil
}
