package usecase

import (
	"context"

	"github.com/daisuke-harada/enman/internal/apperror"
	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
)

type ListTaskTemplatesInputPort interface {
	Execute(ctx context.Context) (*ListTaskTemplatesOutput, error)
}

type ListTaskTemplatesOutput struct {
	Templates []*model.TaskTemplate
}

type ListTaskTemplatesInteractor struct {
	TaskTemplateRepo repository.TaskTemplateRepository
}

func NewListTaskTemplatesInteractor(taskTemplateRepo repository.TaskTemplateRepository) *ListTaskTemplatesInteractor {
	return &ListTaskTemplatesInteractor{TaskTemplateRepo: taskTemplateRepo}
}

func (i *ListTaskTemplatesInteractor) Execute(ctx context.Context) (*ListTaskTemplatesOutput, error) {
	templates, err := i.TaskTemplateRepo.FindAll(ctx)
	if err != nil {
		return nil, apperror.InternalServerError(err)
	}
	return &ListTaskTemplatesOutput{Templates: templates}, nil
}
