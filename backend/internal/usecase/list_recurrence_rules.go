package usecase

import (
	"context"

	"github.com/daisuke-harada/enman/internal/apperror"
	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
)

type ListRecurrenceRulesInputPort interface {
	Execute(ctx context.Context, input ListRecurrenceRulesInput) (*ListRecurrenceRulesOutput, error)
}

type ListRecurrenceRulesInput struct {
	CurrentUserID uint
}

type ListRecurrenceRulesOutput struct {
	Rules []*model.RecurrenceRule
}

type ListRecurrenceRulesInteractor struct {
	RuleRepo repository.RecurrenceRuleRepository
	UserRepo repository.UserRepository
}

func NewListRecurrenceRulesInteractor(ruleRepo repository.RecurrenceRuleRepository, userRepo repository.UserRepository) *ListRecurrenceRulesInteractor {
	return &ListRecurrenceRulesInteractor{RuleRepo: ruleRepo, UserRepo: userRepo}
}

func (i *ListRecurrenceRulesInteractor) Execute(ctx context.Context, input ListRecurrenceRulesInput) (*ListRecurrenceRulesOutput, error) {
	user, err := i.UserRepo.FindByID(ctx, input.CurrentUserID)
	if err != nil || user.FamilyID == nil {
		return nil, apperror.UnprocessableEntity("家族グループに参加してください")
	}

	rules, err := i.RuleRepo.FindByFamilyID(ctx, *user.FamilyID)
	if err != nil {
		return nil, apperror.InternalServerError(err)
	}

	return &ListRecurrenceRulesOutput{Rules: rules}, nil
}
