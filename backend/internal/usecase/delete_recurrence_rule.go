package usecase

import (
	"context"

	"github.com/daisuke-harada/enman/internal/apperror"
	"github.com/daisuke-harada/enman/internal/domain/repository"
)

type DeleteRecurrenceRuleInputPort interface {
	Execute(ctx context.Context, input DeleteRecurrenceRuleInput) error
}

type DeleteRecurrenceRuleInput struct {
	RuleID        uint
	CurrentUserID uint
}

type DeleteRecurrenceRuleInteractor struct {
	RuleRepo repository.RecurrenceRuleRepository
}

func NewDeleteRecurrenceRuleInteractor(ruleRepo repository.RecurrenceRuleRepository) *DeleteRecurrenceRuleInteractor {
	return &DeleteRecurrenceRuleInteractor{RuleRepo: ruleRepo}
}

func (i *DeleteRecurrenceRuleInteractor) Execute(ctx context.Context, input DeleteRecurrenceRuleInput) error {
	rule, err := i.RuleRepo.FindByID(ctx, input.RuleID)
	if err != nil {
		return apperror.NotFound()
	}
	if rule.CreatedBy != input.CurrentUserID {
		return apperror.Forbidden()
	}

	if err := i.RuleRepo.Delete(ctx, input.RuleID); err != nil {
		return apperror.InternalServerError(err)
	}
	return nil
}
