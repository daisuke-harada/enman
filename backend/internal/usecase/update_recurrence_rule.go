package usecase

import (
	"context"
	"strings"
	"time"

	"github.com/daisuke-harada/enman/internal/apperror"
	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
)

type UpdateRecurrenceRuleInputPort interface {
	Execute(ctx context.Context, input UpdateRecurrenceRuleInput) (*UpdateRecurrenceRuleOutput, error)
}

type UpdateRecurrenceRuleInput struct {
	RuleID        uint
	Title         string
	Category      *string
	Frequency     model.RecurrenceFrequency
	DayOfWeek     *int8
	DayOfMonth    *int8
	StartDate     time.Time
	EndDate       *time.Time
	CurrentUserID uint
}

func (i *UpdateRecurrenceRuleInput) Validate() error {
	var errs []string
	if strings.TrimSpace(i.Title) == "" {
		errs = append(errs, "ルール名を入力してください")
	}
	if i.Frequency == model.RecurrenceFrequencyWeekly && i.DayOfWeek == nil {
		errs = append(errs, "週次の場合は曜日を指定してください")
	}
	if i.Frequency == model.RecurrenceFrequencyMonthly && i.DayOfMonth == nil {
		errs = append(errs, "月次の場合は日付を指定してください")
	}
	if len(errs) > 0 {
		return apperror.UnprocessableEntity(errs...)
	}
	return nil
}

type UpdateRecurrenceRuleOutput struct {
	Rule *model.RecurrenceRule
}

type UpdateRecurrenceRuleInteractor struct {
	RuleRepo repository.RecurrenceRuleRepository
}

func NewUpdateRecurrenceRuleInteractor(ruleRepo repository.RecurrenceRuleRepository) *UpdateRecurrenceRuleInteractor {
	return &UpdateRecurrenceRuleInteractor{RuleRepo: ruleRepo}
}

func (i *UpdateRecurrenceRuleInteractor) Execute(ctx context.Context, input UpdateRecurrenceRuleInput) (*UpdateRecurrenceRuleOutput, error) {
	if err := input.Validate(); err != nil {
		return nil, err
	}

	rule, err := i.RuleRepo.FindByID(ctx, input.RuleID)
	if err != nil {
		return nil, apperror.NotFound()
	}
	if rule.CreatedBy != input.CurrentUserID {
		return nil, apperror.Forbidden()
	}

	rule.Title = input.Title
	rule.Category = input.Category
	rule.Frequency = input.Frequency
	rule.DayOfWeek = input.DayOfWeek
	rule.DayOfMonth = input.DayOfMonth
	rule.StartDate = input.StartDate
	rule.EndDate = input.EndDate

	if err := i.RuleRepo.Update(ctx, rule); err != nil {
		return nil, apperror.InternalServerError(err)
	}

	return &UpdateRecurrenceRuleOutput{Rule: rule}, nil
}
