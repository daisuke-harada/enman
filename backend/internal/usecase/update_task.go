package usecase

import (
	"context"
	"strings"

	"github.com/daisuke-harada/enman/internal/apperror"
	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
)

type UpdateTaskInputPort interface {
	Execute(ctx context.Context, input UpdateTaskInput) (*UpdateTaskOutput, error)
}

type UpdateTaskInput struct {
	TaskID        uint
	Title         string
	Category      *string
	CurrentUserID uint
}

func (i *UpdateTaskInput) Validate() error {
	var errs []string
	if strings.TrimSpace(i.Title) == "" {
		errs = append(errs, "タスク名を入力してください")
	}
	if len(errs) > 0 {
		return apperror.UnprocessableEntity(errs...)
	}
	return nil
}

type UpdateTaskOutput struct {
	Task *model.Task
}

type UpdateTaskInteractor struct {
	TaskRepo repository.TaskRepository
	UserRepo repository.UserRepository
}

func NewUpdateTaskInteractor(taskRepo repository.TaskRepository, userRepo repository.UserRepository) *UpdateTaskInteractor {
	return &UpdateTaskInteractor{TaskRepo: taskRepo, UserRepo: userRepo}
}

func (i *UpdateTaskInteractor) Execute(ctx context.Context, input UpdateTaskInput) (*UpdateTaskOutput, error) {
	if err := input.Validate(); err != nil {
		return nil, err
	}

	user, err := i.UserRepo.FindByID(ctx, input.CurrentUserID)
	if err != nil || user.FamilyID == nil {
		return nil, apperror.Forbidden()
	}

	task, err := i.TaskRepo.FindByID(ctx, input.TaskID)
	if err != nil {
		return nil, apperror.NotFound()
	}

	if task.FamilyID != *user.FamilyID {
		return nil, apperror.Forbidden()
	}

	task.Title = input.Title
	task.Category = input.Category
	if err := i.TaskRepo.Update(ctx, task); err != nil {
		return nil, apperror.InternalServerError(err)
	}

	return &UpdateTaskOutput{Task: task}, nil
}
