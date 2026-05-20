package usecase

import (
	"context"
	"strings"
	"time"

	"github.com/daisuke-harada/enman/internal/apperror"
	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
)

type CreateRecurrenceRuleInputPort interface {
	Execute(ctx context.Context, input CreateRecurrenceRuleInput) (*CreateRecurrenceRuleOutput, error)
}

type CreateRecurrenceRuleInput struct {
	Title         string
	Category      *string
	Frequency     model.RecurrenceFrequency
	DayOfWeek     *int8
	DayOfMonth    *int8
	WeekOfMonth   *int8
	StartDate     time.Time
	EndDate       *time.Time
	CurrentUserID uint
}

func (i *CreateRecurrenceRuleInput) Validate() error {
	var errs []string
	if strings.TrimSpace(i.Title) == "" {
		errs = append(errs, "ルール名を入力してください")
	}
	if i.Frequency == model.RecurrenceFrequencyWeekly && i.DayOfWeek == nil {
		errs = append(errs, "週次の場合は曜日を指定してください")
	}
	if i.Frequency == model.RecurrenceFrequencyMonthly {
		hasDateSpec := i.DayOfMonth != nil
		hasWeekdaySpec := i.WeekOfMonth != nil && i.DayOfWeek != nil
		if !hasDateSpec && !hasWeekdaySpec {
			errs = append(errs, "月次の場合は日付か第N曜日を指定してください")
		}
	}
	if len(errs) > 0 {
		return apperror.UnprocessableEntity(errs...)
	}
	return nil
}

type CreateRecurrenceRuleOutput struct {
	Rule *model.RecurrenceRule
}

type CreateRecurrenceRuleInteractor struct {
	RuleRepo repository.RecurrenceRuleRepository
	UserRepo repository.UserRepository
}

func NewCreateRecurrenceRuleInteractor(ruleRepo repository.RecurrenceRuleRepository, userRepo repository.UserRepository) *CreateRecurrenceRuleInteractor {
	return &CreateRecurrenceRuleInteractor{RuleRepo: ruleRepo, UserRepo: userRepo}
}

func (i *CreateRecurrenceRuleInteractor) Execute(ctx context.Context, input CreateRecurrenceRuleInput) (*CreateRecurrenceRuleOutput, error) {
	if err := input.Validate(); err != nil {
		return nil, err
	}

	user, err := i.UserRepo.FindByID(ctx, input.CurrentUserID)
	if err != nil || user.FamilyID == nil {
		return nil, apperror.UnprocessableEntity("家族グループに参加してから繰り返しルールを作成してください")
	}

	rule := &model.RecurrenceRule{
		FamilyID:    *user.FamilyID,
		CreatedBy:   input.CurrentUserID,
		Title:       input.Title,
		Category:    input.Category,
		Frequency:   input.Frequency,
		DayOfWeek:   input.DayOfWeek,
		DayOfMonth:  input.DayOfMonth,
		WeekOfMonth: input.WeekOfMonth,
		StartDate:   input.StartDate,
		EndDate:     input.EndDate,
	}
	if err := i.RuleRepo.Create(ctx, rule); err != nil {
		return nil, apperror.InternalServerError(err)
	}

	return &CreateRecurrenceRuleOutput{Rule: rule}, nil
}
